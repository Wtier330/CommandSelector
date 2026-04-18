// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_script_file(path: String) -> Result<String, String> {
    // 先尝试用 UTF-8 读取
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(_) => {
            // 如果 UTF-8 失败，读取为字节并使用 GB18030（Windows 中文默认编码）解码
            let bytes = std::fs::read(&path)
                .map_err(|e| format!("无法读取文件: {}", e))?;

            // 使用 GB18030 解码，这是 Windows 中文系统的默认 ANSI 编码
            let (decoded, _, _) = encoding_rs::GB18030.decode(&bytes);
            Ok(decoded.to_string())
        }
    }
}

#[tauri::command]
fn write_script_file(path: String, content: String) -> Result<(), String> {
    // 确保父目录存在
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建目录: {}", e))?;
    }

    std::fs::write(&path, content)
        .map_err(|e| format!("无法写入文件: {}", e))
}

#[tauri::command]
fn delete_script_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path)
        .map_err(|e| format!("删除文件失败: {}", e))
}

#[tauri::command]
fn copy_script_file(src: String, dst: String) -> Result<(), String> {
    // 确保目标目录存在
    if let Some(parent) = std::path::Path::new(&dst).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建目录: {}", e))?;
    }

    std::fs::copy(&src, &dst)
        .map_err(|e| format!("复制文件失败: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_script_file,
            write_script_file,
            delete_script_file,
            copy_script_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
