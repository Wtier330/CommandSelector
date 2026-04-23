mod debug;
mod file_ops;
mod log_utils;
mod search;

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
        .invoke_handler(tauri::generate_handler![
            greet,
            file_ops::read_script_file,
            file_ops::write_script_file,
            file_ops::delete_script_file,
            file_ops::copy_script_file,
            debug::read_debug_log,
            debug::get_logs_dir,
            debug::diagnose_logs,
            log_utils::append_log,
            search::search_commands,
            search::search_scripts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
