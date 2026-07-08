use serde_json::Value;
use tauri::{App, AppHandle, Manager};
use log::{error, warn};

// ---------- 窗口管理 ----------

/// 将主窗口恢复到前台（显示、取消最小化、获取焦点）
pub fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // 依次尝试显示、取消最小化、获取焦点，忽略单个操作失败但记录警告
        if let Err(e) = window.show() {
            warn!("显示主窗口失败: {}", e);
        }
        if let Err(e) = window.unminimize() {
            warn!("取消最小化主窗口失败: {}", e);
        }
        if let Err(e) = window.set_focus() {
            warn!("获取主窗口焦点失败: {}", e);
        }
    } else {
        warn!("未找到主窗口 (label: main)，无法聚焦");
    }
}

/// 从配置中读取 `title` 字段并设置到主窗口
pub fn setup_window_title(app: &mut App) {
    let config_state = app.state::<Value>();
    if let Some(window) = app.get_webview_window("main") {
        if let Some(title) = config_state.get("title").and_then(|v| v.as_str()) {
            if let Err(e) = window.set_title(title) {
                error!("设置窗口标题失败: {}", e);
            }
        }
    } else {
        warn!("未找到主窗口 (label: main)，跳过标题设置");
    }
}