---
title: "Fixing SSH Agent Access in Non-Interactive Shells for Claude Code"
description: "A complete guide to solving SSH agent connectivity issues in non-interactive shells, particularly for AI coding assistants like Claude Code."
lastUpdated: 2025-10-08
tags: [ssh, bash, wsl, claude-code, git, shell, devops]
---

## Summary

When using AI coding assistants like Claude Code to execute Git operations over SSH, you may encounter authentication failures due to SSH agent not being accessible in non-interactive shells. This article documents the root cause analysis and provides a complete solution that works for both interactive terminal usage and automated tools.

**Problem**: `git commit` and `git push` fail with "Couldn't get agent socket" error when executed by Claude Code's Bash tool.

**Solution**: Configure SSH agent socket discovery before the interactive shell check in `~/.bashrc`, combined with automatic agent startup and key loading for interactive sessions.

---

## Problem Description

When Claude Code (or any tool using non-interactive shells) attempts to execute Git commands that require SSH authentication, the following error occurs:

```bash
error: Couldn't get agent socket?
fatal: failed to write commit object
```

However, the same commands work perfectly fine when executed directly in an interactive terminal.

---

## Environment Information

- **OS**: WSL2 (Ubuntu on Windows)
- **Shell**: Bash
- **Git Remote**: SSH protocol (`git@github.com:username/repo.git`)
- **Tool**: Claude Code (uses non-interactive Bash shells)
- **SSH Key**: Ed25519 key located at `~/.ssh/`

---

## Root Cause Analysis

### Interactive vs Non-Interactive Shells

The standard `~/.bashrc` configuration includes this check near the beginning:

```bash
# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac
```

**What this does**:

- Checks if the current shell is interactive (by looking for 'i' in shell flags)
- If non-interactive, **immediately returns**, preventing all subsequent configuration from executing

### The Problem

Most SSH agent configurations are placed **after** this check in `~/.bashrc`:

```bash
# ~/.bashrc (line ~120+)
if [ -z "$SSH_AUTH_SOCK" ]; then
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_*
fi
```

**Result**: Non-interactive shells never reach the SSH agent configuration, so `SSH_AUTH_SOCK` is never set.

### Claude Code's Behavior

Claude Code's Bash tool:

- Creates **non-interactive shells** for each command execution
- Each execution is an **independent session**
- Does not inherit environment variables from the user's terminal
- Sources `~/.bashrc` but exits early due to the interactive check

---

## Investigation Process

### Step 1: Confirm the Interactive Check Exists

```bash
$ head -10 ~/.bashrc
```

Output confirmed the presence of:

```bash
case $- in
    *i*) ;;
      *) return;;
esac
```

### Step 2: Check Shell Flags

```bash
$ echo $-
# Interactive: himBHs (contains 'i')
# Non-interactive: hmtBc (no 'i')
```

### Step 3: Verify SSH_AUTH_SOCK in Non-Interactive Shell

```bash
$ bash -c 'echo "SSH_AUTH_SOCK: $SSH_AUTH_SOCK"'
# Output: SSH_AUTH_SOCK: (empty)
```

### Step 4: Check for Existing SSH Agent

```bash
$ find /tmp -type s -path "*ssh*agent*" -user "$USER" 2>/dev/null
# Output: (empty - no agent running)
```

### Step 5: Test SSH Agent Connectivity

```bash
$ ssh-add -l
# Output: Could not open a connection to your authentication agent.
```

### Step 6: Verify Git Uses SSH

```bash
$ git remote -v
# Output: git@github.com:username/repo.git
```

**Conclusion**: The problem exists - non-interactive shells cannot access SSH agent, and Git operations over SSH will fail.

---

## Solution Implementation

The solution involves configuring SSH agent in **two places** in `~/.bashrc`:

### Part 1: Non-Interactive Shell Support

Add this **before** the `case $-` interactive check (around line 5):

```bash
# === SSH Agent Configuration (for non-interactive shells) ===
if [ -z "$SSH_AUTH_SOCK" ]; then
  export SSH_AUTH_SOCK=$(find /tmp -type s -path "*ssh*agent*" -user "$USER" 2>/dev/null | head -1)
fi
# ============================================================
```

**Purpose**:

- Allows non-interactive shells to find and use existing SSH agent sockets
- Executes before the shell returns
- Lightweight - only exports an environment variable

### Part 2: Interactive Shell Support

Add this **after** the `case $-` check (around line 120+):

```bash
# === SSH Agent Auto-start (Interactive Shells) ===
# Check if SSH agent is already running
if [ -z "$SSH_AUTH_SOCK" ]; then
  # Try to find existing agent socket
  EXISTING_SOCK=$(find /tmp -type s -path "*ssh*agent*" -user "$USER" 2>/dev/null | head -1)
  if [ -n "$EXISTING_SOCK" ]; then
    export SSH_AUTH_SOCK="$EXISTING_SOCK"
  else
    # Start a new agent if none exists
    eval "$(ssh-agent -s)" >/dev/null
  fi
fi

# Add SSH keys if agent is running and keys are not loaded
if [ -n "$SSH_AUTH_SOCK" ]; then
  ssh-add -l >/dev/null 2>&1
  if [ $? -eq 1 ]; then
    # Agent has no identities, add keys
    for key in ~/.ssh/id_*; do
      if [ -f "$key" ] && [[ "$key" != *.pub ]]; then
        ssh-add "$key" 2>/dev/null
      fi
    done
  fi
fi
# =====================================================
```

