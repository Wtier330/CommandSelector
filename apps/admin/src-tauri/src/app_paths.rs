use serde::{Deserialize, Serialize};

/// 数据路径信息结构
#[derive(Debug, Serialize, Deserialize)]
pub struct AppPathInfo {
    pub name: String,
    pub path: String,
    pub description: String,
}

/// 获取应用所有数据路径
#[tauri::command]
pub fn get_app_paths() -> Result<Vec<AppPathInfo>, String> {
    let mut paths = Vec::new();

    // 1. 应用本地数据目录
    if let Some(data_dir) = dirs::data_local_dir() {
        let command_selector_dir = data_dir.join("CommandSelector");
        paths.push(AppPathInfo {
            name: "应用数据目录".to_string(),
            path: command_selector_dir.to_string_lossy().to_string(),
            description: "存储所有应用数据".to_string(),
        });
    }

    // 2. 日志目录
    let log_dir = crate::log_utils::get_log_dir();
    paths.push(AppPathInfo {
        name: "日志目录".to_string(),
        path: log_dir.to_string_lossy().to_string(),
        description: "存储应用日志文件".to_string(),
    });

    // 3. 脚本数据目录
    if let Some(data_dir) = dirs::data_local_dir() {
        let scripts_dir = data_dir.join("CommandSelector").join("scripts");
        paths.push(AppPathInfo {
            name: "脚本数据目录".to_string(),
            path: scripts_dir.to_string_lossy().to_string(),
            description: "存储脚本物理文件".to_string(),
        });
    }

    // 4. 脚本索引文件
    if let Some(data_dir) = dirs::data_local_dir() {
        let scripts_file = data_dir.join("CommandSelector").join("scripts.json");
        paths.push(AppPathInfo {
            name: "脚本索引文件".to_string(),
            path: scripts_file.to_string_lossy().to_string(),
            description: "脚本元数据索引".to_string(),
        });
    }

    // 5. 命令库文件
    if let Some(data_dir) = dirs::data_local_dir() {
        let library_file = data_dir.join("CommandSelector").join("library.json");
        paths.push(AppPathInfo {
            name: "命令库文件".to_string(),
            path: library_file.to_string_lossy().to_string(),
            description: "命令库数据".to_string(),
        });
    }

    // 6. AI 配置文件
    if let Some(data_dir) = dirs::data_local_dir() {
        let ai_config_file = data_dir.join("CommandSelector").join("ai_config.json");
        paths.push(AppPathInfo {
            name: "AI 配置文件".to_string(),
            path: ai_config_file.to_string_lossy().to_string(),
            description: "AI 服务配置".to_string(),
        });
    }

    // 7. 程序可执行文件目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            paths.push(AppPathInfo {
                name: "程序目录".to_string(),
                path: exe_dir.to_string_lossy().to_string(),
                description: "应用安装目录".to_string(),
            });
        }
    }

    Ok(paths)
}