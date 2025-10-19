---
title: Configuring Chrome DevTools MCP for Codex in WSL
description: Step-by-step guide to enable Chrome DevTools MCP in Codex CLI for web snapshots and script debugging, with WSL-specific GUI configuration.
lastUpdated: 2025-10-19
tags: [codex, chrome, devtools, mcp, wsl, puppeteer, gui, configuration]
---

This guide explains how to enable Chrome DevTools MCP in Codex CLI for tasks like web snapshots and script debugging, with additional configuration for GUI display in WSL environments.

## Prerequisites

- **Chrome**: Ensure Google Chrome is installed in the system running Codex, and note its executable path (e.g., `/usr/bin/google-chrome`).
- **Node/npm**: Codex launches MCP via `npx`, so a working npm environment is required.
- **Codex Version**: Recommended to use the latest Codex CLI. Default configuration is located at `~/.codex/config.toml`.

## Registering MCP in Codex

1. Open or create `~/.codex/config.toml` and add the following section (adjust paths as needed):

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

   **Parameter explanations:**
   - `-y`: Allows `npx` to auto-confirm dependency installation, avoiding interactive prompts in Codex sessions.
   - `chrome-devtools-mcp@latest`: Always pulls the latest MCP version; can be changed to a specific version number if needed.
   - `--headless=false`: Launches Chrome in GUI mode for screenshots or interactive debugging; can be set to `true` for pure automation scenarios.
   - `--isolated=true`: Uses a temporary user data directory for each run, preventing conflicts from shared cache across multiple sessions.
   - `--executablePath=/usr/bin/google-chrome`: Explicitly specifies Chrome's installation path to ensure the executable is found in WSL/container environments.
   - `--logFile=/home/username/.codex/chrome-devtools.log`: Writes debug logs to a fixed path for troubleshooting connection or permission issues (adjust directory as needed).
   - `--chromeArg=--no-sandbox`, `--chromeArg=--disable-setuid-sandbox`: Disables Chrome sandbox to resolve permission restrictions in WSL and other non-privileged environments.
   - `--chromeArg=--disable-dev-shm-usage`: Avoids/mitigates rendering crashes caused by insufficient `/dev/shm` space.

   - If you prefer headless mode by default, change `--headless=false` to `true`.
   - The `CHROME_DEVEL_SANDBOX` path comes from system installation; adjust if necessary.

2. Save the file and restart Codex CLI for the new configuration to take effect.

3. Verify the configuration is loaded using `codex mcp list`:

   ```bash
   codex mcp list
   ```

   The output should display the `chrome-devtools` command arguments and environment variables.

4. Request the MCP in a Codex session, for example to open a site:

   ```text
   [chrome-devtools] new_page https://astro.build/
   ```

   Then capture snapshots or execute scripts to confirm functionality.

## WSL GUI Configuration

In Windows 11 environments with WSLg, the command line can launch GUI applications, but when Codex runs MCP as an independent process, it may not inherit display variables and will report:

```text
Missing X server to start the headful browser. Either set headless to true or use xvfb-run to run your Puppeteer script.
```

To maintain `headless=false`, explicitly inject the same display variables as your current shell into the MCP configuration:

```toml
[mcp_servers.chrome-devtools.env]
CHROME_DEVEL_SANDBOX = "/opt/google/chrome/chrome-sandbox"
DISPLAY = ":0"
WAYLAND_DISPLAY = "wayland-0"
XDG_RUNTIME_DIR = "/run/user/1000"
```

**Steps:**

1. In WSL shell, execute `echo $DISPLAY`, `echo $WAYLAND_DISPLAY`, `echo $XDG_RUNTIME_DIR` and note their outputs.
2. Fill these values into the configuration above.
3. Restart Codex and run `codex mcp list` and `new_page` again. Chrome should connect to the existing display session without needing to install `xvfb-run`.

## Troubleshooting Tips

- **Incorrect Chrome path**: If MCP fails to start, verify that `--executablePath` points to an executable file.
- **Permission issues**: If logs show sandbox errors, disable relevant `--chromeArg` options based on system policy or adjust `CHROME_DEVEL_SANDBOX` permissions.
- **Auto-updates**: The command uses `chrome-devtools-mcp@latest`, which updates to the latest version on each startup; to lock to a specific version, change to a specific version number.

After completing the above configuration, Codex can stably use Chrome DevTools MCP in different environments, while maintaining GUI capabilities in WSL.
