---
title: Chrome DevTools MCP Architecture Analysis
description: Comprehensive analysis of Chrome DevTools MCP server architecture, runtime mechanisms, and data storage in VS Code + WSL environment
lastUpdated: 2025-10-18
tags: [mcp, chrome, devtools, puppeteer, vscode, wsl, architecture]
---

This document provides a detailed analysis of the Chrome DevTools MCP (Model Context Protocol) server's complete architecture, runtime mechanisms, and data storage locations when used **in VS Code with the GitHub Copilot extension** in a VS Code + WSL environment.

> **Important Note**: This research is based on using chrome-devtools-mcp through VS Code's GitHub Copilot extension. If you start the MCP server directly from the command line or other methods, the architecture may differ.

**Research Date**: 2025-10-18
**Environment**: Windows 11 + WSL2 (Ubuntu 24.04.3) + VS Code Remote WSL + GitHub Copilot Extension
**MCP Version**: chrome-devtools-mcp@0.8.1
**Chrome Version**: 141.0.0.0

## Architecture Overview

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                      Windows System                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │  VS Code (Windows Client)              │                │
│  │  └── Remote WSL Extension              │                │
│  └──────────────┬─────────────────────────┘                │
│                 │ Connection                                │
│  ┌──────────────▼─────────────────────────┐                │
│  │  WSL2 (Ubuntu 24.04.3)                 │                │
│  │  ├── VS Code Server                    │                │
│  │  │   ├── GitHub Copilot Extension      │                │
│  │  │   │   └── MCP Framework             │                │
│  │  │   │       └── Reads config          │                │
│  │  │   │           └── mcp.json           │                │
│  └──────────────┬─────────────────────────┘                │
│                 │                                            │
│                 │ Calls Windows-side npx                    │
│                 │                                            │
│  ┌──────────────▼─────────────────────────┐                │
│  │  Node.js Process Chain                 │                │
│  │  ┌──────────────────────────────────┐ │                │
│  │  │ PID: 20484                        │ │                │
│  │  │ npx chrome-devtools-mcp@latest    │ │                │
│  │  │ └─────┬─────────────────────────┐ │ │                │
│  │  │       │                         │ │ │                │
│  │  │       ▼                         │ │ │                │
│  │  │ PID: 24832                      │ │ │                │
│  │  │ chrome-devtools-mcp/index.js    │ │ │                │
│  │  │ (Puppeteer Control Layer)       │ │ │                │
│  │  └──────┬──────────────────────────┘ │ │                │
│  └─────────┼────────────────────────────┘ │                │
│            │                               │                │
│            │ Starts and controls           │                │
│            │                               │                │
│  ┌─────────▼──────────────────────────┐  │                │
│  │  Google Chrome Process Tree        │  │                │
│  │  ┌──────────────────────────────┐ │  │                │
│  │  │ PID: 12284 (Main Process)    │ │  │                │
│  │  │ chrome.exe                    │ │  │                │
│  │  │ ├── PID: 8008  (GPU)         │ │  │                │
│  │  │ ├── PID: 13360 (Renderer)    │ │  │                │
│  │  │ ├── PID: 16264 (Renderer)    │ │  │                │
│  │  │ ├── PID: 18116 (Network)     │ │  │                │
│  │  │ ├── PID: 19404 (Extension)   │ │  │                │
│  │  │ └── PID: 21012 (Utility)     │ │  │                │
│  │  └──────────────────────────────┘ │  │                │
│  └────────────────────────────────────┘  │                │
│                                           │                │
│  Data Storage:                            │                │
│  C:\Users\<username>\.cache\chrome-devtools-mcp\ │        │
└───────────────────────────────────────────┘                │
```

## Detailed Analysis

### 1. MCP Configuration File

**Location**: `C:\Users\<username>\AppData\Roaming\Code\User\mcp.json`

```json
{
  "servers": {
    "chromedevtools/chrome-devtools-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "gallery": "https://api.mcp.github.com/v0/servers/...",
      "version": "0.0.1-seed"
    }
  }
}
```

**Key Findings**:

- Configuration file is stored in Windows user directory
- `type: "stdio"` indicates communication via standard input/output
- `command: "npx"` executes in Windows environment

### 2. Process Startup Mechanism

#### Node.js Process Chain

**Main npx Process** (PID: 20484)

```text
Command: "C:\Program Files\nodejs\node.exe"
         "C:\Users\<username>\AppData\Roaming\npm\node_modules\npm\bin\npx-cli.js"
         chrome-devtools-mcp@latest
