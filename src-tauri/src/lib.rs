mod utils;
mod config;
mod logging;
mod window;
mod commands;

// ---------- 应用入口 ----------
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. 初始化日志（若失败，尝试建立仅 stderr 的后备 logger）
    if let Err(e) = logging::init_logging() {
        eprintln!("日志初始化失败: {}", e);
        logging::setup_fallback_logger();
    }

    // 2. 设置 panic hook（崩溃后记录）
    logging::setup_panic_hook();

    // 3. 加载自定义配置
    let config = config::load_config();

    // 4. 读取单例配置
    let enable_single_instance = config
        .get("single_instance")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    // 5. 构建 Tauri 应用
    let mut builder = tauri::Builder::default()
        .manage(config)
        .setup(|app| {
            window::setup_window_title(app);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init());

    // 6. 根据配置决定是否启用单例模式
    if enable_single_instance {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            window::focus_main_window(app);
        }));
    }

    // 7. 启动 Tauri
    builder
        .invoke_handler(tauri::generate_handler![
            commands::get_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
