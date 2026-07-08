use serde_json::Value;
use tauri::State;

// ---------- Tauri 命令（供前端使用） ----------
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
pub fn get_config(state: State<'_, Value>) -> Value {
    (*state).clone()
}