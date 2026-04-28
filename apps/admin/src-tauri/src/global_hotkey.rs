use tauri::{AppHandle, Emitter, Manager};
use windows::Win32::Foundation::*;
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::WindowsAndMessaging::*;
use std::sync::Mutex as StdMutex;
use std::sync::OnceLock;
use std::sync::mpsc;

/// 快捷键注册/注销命令
#[allow(dead_code)]
enum HotkeyCommand {
    Register { modifiers: u32, vk: u32 },
    Unregister,
    Shutdown,
}

/// 快捷键状态管理
pub struct HotkeyState {
    registered: bool,
    modifiers: u32,
    vk: u32,
}

impl HotkeyState {
    pub fn new() -> Self {
        Self {
            registered: false,
            modifiers: MOD_ALT.0,
            vk: 0x43, // C 键
        }
    }

    pub fn is_registered(&self) -> bool {
        self.registered
    }

    pub fn set_registered(&mut self, value: bool) {
        self.registered = value;
    }
}

// 全局状态
static HOTKEY_STATE: OnceLock<StdMutex<HotkeyState>> = OnceLock::new();
// 命令通道：向热键线程发送命令
static HOTKEY_SENDER: OnceLock<mpsc::Sender<HotkeyCommand>> = OnceLock::new();
// 全局 AppHandle
static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

fn get_hotkey_state() -> &'static StdMutex<HotkeyState> {
    HOTKEY_STATE.get_or_init(|| StdMutex::new(HotkeyState::new()))
}

/// 窗口过程，处理 WM_HOTKEY 消息
unsafe extern "system" fn hotkey_wnd_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    if msg == WM_HOTKEY {
        if let Some(app) = APP_HANDLE.get() {
            let _ = app.emit("global-hotkey-pressed", ());
        }
        return LRESULT(0);
    }

    unsafe { DefWindowProcW(hwnd, msg, wparam, lparam) }
}

/// 启动热键线程：在同一线程中创建隐藏窗口、注册热键、运行消息循环
fn start_hotkey_thread() -> mpsc::Sender<HotkeyCommand> {
    let (tx, rx) = mpsc::channel::<HotkeyCommand>();

    std::thread::spawn(move || {
        unsafe {
            let class_name = windows::core::w!("CommandSelectorHotkeySink");
            let h_module = windows::Win32::System::LibraryLoader::GetModuleHandleW(None)
                .unwrap_or_default();

            let wc = WNDCLASSW {
                lpfnWndProc: Some(hotkey_wnd_proc),
                hInstance: HINSTANCE(h_module.0),
                lpszClassName: class_name,
                ..Default::default()
            };

            let _ = RegisterClassW(&wc);

            let sink_hwnd = CreateWindowExW(
                WINDOW_EX_STYLE::default(),
                class_name,
                windows::core::w!("HotkeySink"),
                WINDOW_STYLE::default(),
                0, 0, 0, 0,
                None,
                None,
                Some(HINSTANCE(h_module.0)),
                None,
            );

            let sink_hwnd = match sink_hwnd {
                Ok(h) if !h.is_invalid() => h,
                _ => {
                    log::error!("创建热键消息窗口失败");
                    return;
                }
            };

            // 消息循环：同时处理窗口消息和命令通道
            let mut msg = MSG::default();
            'main_loop: loop {
                if PeekMessageW(&mut msg, None, 0, 0, PM_REMOVE).as_bool() {
                    if msg.message == WM_QUIT {
                        break 'main_loop;
                    }
                    let _ = TranslateMessage(&msg);
                    DispatchMessageW(&msg);
                }

                match rx.try_recv() {
                    Ok(HotkeyCommand::Register { modifiers, vk }) => {
                        let _ = UnregisterHotKey(Some(sink_hwnd), 1);
                        let result = RegisterHotKey(
                            Some(sink_hwnd),
                            1,
                            HOT_KEY_MODIFIERS(modifiers),
                            vk,
                        );
                        if result.is_err() {
                            if let Some(app) = APP_HANDLE.get() {
                                let _ = app.emit("hotkey-register-failed", ());
                            }
                        }
                    }
                    Ok(HotkeyCommand::Unregister) => {
                        let _ = UnregisterHotKey(Some(sink_hwnd), 1);
                    }
                    Ok(HotkeyCommand::Shutdown) => {
                        let _ = UnregisterHotKey(Some(sink_hwnd), 1);
                        PostQuitMessage(0);
                    }
                    Err(mpsc::TryRecvError::Empty) => {
                        std::thread::sleep(std::time::Duration::from_millis(10));
                    }
                    Err(mpsc::TryRecvError::Disconnected) => {
                        let _ = UnregisterHotKey(Some(sink_hwnd), 1);
                        break 'main_loop;
                    }
                }
            }
        }
    });

    tx
}

fn ensure_hotkey_thread() -> &'static mpsc::Sender<HotkeyCommand> {
    HOTKEY_SENDER.get_or_init(|| start_hotkey_thread())
}

/// 注册全局快捷键
#[tauri::command]
pub fn register_global_hotkey(
    app: AppHandle,
    modifiers: u32,
    vk: u32,
) -> Result<bool, String> {
    let mut state = get_hotkey_state().lock().unwrap();

    let _ = APP_HANDLE.set(app.clone());

    let sender = ensure_hotkey_thread();
    sender
        .send(HotkeyCommand::Register { modifiers, vk })
        .map_err(|e| format!("发送注册命令失败: {}", e))?;

    state.set_registered(true);
    state.modifiers = modifiers;
    state.vk = vk;

    Ok(true)
}

/// 注销全局快捷键
#[tauri::command]
pub fn unregister_global_hotkey() -> Result<bool, String> {
    let mut state = get_hotkey_state().lock().unwrap();
    if state.is_registered() {
        let sender = ensure_hotkey_thread();
        let _ = sender.send(HotkeyCommand::Unregister);
        state.set_registered(false);
    }
    Ok(true)
}

/// 切换窗口可见性
#[tauri::command]
pub fn toggle_window_visibility(app: AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main").ok_or("找不到主窗口")?;

    let is_minimized = window.is_minimized().map_err(|e| e.to_string())?;
    let is_visible = window.is_visible().map_err(|e| e.to_string())?;

    // 最小化或不可见时：恢复窗口
    if is_minimized || !is_visible {
        window.unminimize().map_err(|e| e.to_string())?;
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        let window_clone = window.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(100));
            let _ = window_clone.set_always_on_top(false);
        });
    } else {
        // 窗口可见且未最小化：隐藏到托盘
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 获取默认快捷键配置
#[tauri::command]
pub fn get_default_hotkey() -> HotkeyConfig {
    HotkeyConfig::default()
}

/// 快捷键配置
#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct HotkeyConfig {
    pub enabled: bool,
    pub modifiers: u32,
    pub virtual_key: u32,
    pub display_name: String,
}

impl Default for HotkeyConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            modifiers: MOD_ALT.0,
            virtual_key: 0x43, // C 键 (VK_C)
            display_name: "Alt + C".to_string(),
        }
    }
}
