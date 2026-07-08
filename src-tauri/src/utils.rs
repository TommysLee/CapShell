use std::env;
use std::path::PathBuf;

// ---------- 工具函数 ----------

/// 获取当前可执行文件所在的绝对路径目录
/// 若失败则 panic，因为应用无法继续运行
pub fn get_exe_dir() -> PathBuf {
    env::current_exe()
        .expect("获取 exe 路径失败")
        .parent()
        .expect("获取 exe 父目录失败")
        .to_path_buf()
}