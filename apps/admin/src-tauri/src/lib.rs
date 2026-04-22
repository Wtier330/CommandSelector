use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri_plugin_log::{Target, TargetKind};

/// 获取日志目录路径，优先使用程序安装目录
fn get_log_dir() -> PathBuf {
    // 优先尝试程序所在目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let log_dir = exe_dir.join("logs");
            // 测试写入权限
            if std::fs::create_dir_all(&log_dir).is_ok() {
                let test_file = log_dir.join(".write-test");
                if std::fs::write(&test_file, b"test").is_ok() {
                    let _ = std::fs::remove_file(&test_file);
                    return log_dir;
                }
            }
        }
    }

    // 回退到应用数据目录
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("logs")
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub category: String,
    pub level: String,
    pub message: String,
    pub data: Option<String>,
}

/// 追加日志条目（供前端调用）
#[tauri::command]
async fn append_log(entry: LogEntry) -> Result<(), String> {
    let log_dir = get_log_dir();
    let log_file = log_dir.join(format!("{}.log", entry.category.to_lowercase()));

    let timestamp = chrono_lite_timestamp();
    // 单行输出，data 作为独立字段
    let line = if let Some(ref data) = entry.data {
        format!(
            "[{}] [{}] {} | {}\n",
            timestamp,
            entry.level.to_uppercase(),
            entry.message,
            data
        )
    } else {
        format!(
            "[{}] [{}] {}\n",
            timestamp,
            entry.level.to_uppercase(),
            entry.message
        )
    };

    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)
        .map_err(|e| e.to_string())?;

    use std::io::Write;
    file.write_all(line.as_bytes()).map_err(|e| e.to_string())?;

    Ok(())
}

/// 获取格式化的时间戳 (北京时间 UTC+8)
fn chrono_lite_timestamp() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let secs = now.as_secs();
    let millis = now.subsec_millis();

    // Unix 时间戳是 UTC，先转换为 UTC 日期时间
    let datetime = timestamp_to_datetime(secs as i64);

    // 加上 8 小时处理日期溢出
    let (year, month, day, hour, min, sec) = datetime;
    let total_hours = hour as i64 + 8;

    if total_hours >= 24 {
        // 跨天，需要重新计算日期
        let extra_days = total_hours / 24;
        let new_hour = (total_hours % 24) as u32;
        // 简单地处理，不做完整的日期计算
        // 对于绝大多数情况这已经足够
        let new_date = add_days_to_date(year, month as u32, day as u32, extra_days as i32);
        format!(
            "{:04}-{:02}-{:02} {:02}:{:02}:{:02}.{:03}",
            new_date.0, new_date.1, new_date.2,
            new_hour, min, sec,
            millis
        )
    } else {
        format!(
            "{:04}-{:02}-{:02} {:02}:{:02}:{:02}.{:03}",
            year, month, day,
            total_hours as u32, min, sec,
            millis
        )
    }
}

/// 给日期加上 N 天
fn add_days_to_date(year: i32, month: u32, day: u32, days: i32) -> (i32, u32, u32) {
    let days_in_month = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut new_year = year;
    let mut new_month = month;
    let mut new_day = day + days as u32;

    while new_day > days_in_month[(new_month - 1) as usize] as u32 {
        new_day -= days_in_month[(new_month - 1) as usize] as u32;
        new_month += 1;
        if new_month > 12 {
            new_month = 1;
            new_year += 1;
        }
    }

    (new_year, new_month, new_day)
}

