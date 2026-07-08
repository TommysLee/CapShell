use crate::utils::get_exe_dir;
use std::fs;
use serde_json::Value;
use log::warn;

// ---------- 加载自定义配置文件 ----------

/// 加载并合并配置：
/// - 内置 `default_config.json`（编译时嵌入，必须存在且合法）
/// - 外部 `config.json`（可选，若存在则覆盖内置同名键）
/// 返回最终的 `Value`
pub fn load_config() -> Value {
    let exe_dir = get_exe_dir();

    // 内置默认配置
    let default_str = include_str!("../default_config.json");
    let mut config: Value = serde_json::from_str(default_str)
        .expect("内置 default_config.json 格式错误，请检查文件内容");

    // 尝试加载外部配置（可选）
    let config_path = exe_dir.join("config.json");
    if let Ok(content) = fs::read_to_string(&config_path) {
        if let Ok(ext_value) = serde_json::from_str::<Value>(&content) {
            // 分别匹配两个对象，进行合并
            if let Value::Object(ref mut default_obj) = config {
                if let Value::Object(ext_obj) = ext_value {
                    for (key, value) in ext_obj {
                        default_obj.insert(key, value);
                    }
                } else {
                    warn!("⚠️ 外部 config.json 顶层不是对象，已忽略");
                }
            } else {
                warn!("⚠️ 内置默认配置顶层不是对象，无法合并");
            }
        } else {
            warn!("⚠️ 外部 config.json 格式解析失败，已忽略");
        }
    }
    // 文件不存在时静默忽略（符合预期）

    config
}