```

**MCP Server Process** (PID: 24832)

```text
Command: "node"
         "C:\Users\<username>\AppData\Local\npm-cache\_npx\<hash>\
          node_modules\.bin\..\chrome-devtools-mcp\build\src\index.js"
```

#### Startup Flow

1. **Configuration Reading**: VS Code's GitHub Copilot reads `mcp.json`
2. **Cross-platform Call**: Although VS Code Server runs in WSL, it calls Windows-side `npx` via Windows interop
3. **MCP Startup**: npx downloads/runs `chrome-devtools-mcp` package
4. **Chrome Launch**: MCP server uses Puppeteer library to launch Chrome

### 3. Chrome Browser Configuration

#### Launch Arguments (Complete)

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe"
  # Automation-related
  --enable-automation                    # Enable automation mode
  --remote-debugging-pipe                # Use pipe for remote debugging

  # Disabled features
  --disable-background-networking
  --disable-background-timer-throttling
  --disable-backgrounding-occluded-windows
  --disable-breakpad                     # Disable crash reporting
  --disable-client-side-phishing-detection
  --disable-component-extensions-with-background-pages
  --disable-crash-reporter
  --disable-default-apps
  --disable-dev-shm-usage
  --disable-hang-monitor
  --disable-infobars                     # Disable info bars
  --disable-ipc-flooding-protection
  --disable-popup-blocking               # Disable popup blocking
  --disable-prompt-on-repost
  --disable-renderer-backgrounding
  --disable-search-engine-choice-screen
  --disable-sync                         # Disable sync
  --disable-extensions                   # Disable extensions

  # Enabled features
  --allow-pre-commit-input
  --export-tagged-pdf
  --force-color-profile=srgb             # Force sRGB color profile
  --generate-pdf-document-outline
  --metrics-recording-only
  --no-first-run                         # Skip first-run wizard
  --password-store=basic
  --use-mock-keychain

  # Feature flags
  --disable-features=Translate,AcceptCHFrame,MediaRouter,
                     OptimizationHints,RenderDocument,
                     ProcessPerSiteUpToMainFrameThreshold,
                     IsolateSandboxedIframes
  --enable-features=PdfOopif

  # Data directory
  --user-data-dir=C:\Users\<username>\.cache\chrome-devtools-mcp\chrome-profile

  # Initial page
  about:blank

  # Other
  --hide-crash-restore-bubble
```

#### Key Parameter Analysis

| Parameter                 | Purpose                     | Impact                                                                   |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `--enable-automation`     | Enable automation mode      | Browser displays "Chrome is being controlled by automated test software" |
| `--remote-debugging-pipe` | Use pipe communication      | Communicate with Puppeteer via stdin/stdout                              |
| `--user-data-dir`         | Specify user data directory | Persist data to specified location                                       |
| `--disable-extensions`    | Disable all extensions      | Avoid extension interference with automation                             |
| **No `--headless`**       | **Not headless mode**       | **Browser has visible window**                                           |

### 4. Data Storage Structure

#### Main Data Directory

```text
C:\Users\<username>\.cache\chrome-devtools-mcp\chrome-profile\
├── Default/                              # Default user profile
│   ├── Preferences                       # User preferences
│   ├── History                           # Browsing history
│   ├── Cookies                           # Cookie data
│   ├── Local Storage/                    # Local storage
│   ├── Session Storage/                  # Session storage
│   ├── IndexedDB/                        # IndexedDB databases
│   └── Cache/                            # Cache files
│
├── CertificateRevocation/                # Certificate revocation data
├── Crashpad/                             # Crash reporting system
├── component_crx_cache/                  # Component cache
├── extensions_crx_cache/                 # Extensions cache
├── GraphiteDawnCache/                    # Graphics cache
├── GrShaderCache/                        # Shader cache
├── ShaderCache/                          # Shader cache (backup)
├── Safe Browsing/                        # Safe browsing data
├── OnDeviceHeadSuggestModel/             # Local search suggestion model
├── MEIPreload/                           # Media extension preload
├── hyphen-data/                          # Hyphenation data
├── FirstPartySetsPreloaded/              # First-party sets data
├── FileTypePolicies                      # File type policies
├── AutofillStates                        # Autofill states
└── Local State                           # Global state file
```