/// 将 Unix 时间戳转换为 (年, 月, 日, 时, 分, 秒)
fn timestamp_to_datetime(secs: i64) -> (i32, u32, u32, u32, u32, u32) {
    // 简化的时间转换，使用算法而非库
    let days = secs / 86400;
    let remaining = secs % 86400;
    let hours = remaining / 3600;
    let minutes = (remaining % 3600) / 60;
    let seconds = remaining % 60;

    // 计算日期 (从 1970-01-01 开始)
    // 1970-01-01 是周四
    let mut year = 1970;
    let mut month = 1;
    let mut day = 1;

    // 累计天数
    let mut days_left = days;
    while days_left > 0 {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if days_left >= days_in_year {
            days_left -= days_in_year;
            year += 1;
        } else {
            break;
        }
    }

    // 计算月份和日期
    let days_in_months = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    for i in 0..12 {
        if days_left < days_in_months[i] as i64 {
            month = i + 1;
            day = days_left as u32 + 1;
            break;
        }
        days_left -= days_in_months[i] as i64;
    }

    (year, month as u32, day, hours as u32, minutes as u32, seconds as u32)
}

fn is_leap_year(year: i32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

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

#[tauri::command]
fn read_debug_log(module: Option<String>) -> Result<String, String> {
    let logs_dir = get_log_dir();

    // 如果 logs 目录不存在
    if !logs_dir.exists() {
        return Ok("日志目录不存在，请先运行应用以生成日志".to_string());
    }

    // 如果指定了模块，读取该模块的日志文件
    if let Some(module_name) = module {
        let log_path = logs_dir.join(format!("{}.log", module_name.to_lowercase().replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "_")));

        if !log_path.exists() {
            return Ok(format!("未找到模块 '{}' 的日志文件", { module_name }));
        }

        return std::fs::read_to_string(&log_path)
            .map_err(|e| format!("无法读取日志文件: {}", e));
    }

    // 如果没有指定模块，列出所有日志文件
    let mut result = String::from("可用的日志模块:\n\n");

    if let Ok(entries) = std::fs::read_dir(&logs_dir) {
        let mut files: Vec<String> = Vec::new();

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_stem() {
                    if let Some(name_str) = file_name.to_str() {
                        files.push(name_str.to_string());
                    }
                }
            }
        }

        if files.is_empty() {
            result.push_str("logs 目录中没有找到日志文件");
        } else {
            files.sort();
            for (index, file) in files.iter().enumerate() {
                result.push_str(&format!("{}. {}\n", index + 1, file));
            }
            result.push_str("\n提示: 使用 read_debug_log('module_name') 读取特定模块的日志");
        }
    } else {
        result.push_str("无法读取 logs 目录");
    }

    Ok(result)
}

#[tauri::command]
fn get_logs_dir() -> Result<String, String> {
    Ok(get_log_dir().to_string_lossy().to_string())
}

