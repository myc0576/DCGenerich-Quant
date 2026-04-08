# Codex Sandbox Permission Debug (2026-04-08)

## Problem

Codex rescue subagent 在执行 Phase 4.5 (Data Alignment Recovery) 时反复被权限阻塞，无法读写 `D:\Quant\`、`F:\DataCenter\`、`\\wsl.localhost\Ubuntu\...` 等路径。所有需要 Codex 直接操作文件的任务（Task 14b/14c/14d）都被卡住。

## Root Cause

Codex CLI 的 Windows 沙箱机制由三层控制：

### Layer 1: Windows 受限用户
Codex 创建了两个专用本地用户来隔离命令执行：
- `CodexSandboxOffline` — 离线/沙箱模式
- `CodexSandboxOnline` — 联网模式
- 创建于 2026-03-15，存储在 `~/.codex/.sandbox/setup_marker.json`

### Layer 2: ACL 白名单
`setup_marker.json` 中的 `read_roots` 和 `write_roots` 数组控制沙箱用户可访问的文件系统范围。**问题：两个数组均为空**，sandbox 用户除 `C:\Users\HP` 外无额外路径权限。

### Layer 3: sandbox 模式
`codex-companion.mjs:460` 将 `--write` flag 映射为 sandbox 模式：
- 原始代码：`request.write ? "workspace-write" : "read-only"`
- `workspace-write` 仅允许写入 cwd（`C:\Users\HP`），不允许写入其他路径
- Codex CLI 实际支持三种模式：`read-only` | `workspace-write` | `danger-full-access`

虽然 `config.toml` 已设置 `sandbox_mode = "danger-full-access"` 和 `[windows] sandbox = "elevated"`，但这些配置不会自动覆盖 companion 脚本硬编码的 sandbox 参数。

## Fix (三项修复)

### 1. 更新 setup_marker.json 路径白名单

文件：`C:\Users\HP\.codex\.sandbox\setup_marker.json`

```json
{
  "version": 5,
  "offline_username": "CodexSandboxOffline",
  "online_username": "CodexSandboxOnline",
  "created_at": "2026-03-15T00:19:53.656895100+00:00",
  "read_roots": [
    "D:\\Quant",
    "F:\\DataCenter\\qlib",
    "\\\\wsl.localhost\\Ubuntu\\home\\hp\\projects\\RD-Agent"
  ],
  "write_roots": [
    "D:\\Quant",
    "F:\\DataCenter\\qlib",
    "\\\\wsl.localhost\\Ubuntu\\home\\hp\\projects\\RD-Agent"
  ]
}
```

### 2. 授予 Windows ACL

没有 `codex sandbox reset` 命令，需要手动用 `icacls` 授权：

```powershell
# D:\Quant (39129 files succeeded, 1 failed on protected binary)
icacls 'D:\Quant' /grant 'CodexSandboxOffline:(OI)(CI)F' /T /Q
icacls 'D:\Quant' /grant 'CodexSandboxOnline:(OI)(CI)F' /T /Q

# F:\DataCenter\qlib (121385 files succeeded)
icacls 'F:\DataCenter\qlib' /grant 'CodexSandboxOffline:(OI)(CI)F' /T /Q
icacls 'F:\DataCenter\qlib' /grant 'CodexSandboxOnline:(OI)(CI)F' /T /Q
```

注意：必须通过 PowerShell 运行，Git Bash 会把 `/grant` 解析为路径。

### 3. 修改 codex-companion.mjs sandbox 模式

文件：`C:\Users\HP\.claude\plugins\marketplaces\openai-codex\plugins\codex\scripts\codex-companion.mjs`  
行 460：

```javascript
// Before:
sandbox: request.write ? "workspace-write" : "read-only",
// After:
sandbox: request.write ? "danger-full-access" : "read-only",
```

## WSL 路径限制

Windows ACL 对 WSL 9p/Plan9 文件系统不生效。`icacls` 执行时报 "系统找不到指定的路径"。

**解决方案：** WSL 侧操作改由 Claude Code 主线程（通过 `wsl` 命令）或手动在 WSL 内执行，不依赖 Codex sandbox。

## Verification

Codex task 验证测试（sandbox 模式 `danger-full-access`）：

| 测试 | 结果 |
|---|---|
| 读取 `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md` | 通过 |
| 列出 `F:\DataCenter\qlib\cn_data_merged\calendars\` | 通过 |
| 写入 `D:\Quant\codex-sandbox-test.txt` | 通过 |
| WSL 路径访问 | N/A（WSL 未运行 + ACL 不生效） |

## Key Files

| 文件 | 作用 |
|---|---|
| `C:\Users\HP\.codex\.sandbox\setup_marker.json` | sandbox 路径白名单 |
| `C:\Users\HP\.codex\config.toml` | Codex CLI 全局配置 |
| `C:\Users\HP\.codex\sandbox.log` | sandbox 审计日志 |
| `C:\Users\HP\.claude\plugins\marketplaces\openai-codex\plugins\codex\scripts\codex-companion.mjs` | Claude Code Codex companion，控制 sandbox 模式 |
| `C:\Users\HP\.claude\plugins\marketplaces\openai-codex\plugins\codex\scripts\lib\codex.mjs` | Codex app-server 客户端，`buildThreadParams` 设置默认 sandbox |
| `C:\Users\HP\.claude\plugins\marketplaces\openai-codex\plugins\codex\agents\codex-rescue.md` | rescue agent 定义，默认加 `--write` |

## Gotchas

1. **`config.toml` 的 `sandbox_mode` 不等于运行时 sandbox。** CLI 交互模式读 config.toml，但 companion 脚本硬编码了 sandbox 参数，不继承 config.toml 的值。
2. **`codex sandbox reset` 不存在。** 没有内置的 sandbox ACL 重置命令，必须手动 `icacls`。
3. **Git Bash 会 mangle `/grant` 等斜杠开头的参数。** 运行 `icacls` 必须通过 `powershell -Command "..."` 或 `cmd //c`。
4. **`workspace-write` 只写 cwd。** 即使 ACL 允许，`workspace-write` 模式下 Codex 仍然只能写 cwd 子目录，必须用 `danger-full-access` 才能写任意已授权路径。
5. **插件更新可能覆盖 companion 修改。** `codex-companion.mjs` 的修改在插件更新时会被覆盖，需要在更新后重新 patch。