#### Temporary Files

```text
C:\Users\<username>\AppData\Local\Temp\   # Windows temp directory
└── (Chrome runtime temporary files)
```

#### Log Files (WSL Side)

```text
~/.claude-chrome-devtools.log              # MCP service log
```

**Log Example**:

```text
2025-10-18T08:15:33.561Z mcp:log Starting Chrome DevTools MCP Server v0.8.1
2025-10-18T08:15:33.566Z mcp:log Chrome DevTools MCP Server connected
```

### 5. Browser Runtime Information

#### Runtime Information via JavaScript

```javascript
{
  // Browser identification
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "platform": "Win32",
  "vendor": "Google Inc.",

  // Viewport information
  "viewport": {
    "innerWidth": 1251,
    "innerHeight": 1226,
    "outerWidth": 1266,
    "outerHeight": 1373,
    "devicePixelRatio": 1.5
  },

  // Screen information
  "screen": {
    "width": 2560,
    "height": 1440,
    "availWidth": 2560,
    "availHeight": 1392,
    "colorDepth": 24
  },

  // Automation detection
  "automation": {
    "webdriver": true,           // ✅ Indicates automation mode
    "chromeRuntime": false,
    "permissions": true
  },

  // System resources
  "hardwareConcurrency": 8,      // 8 logical CPU cores
  "deviceMemory": 8,             // 8 GB memory
  "maxTouchPoints": 0,           // Non-touch device

  // Localization
  "language": "en-US",
  "timeZone": "Asia/Shanghai"
}
```

## Key Technical Details

### Why Not Headless Mode?

By inspecting Chrome process launch arguments:

1. **Default configuration** (only specifying `chrome-devtools-mcp@latest`) **does not include** `--headless` parameter
2. Therefore Chrome runs in **windowed automation mode**
3. To use headless mode, you must explicitly configure `--headless` parameter in `mcp.json`

### Cross-Platform Communication Mechanism

Although VS Code Server runs in WSL, Chrome runs in Windows:

```text
WSL (VS Code Server)
  ↓ Via Windows interop
Windows (npx)
  ↓ Launches
Windows (chrome-devtools-mcp)
  ↓ Via Puppeteer
Windows (Chrome)
```

**Key Technologies**:

- **Windows-WSL Interop**: WSL can directly call Windows executables
- **stdio Communication**: MCP uses standard input/output for inter-process communication
- **Pipe Debugging**: Chrome accepts control commands via `--remote-debugging-pipe`

### Why Visible in Task Manager?

Because all key processes run on Windows:

- ✅ Node.js (npx) - Windows process
- ✅ chrome-devtools-mcp - Windows process
- ✅ Chrome - Windows process
- ❌ VS Code Server - WSL process (only as initiator)

## Configuration Recommendations

### Headless Mode Configuration

For true headless mode, modify `mcp.json`:

```json
{
  "chromedevtools/chrome-devtools-mcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["chrome-devtools-mcp@latest", "--headless", "true"]
  }
}
```

### Custom Chrome Path

```json
{
  "args": [
    "chrome-devtools-mcp@latest",
    "--executablePath",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  ]
}
```

Note: Windows paths require escaped backslashes

### Use Temporary User Directory

```json
{
  "args": ["chrome-devtools-mcp@latest", "--isolated", "true"]
}
```

This creates a temporary directory for each session and automatically cleans up on exit.

### Custom Viewport Size

```json
{
  "args": ["chrome-devtools-mcp@latest", "--viewport", "1920x1080"]
}
```

### Performance Optimized Configuration

```json
{
  "args": [
    "chrome-devtools-mcp@latest",
    "--headless",
    "true",
    "--isolated",
    "true",
    "--viewport",
    "1920x1080",
    "--chromeArg=--disable-gpu",
    "--chromeArg=--no-sandbox"
  ]
}
```

## Debugging Tips

### View MCP Logs

**WSL Side**:

```bash
tail -f ~/.claude-chrome-devtools.log
```

### View Chrome Processes

**Windows PowerShell**:

```powershell
Get-Process chrome | Select-Object Id, ProcessName, Path, StartTime
```