#[tauri::command]
fn diagnose_logs() -> Result<String, String> {
    let mut result = String::from("日志诊断结果:\n\n");

    // 1. 检查实际日志目录（优先 exe 目录）
    let actual_logs_dir = get_log_dir();
    result.push_str(&format!("1. 实际使用日志目录:\n"));
    result.push_str(&format!("   路径: {}\n", actual_logs_dir.display()));
    result.push_str(&format!("   存在: {}\n", actual_logs_dir.exists()));

    if actual_logs_dir.exists() {
        let mut file_count = 0;
        let mut total_size = 0u64;

        if let Ok(entries) = std::fs::read_dir(&actual_logs_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        file_count += 1;
                        total_size += meta.len();
                        if let Some(name) = entry.file_name().to_str() {
                            result.push_str(&format!("   - {} ({} bytes)\n", name, meta.len()));
                        }
                    }
                }
            }
        }

        result.push_str(&format!("   文件数: {}\n", file_count));
        result.push_str(&format!("   总大小: {} bytes\n\n", total_size));
    }

    // 2. 检查应用数据目录
    if let Some(data_dir) = dirs::data_local_dir() {
        let logs_dir = data_dir.join("logs");
        result.push_str(&format!("2. 应用数据目录 logs:\n"));
        result.push_str(&format!("   路径: {}\n", logs_dir.display()));
        result.push_str(&format!("   存在: {}\n", logs_dir.exists()));

        if logs_dir.exists() {
            let mut file_count = 0;
            let mut total_size = 0u64;

            if let Ok(entries) = std::fs::read_dir(&logs_dir) {
                for entry in entries.flatten() {
                    if let Ok(meta) = entry.metadata() {
                        if meta.is_file() {
                            file_count += 1;
                            total_size += meta.len();
                            if let Some(name) = entry.file_name().to_str() {
                                result.push_str(&format!("   - {} ({} bytes)\n", name, meta.len()));
                            }
                        }
                    }
                }
            }

            result.push_str(&format!("   文件数: {}\n", file_count));
            result.push_str(&format!("   总大小: {} bytes\n\n", total_size));
        }
    } else {
        result.push_str("2. 无法获取应用数据目录\n\n");
    }

    // 3. 检查文档目录
    if let Some(doc_dir) = dirs::document_dir() {
        let logs_dir = doc_dir.join("logs");
        result.push_str(&format!("3. 文档目录 logs:\n"));
        result.push_str(&format!("   路径: {}\n", logs_dir.display()));
        result.push_str(&format!("   存在: {}\n", logs_dir.exists()));

        if logs_dir.exists() {
            let mut file_count = 0;

            if let Ok(entries) = std::fs::read_dir(&logs_dir) {
                for entry in entries.flatten() {
                    if let Ok(meta) = entry.metadata() {
                        if meta.is_file() {
                            file_count += 1;
                            if let Some(name) = entry.file_name().to_str() {
                                result.push_str(&format!("   - {} ({} bytes)\n", name, meta.len()));
                            }
                        }
                    }
                }
            }

            result.push_str(&format!("   文件数: {}\n\n", file_count));
        }
    } else {
        result.push_str("3. 无法获取文档目录\n\n");
    }

    // 4. 检查程序同目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let logs_dir = exe_dir.join("logs");
            result.push_str(&format!("4. 程序同目录 logs:\n"));
            result.push_str(&format!("   路径: {}\n", logs_dir.display()));
            result.push_str(&format!("   存在: {}\n", logs_dir.exists()));

            if logs_dir.exists() {
                let mut file_count = 0;

                if let Ok(entries) = std::fs::read_dir(&logs_dir) {
                    for entry in entries.flatten() {
                        if let Ok(meta) = entry.metadata() {
                            if meta.is_file() {
                                file_count += 1;
                                if let Some(name) = entry.file_name().to_str() {
                                    result.push_str(&format!("   - {} ({} bytes)\n", name, meta.len()));
                                }
                            }
                        }
                    }
                }

                result.push_str(&format!("   文件数: {}\n\n", file_count));
            }
        }
    } else {
        result.push_str("4. 无法获取程序路径\n\n");
    }

    // 5. 测试写入权限
    if let Some(data_dir) = dirs::data_local_dir() {
        let test_dir = data_dir.join("logs");
        let test_file = test_dir.join("write-test.tmp");

        result.push_str(&format!("5. 写入测试:\n"));
        result.push_str(&format!("   测试文件: {}\n", test_file.display()));

        match std::fs::create_dir_all(&test_dir) {
            Ok(_) => result.push_str("   创建目录: 成功\n"),
            Err(e) => result.push_str(&format!("   创建目录: 失败 - {}\n", e)),
        }

        match std::fs::write(&test_file, b"test") {
            Ok(_) => {
                result.push_str("   写入文件: 成功\n");
                // 清理测试文件
                let _ = std::fs::remove_file(&test_file);
            },
            Err(e) => result.push_str(&format!("   写入文件: 失败 - {}\n", e)),
        }
    }

    Ok(result)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            // 只输出到 stdout，文件日志由前端的 append_log 命令处理
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                ])
                .level(log::LevelFilter::Info)
                .build()
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_script_file,
            write_script_file,
            delete_script_file,
            copy_script_file,
            read_debug_log,
            get_logs_dir,
            diagnose_logs,
            append_log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
