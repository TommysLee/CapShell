use crate::utils::get_exe_dir;
use std::fs;
use chrono::Local;
use log::{error, info, LevelFilter};

// ---------- 日志系统 ----------

/// 初始化日志系统：
/// - 在 exe 同级目录创建 `logs/` 文件夹
/// - 日志文件按天滚动，格式为 `app_YYYY-MM-DD.log`
/// - 同时输出到控制台（便于开发调试）
pub fn init_logging() -> Result<(), fern::InitError> {
    let exe_dir = get_exe_dir();
    let logs_dir = exe_dir.join("logs");

    // 改为 ? 将错误向上传播，不 panic
    fs::create_dir_all(&logs_dir)?;

    let log_file_path = logs_dir.join(format!("app_{}.log", Local::now().format("%Y-%m-%d")));

    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                message
            ))
        })
        .level(LevelFilter::Info)
        .chain(std::io::stdout()) // 控制台输出
        .chain(
            fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(log_file_path)?,
        )
        .apply()?;

    info!("日志系统初始化成功，日志目录: {}", logs_dir.display());
    Ok(())
}

/// 设置备用 stderr 日志（仅在文件日志初始化失败时使用）
pub fn setup_fallback_logger() {
    let _ = fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "{} [{}] {}",
                Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                message
            ))
        })
        .level(LevelFilter::Info)
        .chain(std::io::stderr())
        .apply();
}

// ---------- Panic Hook ----------
/// 设置全局 panic hook，将崩溃信息同时输出到 stderr 和日志文件
pub fn setup_panic_hook() {
    std::panic::set_hook(Box::new(|panic_info| {
        let message = panic_info
            .payload()
            .downcast_ref::<String>()
            .map(|s| s.to_string())
            .or_else(|| {
                panic_info
                    .payload()
                    .downcast_ref::<&str>()
                    .map(|s| s.to_string())
            })
            .unwrap_or_else(|| "未知错误".to_string());

        let location = panic_info
            .location()
            .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()))
            .unwrap_or_else(|| "位置未知".to_string());

        // 确保即使日志系统未初始化也能看到错误
        eprintln!("程序崩溃: {} (位置: {})", message, location);
        error!("程序崩溃: {} (位置: {})", message, location);
    }));
}