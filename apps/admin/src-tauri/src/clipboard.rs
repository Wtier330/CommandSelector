use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::path::Path;

/// 将文件路径复制到剪贴板，使其可以被粘贴为文件
#[tauri::command]
pub fn copy_file_to_clipboard(file_path: String) -> Result<(), String> {
    use windows::Win32::Foundation::HANDLE;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Memory::{GlobalAlloc, GlobalLock, GlobalUnlock, GHND};
    use windows::Win32::System::DataExchange::{
        CloseClipboard, EmptyClipboard, OpenClipboard, SetClipboardData,
    };

    let path = Path::new(&file_path);

    // 检查文件是否存在
    if !path.exists() {
        return Err(format!("文件不存在: {}", file_path));
    }

    // 获取绝对路径
    let absolute_path = path.canonicalize()
        .map_err(|e| format!("获取绝对路径失败: {}", e))?;

    // 转换为 UTF-16 字符串（Windows 使用 UTF-16）
    let mut path_utf16: Vec<u16> = OsStr::new(&absolute_path)
        .encode_wide()
        .collect();

    // DROPFILES 格式需要两个 null 终止符
    path_utf16.push(0);
    path_utf16.push(0);

    // 创建 DROPFILES 结构体
    #[repr(C)]
    struct DropFiles {
        p_files: u32,      // 指向文件列表的偏移量
        pt: [i32; 2],      // 鼠标位置 (x, y)
        f_nc: i32,         // 是否非客户端区域
        fwide: i32,        // 是否使用宽字符 (1 = 是)
    }

    // 计算文件列表的字节长度
    let file_list_size = path_utf16.len() * std::mem::size_of::<u16>();

    // DROPFILES 结构体大小 + 文件列表大小
    let total_size = std::mem::size_of::<DropFiles>() + file_list_size;

    // 分配内存
    let hglobal = unsafe {
        GlobalAlloc(GHND, total_size)
            .map_err(|e| format!("分配内存失败: {:?}", e))?
    };

    // 锁定内存
    let locked = unsafe { GlobalLock(hglobal) };

    if locked.is_null() {
        return Err("锁定内存失败".to_string());
    }

    // 创建 DROPFILES 结构体
    let dropfiles = DropFiles {
        p_files: std::mem::size_of::<DropFiles>() as u32,
        pt: [0, 0],
        f_nc: 0,
        fwide: 1,  // 使用宽字符
    };

    // 将 DROPFILES 结构体和文件路径写入内存
    unsafe {
        let dropfiles_ptr: *mut DropFiles = locked as *mut DropFiles;
        std::ptr::write(dropfiles_ptr, dropfiles);

        // 将文件路径写入 DROPFILES 后面的位置
        let file_list_ptr = (locked as *const u8).add(std::mem::size_of::<DropFiles>()) as *mut u16;
        for (i, &c) in path_utf16.iter().enumerate() {
            *file_list_ptr.add(i) = c;
        }

        // 解锁内存
        GlobalUnlock(hglobal).ok();
    }

    // 设置剪贴板数据 (CF_HDROP = 15)
    unsafe {
        OpenClipboard(Some(HWND::default()))
            .map_err(|e| format!("打开剪贴板失败: {:?}", e))?;

        EmptyClipboard()
            .map_err(|e| {
                let _ = CloseClipboard();
                format!("清空剪贴板失败: {:?}", e)
            })?;

        SetClipboardData(15, Some(HANDLE(hglobal.0)))
            .map_err(|e| {
                let _ = CloseClipboard();
                format!("设置剪贴板数据失败: {:?}", e)
            })?;

        CloseClipboard()
            .map_err(|e| format!("关闭剪贴板失败: {:?}", e))?;
    }

    Ok(())
}

/// 获取剪贴板中的文本内容
#[tauri::command]
pub fn get_clipboard_text() -> Result<String, String> {
    use clipboard_win::get_clipboard_string;
    get_clipboard_string()
        .map_err(|e| format!("获取剪贴板内容失败: {:?}", e))
}