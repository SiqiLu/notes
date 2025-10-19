---
title: 为 Codex 配置 Chrome DevTools MCP(WSL 环境)
description: 在 Codex CLI 中启用 Chrome DevTools MCP 的分步指南,用于网页快照和脚本调试,包含 WSL 特定的 GUI 配置。
lastUpdated: 2025-10-19
tags: [codex, chrome, devtools, mcp, wsl, puppeteer, gui, configuration]
---

本文介绍如何在 Codex CLI 中启用 Chrome DevTools MCP,用于网页快照、脚本调试等任务,并补充说明在 WSL 环境下让 GUI 正常显示的额外配置。

## 准备工作

- **Chrome**:确保在运行 Codex 的系统内安装 Google Chrome,记录其可执行路径(示例 `/usr/bin/google-chrome`)。
- **Node/npm**:Codex 会通过 `npx` 启动 MCP,因此需要可用的 npm 环境。
- **Codex 版本**:建议使用最新版 Codex CLI,默认配置位于 `~/.codex/config.toml`。

## 在 Codex 中注册 MCP

1. 打开/创建 `~/.codex/config.toml`,新增以下段落(根据实际路径调整):

   ```toml
   [mcp_servers.chrome-devtools]
   command = "npx"
   args = [
     "-y",
     "chrome-devtools-mcp@latest",
     "--headless=false",
     "--isolated=true",
     "--executablePath=/usr/bin/google-chrome",
     "--logFile=/home/username/.codex/chrome-devtools.log",
     "--chromeArg=--no-sandbox",
     "--chromeArg=--disable-setuid-sandbox",
     "--chromeArg=--disable-dev-shm-usage"
   ]

   [mcp_servers.chrome-devtools.env]
   CHROME_DEVEL_SANDBOX = "/opt/google/chrome/chrome-sandbox"
   ```

   **参数说明:**
   - `-y`:让 `npx` 自动确认依赖安装,避免 Codex 会话停在交互提示。
   - `chrome-devtools-mcp@latest`:始终拉取最新 MCP;若需锁定版本可改为具体号。
   - `--headless=false`:以 GUI 模式启动 Chrome,便于截图或交互调试;在纯自动化场景可改为 `true`。
   - `--isolated=true`:每次运行使用临时用户数据目录,防止多个会话共享缓存产生冲突。
   - `--executablePath=/usr/bin/google-chrome`:显式指明 Chrome 的安装路径,确保在 WSL/容器环境能够找到可执行文件。
   - `--logFile=/home/username/.codex/chrome-devtools.log`:把调试日志写入固定路径,便于排查连接或权限问题(可按需调整目录)。
   - `--chromeArg=--no-sandbox`、`--chromeArg=--disable-setuid-sandbox`:解除 Chrome 沙箱,解决 WSL 等非特权环境下的权限限制。
   - `--chromeArg=--disable-dev-shm-usage`:避免/减轻 `/dev/shm` 空间不足导致的渲染崩溃。

   - 如果希望默认使用无界面模式,可将 `--headless=false` 改为 `true`。
   - `CHROME_DEVEL_SANDBOX` 路径来自系统安装,必要时调整。

2. 保存后重启 Codex CLI,让新配置生效。

3. 用 `codex mcp list` 验证配置是否加载:

   ```bash
   codex mcp list
   ```

   输出应展示 `chrome-devtools` 的命令参数和环境变量。

4. 在 Codex 会话中请求该 MCP,例如让其打开站点:

   ```text
   [chrome-devtools] new_page https://astro.build/
   ```

   然后抓取快照或执行脚本,确认功能正常。

## WSL 环境下的 GUI 配置

在带 WSLg 的 Windows 11 环境中,命令行可以启动 GUI,但 Codex 以独立进程运行 MCP 时可能没有继承显示变量,会报:

```text
Missing X server to start the headful browser. Either set headless to true or use xvfb-run to run your Puppeteer script.
```

为保持 `headless=false`,需要在 MCP 配置中显式注入与当前 shell 相同的显示变量:

```toml
[mcp_servers.chrome-devtools.env]
CHROME_DEVEL_SANDBOX = "/opt/google/chrome/chrome-sandbox"
DISPLAY = ":0"
WAYLAND_DISPLAY = "wayland-0"
XDG_RUNTIME_DIR = "/run/user/1000"
```

**步骤说明:**

1. 在 WSL shell 中执行 `echo $DISPLAY`、`echo $WAYLAND_DISPLAY`、`echo $XDG_RUNTIME_DIR`,记录各自输出。
2. 将这些值填入上方配置。
3. 重启 Codex 后再次运行 `codex mcp list` 和 `new_page`,Chrome 即可连接现有显示会话,无需安装 `xvfb-run`。

## 其他排查提示

- **Chrome 路径不正确**:若 MCP 无法启动,检查 `--executablePath` 是否可执行。
- **权限问题**:若日志显示 sandbox 报错误,可根据系统策略禁用相关 `--chromeArg` 或调整 `CHROME_DEVEL_SANDBOX` 权限。
- **自动更新**:命令中使用 `chrome-devtools-mcp@latest`,会在每次启动时更新到最新版;如需锁定版本,可改成具体版本号。

完成以上配置后,Codex 即可在不同环境中稳定使用 Chrome DevTools MCP,而在 WSL 中也能继续保持图形界面能力。
