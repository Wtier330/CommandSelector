use std::path::PathBuf;
use serde::{Deserialize, Serialize};

/// 日志条目结构
#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub category: String,
    pub level: String,
    pub message: String,
    pub data: Option<String>,
}

/// 获取日志目录路径，优先使用程序安装目录
pub fn get_log_dir() -> PathBuf {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let log_dir = exe_dir.join("logs");
            if std::fs::create_dir_all(&log_dir).is_ok() {
                let test_file = log_dir.join(".write-test");
                if std::fs::write(&test_file, b"test").is_ok() {
                    let _ = std::fs::remove_file(&test_file);
                    return log_dir;
                }
            }
        }
    }
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("logs")
}

/// 追加日志条目（供前端调用）
#[tauri::command]
pub async fn append_log(entry: LogEntry) -> Result<(), String> {
    let log_dir = get_log_dir();
    let log_file = log_dir.join(format!("{}.log", entry.category.to_lowercase()));

    let timestamp = chrono_lite_timestamp();
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
pub fn chrono_lite_timestamp() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap();
    let secs = now.as_secs();
    let millis = now.subsec_millis();

    let datetime = timestamp_to_datetime(secs as i64);
    let (year, month, day, hour, min, sec) = datetime;
    let total_hours = hour as i64 + 8;

    if total_hours >= 24 {
        let extra_days = total_hours / 24;
        let new_hour = (total_hours % 24) as u32;
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

fn timestamp_to_datetime(secs: i64) -> (i32, u32, u32, u32, u32, u32) {
    let days = secs / 86400;
    let remaining = secs % 86400;
    let hours = remaining / 3600;
    let minutes = (remaining % 3600) / 60;
    let seconds = remaining % 60;

    let mut year = 1970;
    let mut month = 1;
    let mut day = 1;

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
