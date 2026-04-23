use crate::log_utils::get_log_dir;

/// 读取调试日志
#[tauri::command]
pub fn read_debug_log(module: Option<String>) -> Result<String, String> {
    let logs_dir = get_log_dir();

    if !logs_dir.exists() {
        return Ok("日志目录不存在，请先运行应用以生成日志".to_string());
    }

    if let Some(module_name) = module {
        let log_path = logs_dir.join(format!(
            "{}.log",
            module_name.to_lowercase().replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "_")
        ));

        if !log_path.exists() {
            return Ok(format!("未找到模块 '{}' 的日志文件", { module_name }));
        }

        return std::fs::read_to_string(&log_path)
            .map_err(|e| format!("无法读取日志文件: {}", e));
    }

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

/// 获取日志目录路径
#[tauri::command]
pub fn get_logs_dir() -> Result<String, String> {
    Ok(get_log_dir().to_string_lossy().to_string())
}

/// 诊断日志系统
#[tauri::command]
pub fn diagnose_logs() -> Result<String, String> {
    let mut result = String::from("日志诊断结果:\n\n");

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
                let _ = std::fs::remove_file(&test_file);
            },
            Err(e) => result.push_str(&format!("   写入文件: 失败 - {}\n", e)),
        }
    }

    Ok(result)
}
