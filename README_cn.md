<p align="center">
  <img src="src-tauri/icons/128x128.png" width="120" alt="CapShell Logo" />
</p>

<h1 align="center">CapShell</h1>

<p align="center">
  <strong>Turn any website into a native app.<br />No rewrite. Zero Rust. Just config.</strong><br />
  <em>把你的任何 Web 应用，在不改一行源码的前提下，<br />瞬间变成拥有系统权限、仅 5MB 的原生桌面 App。</em>
</p>

<p align="center">
  <a href="https://tauri.app"><img src="https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat&logo=tauri&logoColor=white" alt="Tauri" /></a>
  <a href="https://rust-lang.org"><img src="https://img.shields.io/badge/Rust-1.96+-CE412B?style=flat&logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License" /></a>
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="PRs Welcome" />
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" /></a>
</p>

---

[English](./README.md) | 简体中文

---

## 📖 目录

- [什么是 CapShell？](#-什么是-capshell)
- [为什么选择 CapShell？](#-为什么选择-capshell)
- [架构](#-架构)
- [快速开始](#-快速开始)
- [分发模式](#-分发模式)
- [SDK 参考](#-sdk-参考)
- [安全模型](#-安全模型)
- [路线图](#-路线图)
- [贡献](#-贡献)
- [许可证](#-许可证)

---

## 💡 什么是 CapShell？

**CapShell 是一个通用桌面容器，能将原生系统能力注入任何 Web 应用——无需修改一行前端代码。**

无需为每个平台重复构建应用，无需忍受 Electron 150MB 的臃肿体积，无需让团队学习 Rust。

**使用 CapShell，你将获得：**

| 优势 | 说明 |
|------|------|
| 🪶 **仅 5MB** | 单个独立可执行文件，而非 150MB 的框架 |
| 🔌 **原生 API** | 定位、摄像头、文件系统、系统命令——对任意网页开放 |
| 🧩 **零 Rust** | 只需编辑 `config.json`，无需任何 Rust 知识 |
| 📦 **单 EXE + 单配置** | 同一二进制文件，不同配置 → 不同应用 |

CapShell 不仅仅是一个容器，它是一套 **“原生能力网关”**——将业务 UI 与平台相关代码彻底解耦，真正实现 **“一次编写，随处运行，自带原生能力”**。

---

## 🎯 为什么选择 CapShell？

| 特性 | Electron | 原生应用 | **CapShell** |
|------|----------|----------|--------------|
| 应用体积 | 120MB+ | 平台相关 | **~5MB** |
| Web 技术栈 | ✅ | ❌ | ✅ |
| 原生能力 | ✅ | ✅ | ✅ |
| 零代码重写 | ❌ | ❌ | ✅ |
| 配置驱动 | ❌ | ❌ | ✅ |
| 内存占用 | 300MB+ | 最优 | **~80MB** |
| 学习曲线 | 低 | 陡峭 | **零门槛** |

> **CapShell 重新定义了“桌面 Web”的范式：** 你的 Web 应用保持 Web 应用的本质，CapShell 成为 UI 与操作系统之间的桥梁。

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         CapShell (EXE)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Rust 后端 (Tauri Core)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  config.json 读取  │  原生 API 桥接  │  IPC 路由         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             ↓                                   │
│                    WebView2 / WKWebView                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              父页面 (index.html)                         │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  能力调度中心 (postMessage 分发器)                 │  │ │
│  │  │  - 定位  - 摄像头  - 文件系统  - 系统命令  - 打印  │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                        ↓                                   │ │
│  │              ┌───────────────────────┐                    │ │
│  │              │   iframe (业务页面)   │                    │ │
│  │              │   你的 Web 应用       │                    │ │
│  │              │   +  sdk.js         │                    │ │
│  │              └───────────────────────┘                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 架构说明

| 层级 | 组件 | 职责 | 技术栈 |
|:---:|:---|:---|:---|
| **0** | `config.json`（外部文件） | **用户配置入口**。定义 `url`、域名白名单 `white_list`、单例`single_instance`、窗口参数。**无需重新编译即可生效。** | JSON |
| **1** | Rust 后端 | **安全网关**。启动时读取配置，注册 Tauri 插件，通过 `invoke` 暴露原生 API，拦截并校验所有系统调用。 | Rust + Tauri |
| **2** | WebView 容器 | **渲染引擎**。Windows 使用 WebView2，macOS 使用 WKWebView，Linux 使用 WebKitGTK。无需打包 Chromium。 | 系统原生 WebView |
| **3** | 父页面 (`index.html`) | **能力调度中心**。渲染自定义标题栏，嵌入业务 iframe，通过 `postMessage` 接收子页面请求并转发给 Rust 后端。 | HTML + JavaScript |
| **4** | `sdk.js` | **客户端 SDK**。封装 `postMessage` 通信细节，提供 `Shell.openCamera()` 等语义化 API。压缩后仅 **300 字节**。 | JavaScript |
| **5** | 业务 Web 应用 | **你的业务 UI**。任何 React / Vue / 原生 JS 应用，通过引入 SDK 即可调用系统能力。**完全感知不到 Rust 的存在。** | 任意 Web 技术栈 |

---

## 🚀 快速开始

### 1. 下载 CapShell
从 [Releases](https://github.com/TommysLee/CapShell/releases) 下载最新的 `capshell.exe`。

### 2. 创建 `config.json`
将以下配置文件放在 **与 `capshell.exe` 相同的目录**：

```json
{
  "title": "你的应用名称",
  "single_instance": true,
  "white_list": ["https://your-web-app.com"],
  "url": "https://your-web-app.com"
}
```

### 3. 在你的 Web 应用中添加 SDK
在你的 HTML 中引入：

```html
<script src="src/assets/js/sdk.js"></script>
<script>
  // 即刻调用原生能力！    
  Shell.openCamera((result) => {
      if (result.type === 'CAMERA_RESULT') {
          console.log(`图片Base64数据: ${result.image}`);
      }
  })
</script>
```

> 注：完整示例请参考 [src/test.html](./src/test.html) 

### 4. 运行

双击 `capshell.exe`，你的 Web 应用将在 CapShell 中启动，并拥有完整的原生能力。

**就这么简单。无需 Rust，无需编译，无需复杂配置。**

---

## 📦 分发模式

```
你的应用/
├── capshell.exe          (5MB，所有用户通用)
└── config.json           (每个应用独立配置)
```

- **同一 EXE，不同 config.json** → 不同应用
- **修改配置** → 改变应用行为，无需重新编译
- **用户无需安装 Rust / Node** → 纯绿色便携 EXE

---

## 🧩 SDK 参考

| 方法 | 描述 |
|------|------|
| `Shell.startGpsTracking(onSuccess, onError)` | 启动 GPS 实时定位（持续追踪） |
| `Shell.stopGpsTracking()` | 停止 GPS 实时定位 |
| `Shell.openCamera(onSuccess, onError)` | 打开摄像头 |
| `Shell.closeCamera(onSuccess, onError)` | 关闭摄像头 |
| `Shell.getConfig()` | 获取当前配置信息 |

> 注：SDK 持续更新中...

---

## 🔒 安全模型

CapShell 实现了 **基于域名的隔离机制**：

- 只有在 `white_list` 中列出的域名才能调用原生 API
- `postMessage` 请求会经过域名白名单校验
- 敏感权限（文件系统、系统命令）默认在配置中设为 `false`
- Rust 后端对所有输入进行校验后再传递给操作系统

**绝不信任前端。CapShell 始终进行后端校验。**

---

## 🛣️ 路线图

- [x] 核心架构（父页面 + iframe + postMessage）
- [x] 外部 config.json 及 Rust 读取
- [x] 定位与摄像头插件
- [x] 应用单例模式
- [ ] 文件系统与系统命令插件
- [ ] 多窗口支持
- [ ] 内置开发者工具开关
- [ ] 系统托盘集成
- [ ] 自动更新

---

## 🤝 贡献

欢迎贡献！请阅读我们的 [贡献指南](CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing`)
3. 提交你的修改 (`git commit -m '添加某个很棒的特性'`)
4. 推送到分支 (`git push origin feature/amazing`)
5. 提交 Pull Request

---

## 📄 许可证

采用 [MIT](LICENSE) 许可。

---

## 🙏 致谢

- [Tauri](https://tauri.app) —— 让这一切成为可能的优秀 Rust 框架
- 所有相信 **“桌面 Web 化，但拥有原生能力”** 的贡献者们

---

**⭐ 如果你相信每个 Web 应用都值得拥有原生能力，请给这个仓库点个 Star！**