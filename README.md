<p align="center">
  <img src="src-tauri/icons/128x128.png" width="120" alt="CapShell Logo" />
</p>

<h1 align="center">CapShell</h1>

<p align="center">
  <strong>Turn any website into a native app.<br />No rewrite. Zero Rust. Just config.</strong><br />
  <em>The Native Capability Gateway for the Web.</em>
</p>

<p align="center">
  <a href="https://tauri.app"><img src="https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat&logo=tauri&logoColor=white" alt="Tauri" /></a>
  <a href="https://rust-lang.org"><img src="https://img.shields.io/badge/Rust-1.96+-CE412B?style=flat&logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License" /></a>
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="PRs Welcome" />
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" /></a>
</p>

---

English | [简体中文](./README_cn.md)

---

## 📖 Table of Contents

- [What is CapShell?](#-what-is-capshell)
- [Why CapShell?](#-why-capshell)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Distribution Model](#-distribution-model)
- [SDK Reference](#-sdk-reference)
- [Security Model](#-security-model)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 What is CapShell?

**CapShell is a universal desktop wrapper that injects native capabilities into any web application — without changing a single line of your frontend code.**

Stop rebuilding your app for every platform. Stop wrestling with Electron's 150MB bloat. Stop teaching your team Rust.

**With CapShell, you get:**

| Benefit | Description |
|---------|-------------|
| 🪶 **5MB** | Single standalone executable, not a 150MB framework |
| 🔌 **Native APIs** | Geolocation, Camera, File System, Shell — available to any webpage |
| 🧩 **Zero Rust** | Just edit `config.json`. No Rust knowledge required. |
| 📦 **One EXE, One Config** | Same binary, different configs → different apps |

CapShell is not just a wrapper — it's a **"Native Capability Gateway"** that decouples your business UI from platform-specific code, enabling true **"Write Once, Run Everywhere with Native Powers."**

---

## 🎯 Why CapShell?

| Feature | Electron | Native App | **CapShell** |
|---------|----------|------------|--------------|
| App Size | 120MB+ | Platform-specific | **~5MB** |
| Web Tech Stack | ✅ | ❌ | ✅ |
| Native Capabilities | ✅ | ✅ | ✅ |
| Zero Code Rewrite | ❌ | ❌ | ✅ |
| Config-Driven | ❌ | ❌ | ✅ |
| Memory Usage | 300MB+ | Optimal | **~80MB** |
| Learning Curve | Low | Steep | **Zero** |

> **CapShell redefines the "Desktop Web" paradigm:** Your web app stays a web app. CapShell becomes the bridge between your UI and the operating system.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CapShell (EXE)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Rust Backend (Tauri Core)                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  config.json Reader  │  Native API Bridge  │  IPC Router │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             ↓                                   │
│                    WebView2 / WKWebView                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Parent Shell (index.html)                    │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │  Capability Hub (postMessage Dispatcher)           │  │ │
│  │  │  - Geolocation  - Camera  - FS  - Shell  - Print   │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                        ↓                                   │ │
│  │              ┌───────────────────────┐                    │ │
│  │              │   iframe (Business)   │                    │ │
│  │              │   Your Web App        │                    │ │
│  │              │   +   sdk.js          │                    │ │
│  │              └───────────────────────┘                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Annotations

| Layer | Component | Responsibility | Tech Stack |
|:---:|:---|:---|:---|
| **0** | `config.json` (External) | User-editable config: `url`, `white_list`, `single_instance`,`permissions`, window options. **No rebuild needed.** | JSON |
| **1** | Rust Backend | Reads config at startup, manages Tauri plugins, exposes native APIs via `invoke`, serves as **secure gateway**. | Rust + Tauri |
| **2** | WebView Container | Rendering engine. WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux. No Chromium bundle. | System Native WebView |
| **3** | Parent Shell (`index.html`) | Renders custom title bar, hosts `iframe`, dispatches `postMessage` requests to Rust backend. **The "Capability Hub."** | HTML + JavaScript |
| **4** | `sdk.js` | Lightweight client SDK (300B minified). Business pages call `Shell.startGpsTracking()`, `Shell.openCamera()`, etc. **Zero boilerplate.** | JavaScript |
| **5** | Business Web App | Your existing React/Vue/vanilla app. Unaware of Tauri/Rust. Just include the SDK and call native APIs. | Any Web Tech Stack |

---

## 🚀 Quick Start

### 1. Download CapShell
Grab the latest `capshell.exe` from [Releases](https://github.com/TommysLee/CapShell/releases).

### 2. Create `config.json`
Place this file **in the same directory as `capshell.exe`**:

```json
{
  "title": "your App Name",
  "single_instance": true,
  "white_list": ["https://your-web-app.com"],
  "url": "https://your-web-app.com"
}
```

### 3. Add SDK to Your Web App
In your HTML:

```html
<script src="src/assets/js/sdk.js"></script>
<script>
  // Use native capabilities instantly!
  Shell.openCamera((result) => {
      if (result.type === 'CAMERA_RESULT') {
          console.log(`Image Base64 Data: ${result.image}`);
      }
  })
</script>
```

> For a complete example, please refer to [src/test.html](./src/test.html) 

### 4. Run

Double-click `capshell.exe`. Your web app launches inside CapShell with full native capabilities.

**That's it. No Rust. No compilation. No complex setup.**

---

## 📦 Distribution Model

```
Your-App/
├── capshell.exe          (5MB, same for all users)
└── config.json           (Per-app configuration)
```

- **Same EXE, different configs** → Different apps
- **Update config** → Change behavior, no rebuild
- **No user installs Rust/Node** → Pure portable EXE

---

## 🧩 SDK Reference

| Method | Description |
|--------|-------------|
| `Shell.startGpsTracking(onSuccess, onError)` | Enable GPS real-time positioning (continuous tracking) |
| `Shell.stopGpsTracking()` | Stop GPS real-time positioning |
| `Shell.openCamera(onSuccess, onError)` | Opens camera feed |
| `Shell.closeCamera(onSuccess, onError)` | Closes camera feed |
| `Shell.getConfig()` | Get current config values |

> The SDK is continuously being updated ...

---

## 🔒 Security Model

CapShell implements **domain-based isolation**:

- Only domains listed in `white_list` can invoke native APIs
- `postMessage` requests are validated against the whitelist
- Sensitive permissions (FS, Shell) default to `false` in config
- Rust backend validates all inputs before passing to OS

**Never trust the frontend. CapShell always validates.**

---

## 🛣️ Roadmap

- [x] Core architecture (Parent Shell + iframe + postMessage)
- [x] External config.json with Rust reader
- [x] Geolocation & Camera plugins
- [x] Application Singleton Pattern
- [ ] File System & Shell plugins
- [ ] Multi-window support
- [ ] Built-in devtools toggling
- [ ] System tray integration
- [ ] Auto-updater

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

Licensed under [MIT](LICENSE) .

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app) — The incredible Rust-based framework that makes this possible
- All contributors who believe in **"Desktop Web, but native."**

---

**⭐ Star this repo if you believe every web app deserves native powers!**

