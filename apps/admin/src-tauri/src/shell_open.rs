/// 在文件资源管理器中打开路径
#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let result = Command::new("explorer")
            .arg(&path)
            .spawn();
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open explorer: {}", e)),
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let result = Command::new("open")
            .arg(&path)
            .spawn();
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        let result = Command::new("xdg-open")
            .arg(&path)
            .spawn();
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open: {}", e)),
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err(format!("Unsupported platform for opening file explorer"))
    }
}