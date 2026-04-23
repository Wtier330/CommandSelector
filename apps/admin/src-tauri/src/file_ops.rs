/// 读取脚本文件，支持 UTF-8 和 GB18030 编码
#[tauri::command]
pub fn read_script_file(path: String) -> Result<String, String> {
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(_) => {
            let bytes = std::fs::read(&path)
                .map_err(|e| format!("无法读取文件: {}", e))?;
            let (decoded, _, _) = encoding_rs::GB18030.decode(&bytes);
            Ok(decoded.to_string())
        }
    }
}

/// 写入脚本文件，自动创建父目录
#[tauri::command]
pub fn write_script_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建目录: {}", e))?;
    }
    std::fs::write(&path, content)
        .map_err(|e| format!("无法写入文件: {}", e))
}

/// 删除脚本文件
#[tauri::command]
pub fn delete_script_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path)
        .map_err(|e| format!("删除文件失败: {}", e))
}

/// 复制脚本文件
#[tauri::command]
pub fn copy_script_file(src: String, dst: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&dst).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建目录: {}", e))?;
    }
    std::fs::copy(&src, &dst)
        .map_err(|e| format!("复制文件失败: {}", e))?;
    Ok(())
}
