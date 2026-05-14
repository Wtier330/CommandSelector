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

/// 支持的脚本文件扩展名
const SUPPORTED_EXTENSIONS: &[&str] = &["bat", "cmd", "ps1", "vbs", "sh", "bash", "py"];

/// 扫描目录中所有支持的脚本文件（递归）
#[tauri::command]
pub fn list_script_files(dir: String) -> Result<Vec<String>, String> {
    let mut files: Vec<String> = Vec::new();
    let path = std::path::Path::new(&dir);
    if !path.is_dir() {
        return Err(format!("不是一个有效的目录: {}", dir));
    }
    scan_dir(path, &mut files)?;
    files.sort();
    Ok(files)
}

fn scan_dir(dir: &std::path::Path, files: &mut Vec<String>) -> Result<(), String> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| format!("无法读取目录 {}: {}", dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        let file_type = entry.file_type()
            .map_err(|e| format!("读取文件类型失败: {}", e))?;

        if file_type.is_dir() {
            // 跳过隐藏目录和常见的非脚本目录
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with('.') || name == "node_modules" || name == "__pycache__" {
                    continue;
                }
            }
            scan_dir(&path, files)?;
        } else if file_type.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str()) {
                    files.push(path.to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(())
}