**Purpose**:

- Automatically starts SSH agent when opening a new terminal (if not already running)
- Automatically loads all SSH private keys from `~/.ssh/`
- Avoids duplicate key additions
- Reuses existing agent across terminal sessions

### Complete Implementation

Edit `~/.bashrc`:

```bash
# ~/.bashrc: executed by bash(1) for non-login shells.

# === SSH Agent Configuration (for non-interactive shells) ===
if [ -z "$SSH_AUTH_SOCK" ]; then
  export SSH_AUTH_SOCK=$(find /tmp -type s -path "*ssh*agent*" -user "$USER" 2>/dev/null | head -1)
fi
# ============================================================

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# ... (rest of standard bashrc configuration) ...

# === SSH Agent Auto-start (Interactive Shells) ===
if [ -z "$SSH_AUTH_SOCK" ]; then
  EXISTING_SOCK=$(find /tmp -type s -path "*ssh*agent*" -user "$USER" 2>/dev/null | head -1)
  if [ -n "$EXISTING_SOCK" ]; then
    export SSH_AUTH_SOCK="$EXISTING_SOCK"
  else
    eval "$(ssh-agent -s)" >/dev/null
  fi
fi

if [ -n "$SSH_AUTH_SOCK" ]; then
  ssh-add -l >/dev/null 2>&1
  if [ $? -eq 1 ]; then
    for key in ~/.ssh/id_*; do
      if [ -f "$key" ] && [[ "$key" != *.pub ]]; then
        ssh-add "$key" 2>/dev/null
      fi
    done
  fi
fi
# =====================================================
```

---

## Verification

### Test 1: Start SSH Agent Manually

```bash
$ eval "$(ssh-agent -s)"
# Output: Agent pid 2245478

$ ssh-add ~/.ssh/id_ed25519
# Output: Identity added: /home/username/.ssh/id_ed25519 (user@example.com)
```

### Test 2: Verify Non-Interactive Shell Access

```bash
$ bash -c 'source ~/.bashrc; echo "SSH_AUTH_SOCK: $SSH_AUTH_SOCK"; ssh-add -l'
# Output:
# SSH_AUTH_SOCK: /tmp/ssh-xxxxx/agent.2245477
# 256 SHA256:xxx... user@example.com (ED25519)
```

✅ **Success**: Non-interactive shells can now access the SSH agent!

### Test 3: Verify Interactive Shell Auto-Start

```bash
$ bash -i -c 'ssh-add -l'
# Output: 256 SHA256:xxx... user@example.com (ED25519)
```

✅ **Success**: Keys are automatically loaded in new interactive sessions!

---

## Conclusion

### Problem Summary

AI coding assistants like Claude Code use non-interactive shells that cannot access SSH agent when the configuration is placed after the interactive check in `~/.bashrc`.

### Solution Summary

Configure SSH agent in two parts:

1. **Before interactive check**: Export `SSH_AUTH_SOCK` by finding existing agent sockets
2. **After interactive check**: Auto-start agent and load keys for interactive sessions

### Benefits

- ✅ **Interactive terminals**: Automatic SSH agent startup and key loading
- ✅ **Non-interactive shells**: Automatic SSH agent socket discovery
- ✅ **Claude Code**: Can execute SSH-authenticated Git operations
- ✅ **CI/CD pipelines**: Can access SSH agent (if socket exists)
- ✅ **Multiple terminals**: Share the same SSH agent instance

### Affected Scenarios

**Works Now** ✅:

- Claude Code executing `git commit`, `git push`, `git pull`
- Shell scripts using SSH/Git
- Automated deployment scripts
- Any tool using non-interactive Bash shells

**Always Worked** ✅:

- Manual Git operations in terminal
- Interactive SSH connections
- Standard development workflow

### Technical Notes

- This approach is lightweight and safe
- Only environment variables are exported before the interactive check
- No side effects or performance impact
- Compatible with WSL, Linux, and macOS
- Works with any SSH-based tool (Git, rsync, scp, etc.)

---

## Additional Resources

- [Bash Startup Files Documentation](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html)
- [SSH Agent Forwarding Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/using-ssh-agent-forwarding)
- [Git SSH Configuration](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Claude Code Documentation](https://docs.claude.com/claude-code)

---

**Author's Note**: This solution was developed while troubleshooting Claude Code's Git integration in a WSL2 environment. The investigation process and solution may be helpful for anyone using AI coding assistants or automated tools that execute Git commands via SSH.
