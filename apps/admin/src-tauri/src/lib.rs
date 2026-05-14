mod ai_config;
mod app_paths;
mod clipboard;
mod debug;
mod file_ops;
mod global_hotkey;
mod log_utils;
mod search;
mod shell_open;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([Target::new(TargetKind::Stdout)])
                .level(log::LevelFilter::Info)
                .build()
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            app_paths::get_app_paths,
            clipboard::copy_file_to_clipboard,
            clipboard::get_clipboard_text,
            file_ops::read_script_file,
            file_ops::write_script_file,
            file_ops::delete_script_file,
            file_ops::copy_script_file,
            file_ops::list_script_files,
            debug::read_debug_log,
            debug::get_logs_dir,
            debug::diagnose_logs,
            log_utils::append_log,
            search::search_commands,
            search::search_scripts,
            ai_config::load_ai_config,
            ai_config::save_ai_config,
            ai_config::load_ai_prompts,
            ai_config::save_ai_prompts,
            shell_open::open_in_explorer,
            global_hotkey::register_global_hotkey,
            global_hotkey::unregister_global_hotkey,
            global_hotkey::get_default_hotkey,
            global_hotkey::toggle_window_visibility,
        ])
        .setup(move |app| {
            // 设置主窗口图标
            if let Some(window) = app.get_webview_window("main") {
                let window_icon = tauri::image::Image::from_bytes(include_bytes!(
                    "../icons/icon.ico"
                ))?;
                let _ = window.set_icon(window_icon);
            }

            // 创建托盘菜单
            let toggle_item = MenuItem::with_id(
                app, "toggle_visibility", "显示/隐藏主窗口", true, None::<&str>,
            )?;
            let quit_item = MenuItem::with_id(
                app, "quit", "退出", true, None::<&str>,
            )?;
            let tray_menu = Menu::with_id(app, "tray_menu")?;
            tray_menu.append(&toggle_item)?;
            tray_menu.append(&quit_item)?;

            // 加载托盘图标
            let icon = tauri::image::Image::from_bytes(include_bytes!(
                "../icons/32x32.png"
            ))?;

            // 构建系统托盘
            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .tooltip("CommandSelector")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "toggle_visibility" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let is_visible = window.is_visible().unwrap_or(false);
                                let is_minimized = window.is_minimized().unwrap_or(false);
                                if is_visible && !is_minimized {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.unminimize();
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle().clone();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            let is_minimized = window.is_minimized().unwrap_or(false);
                            if is_visible && !is_minimized {
                                let _ = window.hide();
                            } else {
                                let _ = window.unminimize();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // 拦截关闭请求：隐藏到托盘而非退出
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
