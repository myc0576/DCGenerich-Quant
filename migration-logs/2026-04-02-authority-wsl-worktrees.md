# 2026-04-02 WSL / Worktrees Inventory

## Scope

Read-only checks completed for:
- `wsl -l -v`
- `HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss` `BasePath`
- `D:\WSL`
- `F:\Quant\wsl`
- `git -C D:/QLIB worktree list --porcelain`
- `D:\QLIB\.worktrees`
- `F:\Quant\.worktrees`
- `F:\Quant\worktrees`
- `C:\Users\HP\.config\superpowers\worktrees\QLIB`

## WSL Inventory

`wsl -l -v` reported two installed distros:
- `kali-linux` - `Stopped` - version `2`
- `Ubuntu` - `Stopped` - version `2`

Registry `BasePath` results:
- `kali-linux` GUID `{12b85860-0eb2-4d1c-bfae-894cb9fadeac}` -> `C:\Users\HP\AppData\Local\wsl\{12b85860-0eb2-4d1c-bfae-894cb9fadeac}`
- `Ubuntu` GUID `{92bd2e58-cd90-49be-a1c2-38e3d4844dd0}` -> `F:\Quant\wsl\Ubuntu`

Directory checks:
- `D:\WSL` exists but is empty at top level.
- `F:\Quant\wsl` contains `Ubuntu\` and `backup\`.
- `F:\Quant\wsl\Ubuntu` exists and is the live BasePath target for the Ubuntu distro.

Interpretation:
- The Ubuntu distro is already located under the managed WSL storage tree on `F:`.
- The Kali distro is still anchored in the user-local WSL storage path under `C:\Users\HP\AppData\Local\wsl\...`, so it is not yet aligned with the `F:\Quant\wsl` layout.

## Worktree Distribution

`git -C D:/QLIB worktree list --porcelain` reported these worktrees:
- `D:\QLIB` -> `refs/heads/main`
- `C:\Users\HP\.config\superpowers\worktrees\QLIB\xtquant-qlib-cn-daily-data` -> `refs/heads/codex/xtquant-qlib-cn-daily-data`
- `D:\QLIB\.worktrees\csi1000-replay-validation` -> `refs/heads/codex/csi1000-replay-validation`
- `D:\QLIB\.worktrees\quant-storage-migration-exec` -> `refs/heads/chore/quant-storage-migration-exec`
- `D:\QLIB\.worktrees\vnpy-all-a-rule-reversal-backtest` -> `refs/heads/codex/vnpy-all-a-rule-reversal-backtest`
- `D:\QLIB\.worktrees\vnpy-csi1000-integration` -> `refs/heads/codex/vnpy-csi1000-integration`

Directory inventory:
- `D:\QLIB\.worktrees` contains 4 worktree directories.
- `F:\Quant\.worktrees` contains 1 worktree directory: `quant-kb-v1`.
- `F:\Quant\worktrees` does not exist.
- `C:\Users\HP\.config\superpowers\worktrees\QLIB` contains 1 worktree directory: `xtquant-qlib-cn-daily-data`.

## Maintenance Window Points

- The Kali distro still uses the user-local Lxss storage path, so any migration or consolidation of WSL data still needs a maintenance-window step for that distro.
- `D:\WSL` is present but unused, so it is currently only a placeholder/legacy target from an inventory perspective.
- Worktrees are spread across three roots (`D:\QLIB\.worktrees`, `F:\Quant\.worktrees`, and `C:\Users\HP\.config\superpowers\worktrees\QLIB`), so any cleanup or migration needs to keep all three inventories in sync.
- `F:\Quant\worktrees` is absent, so tooling or scripts expecting that path need retargeting or guard rails before they are used in a maintenance window.

## Notes

- No files outside the requested report path were modified.
- This inventory reflects the filesystem and registry state observed on `2026-04-02`.

## Post-Repair Update

After the low-risk preparation batch on 2026-04-02:

- `F:\Quant\worktrees\QLIB` was created as the planned destination root for future QLIB worktree consolidation.
- No worktrees were moved yet; `D:\QLIB\.worktrees\*` and `C:\Users\HP\.config\superpowers\worktrees\QLIB\*` remain unchanged.