### Get Command Line Arguments

```powershell
Get-CimInstance Win32_Process -Filter "name='chrome.exe'" |
  Select-Object ProcessId, CommandLine |
  Format-List
```

### View Data Directory Size

```powershell
Get-ChildItem "$env:USERPROFILE\.cache\chrome-devtools-mcp\chrome-profile" -Recurse |
  Measure-Object -Property Length -Sum |
  Select-Object @{Name="Size(MB)";Expression={[math]::Round($_.Sum/1MB, 2)}}
```

### Clear Cache

```powershell
# Stop all Chrome processes
Stop-Process -Name chrome -Force

# Delete cache
Remove-Item "$env:USERPROFILE\.cache\chrome-devtools-mcp\chrome-profile" -Recurse -Force
```

## FAQ

### Q1: Why can't I see the Chrome window?

**A**: Check if the `--headless` parameter is being used. Default configuration (only `chrome-devtools-mcp@latest`) should have a window.

### Q2: Chrome window flashes and disappears

**A**: This is normal. MCP service closes Chrome when there are no active connections. Keep VS Code Copilot active.

### Q3: Is data persisted?

**A**:

- **Default**: Yes, stored in `C:\Users\<username>\.cache\chrome-devtools-mcp\chrome-profile\`
- **With `--isolated`**: No, uses temporary directory and cleans up on exit

### Q4: How to connect to already running Chrome?

**A**: Use `--browserUrl` parameter:

```json
{
  "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
}
```

First manually start Chrome:

```bash
chrome.exe --remote-debugging-port=9222
```

### Q5: Will Chrome in WSL be used?

**A**: No. Even if Chrome is installed in WSL (like `/usr/bin/google-chrome`), MCP will still launch Windows-side Chrome because the npx command itself executes on Windows.

## Performance Considerations

### Memory Usage

Typical Chrome DevTools MCP occupies:

- **Chrome Processes**: ~200-500 MB
- **Node.js (MCP Server)**: ~50-100 MB
- **Data Directory**: ~10-50 MB (depending on usage)

### CPU Usage

- **Idle**: <1%
- **Page Loading**: 10-30%
- **JavaScript Execution**: 20-50%

### Network Traffic

- **Initial Startup**: ~5-10 MB (component downloads)
- **Normal Use**: Depends on websites visited

## Security Considerations

### 1. Automation Identification

Chrome displays an "is being controlled by automated test software" info bar, which may affect:

- Some websites' anti-bot mechanisms
- navigator.webdriver property is true

### 2. Extensions and Plugins

Default configuration disables all extensions (`--disable-extensions`), including:

- Ad blockers
- Password managers
- Other browser extensions

### 3. Data Privacy

Data is stored locally but includes:

- Browsing history
- Cookies
- Local storage data

Recommendations:

- Use `--isolated` mode for sensitive operations
- Regularly clear cache directory
- Don't log into personal accounts in automated browser

### 4. Sandbox Disabling

Some configurations may include `--no-sandbox`, which:

- Reduces security
- Allows broader system access
- Use only when necessary (e.g., in Docker containers)

## Related Resources

### Official Documentation

- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### Project Repositories

- [chrome-devtools-mcp](https://github.com/chromedevtools/chrome-devtools-mcp)
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)

### Chrome Command Line Arguments

- [List of Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)

## Summary

Key characteristics of Chrome DevTools MCP architecture when used via VS Code GitHub Copilot extension:

1. **Cross-platform**: VS Code Server in WSL reads config, launches Windows-side services via Windows interop
2. **Windows Execution**: Node.js, MCP server, and Chrome browser all run on Windows
3. **Windowed**: Not headless by default, visible and manageable in Windows Task Manager
4. **Persistent**: Data saved by default in Windows user cache directory (`%USERPROFILE%\.cache\chrome-devtools-mcp\`)
5. **Automated**: Controlled via Puppeteer, supports full Chrome DevTools Protocol
6. **Flexible Configuration**: Can adjust runtime mode, viewport size, data directory, etc. via parameters in `mcp.json`

This design retains Chrome's full functionality while providing programmatic control, making it well-suited for development and testing scenarios.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-18
**Applicable Scenario**: VS Code + GitHub Copilot Extension + chrome-devtools-mcp
