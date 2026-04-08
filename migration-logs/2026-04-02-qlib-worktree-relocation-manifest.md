# 2026-04-02 QLIB Worktree Relocation Manifest

## Purpose

Freeze the current `QLIB` worktree layout before any maintenance-window migration.

## Current Registered Worktrees

| Current Path | Branch | Current Role | Proposed Action | Proposed Destination |
|---|---|---|---|---|
| `D:\QLIB` | `main` | Physical legacy repo entry | Keep until final cutover | `F:\Quant\repos\QLIB` remains working authority |
| `C:\Users\HP\.config\superpowers\worktrees\QLIB\xtquant-qlib-cn-daily-data` | `codex/xtquant-qlib-cn-daily-data` | Healthy external worktree | Keep in place for now | no move in current batch |
| `D:\QLIB\.worktrees\csi1000-replay-validation` | `codex/csi1000-replay-validation` | Legacy D-drive worktree | Migrate during maintenance window | `F:\Quant\worktrees\QLIB\csi1000-replay-validation` |
| `D:\QLIB\.worktrees\quant-storage-migration-exec` | `chore/quant-storage-migration-exec` | Legacy D-drive worktree | Migrate during maintenance window | `F:\Quant\worktrees\QLIB\quant-storage-migration-exec` |
| `D:\QLIB\.worktrees\vnpy-all-a-rule-reversal-backtest` | `codex/vnpy-all-a-rule-reversal-backtest` | Legacy D-drive worktree | Migrate during maintenance window | `F:\Quant\worktrees\QLIB\vnpy-all-a-rule-reversal-backtest` |
| `D:\QLIB\.worktrees\vnpy-csi1000-integration` | `codex/vnpy-csi1000-integration` | Legacy D-drive worktree | Migrate during maintenance window | `F:\Quant\worktrees\QLIB\vnpy-csi1000-integration` |

## Preconditions

1. Close any VS Code / terminal / watcher still attached to `D:\QLIB` or `D:\QLIB\.worktrees\*`.
2. Re-run `git -C D:/QLIB worktree list --porcelain` immediately before any move.
3. Do not move `C:\Users\HP\.config\superpowers\worktrees\QLIB\xtquant-qlib-cn-daily-data` in the same batch unless there is an explicit reason.

## Notes

- `F:\Quant\worktrees\QLIB` already exists and is ready to receive migrated worktrees.
- This manifest is a planning artifact only; no worktree move was executed when this file was written.
