# Quant Workspace Architecture Migration Execution Plan

## Goal

Capture the final post-cleanup state of the quant workspace migration so the repository now reads as a completed handoff: canonical workspace paths live under `F:/Quant`, physical WSL storage lives under `F:/WSL`, and the migration-era root compatibility aliases on `D:/`, `E:/`, and `F:/` are retired.

## Context

- Source planning note: `C:/Users/HP/Desktop/F鐩橀噺鍖栧伐浣滃尯鏋舵瀯浼樺寲鏂规-2026-04-02.md`
- `F:/Quant` is the canonical workspace root and the place where this handoff is documented.
- `F:/WSL` is the canonical physical WSL storage root.
- The migration-era aliases that once pointed at the managed tree were part of the cutover history, but they are no longer the authoritative entry points in the final state.
- Historical references such as `D:/QLIB`, `D:/FinRL`, `D:/quant-compat`, `F:/quant-compat`, and `F:/Quant/wsl` are preserved here only as migration history and rollback context.

## Constraints

- Preserve existing user changes and working tree state across all repositories.
- Do not reintroduce retired root-level compatibility aliases.
- Keep historical context in the plan, but make the handoff read as a final-state artifact rather than an in-progress migration note.
- Use Windows-safe file operations and verify final targets before recursive move or delete actions when future cleanup work is needed.

## Non-goals

- Refactoring code inside the business repositories.
- Recreating compatibility aliases on `D:/`, `E:/`, or `F:/`.
- Performing additional filesystem cleanup beyond documenting the completed migration state.
- Cleaning every unrelated untracked file from user repos.

## File Map

- `F:/Quant/docs/plans/2026-04-02-quant-workspace-architecture-migration.md`
- `F:/Quant/migration-logs/2026-04-02-qlib-cutover.md`
- `F:/Quant/migration-logs/2026-04-02-non-qlib-repo-consolidation.md`
- `F:/Quant/migration-logs/2026-04-02-wsl-compat-migration.md`
- `F:/Quant/repos/QLIB`
- `F:/Quant/worktrees/QLIB`
- `F:/Quant/repos/FinRL`
- `F:/Quant/repos/vnpy`
- `F:/Quant/repos/wondertrader`
- `F:/Quant/compat`
- `F:/WSL`
- Historical alias references: `D:/QLIB`, `D:/FinRL`, `D:/quant-compat`, `F:/quant-compat`, `F:/Quant/wsl`, `D:/gjqmt_link`, `D:/gjqmt_real_live`, `D:/mason_quant_app`

## Risks

- Old scripts, notes, or muscle memory may still point at retired `D:/`, `E:/`, or `F:/` compatibility aliases.
- Some historical logs and non-text artifact metadata may still mention retired aliases even though the live compatibility mappings are gone.
- `Ubuntu` now launches from `F:/WSL/Ubuntu`, but `kali-linux` still has its `BasePath` under `C:\Users\HP\AppData\Local\wsl\...`; that distro placement is separate from the compatibility-mapping cleanup performed here.
- `wondertrader` still carries its large pre-existing staged/untracked working tree, so any later cleanup should remain repo-aware.

## Task Breakdown
- [x] Task 1: Finalize the migration execution baseline
  Files:
  `F:/Quant/docs/plans/2026-04-02-quant-workspace-architecture-migration.md`
  `F:/Quant/migration-logs/`
  Change:
  Record the reviewed state, remaining work, and safety assumptions inside the managed workspace plan and logs.
  Verify:
  Confirm the plan file exists and reflects the audited current state.
  Expected:
  The migration can be resumed from the repository itself without relying on chat history.

- [x] Task 2: Complete QLIB repository and worktree migration
  Files:
  `D:/QLIB`
  `D:/QLIB.__pre_junction_20260402`
  `F:/Quant/repos/QLIB`
  `F:/Quant/worktrees/QLIB`
  Change:
  Consolidate the QLIB main repo under `F:/Quant/repos/QLIB`, reconcile D-only assets into the managed repo/worktree, archive the old D repo, and replace `D:/QLIB` with a junction to the managed repo.
  Verify:
  `git -C F:/Quant/repos/QLIB worktree list`
  `Get-Item D:/QLIB`
  `git -C D:/QLIB rev-parse --show-toplevel`
  Expected:
  `D:/QLIB` becomes a junction to the managed repo and only managed worktree paths remain active from the published entry point.

- [x] Task 3: Consolidate non-QLIB repositories and clean root duplicates safely
  Files:
  `F:/FinRL`
  `F:/vnpy`
  `F:/wondertrader`
  `F:/Quant/repos/FinRL`
  `F:/Quant/repos/vnpy`
  `F:/Quant/repos/wondertrader`
  `D:/FinRL`
  Change:
  Replace placeholder links with real managed repo directories where needed, keep working states intact, and rename old root-level copies into dated backups before replacing them with junctions.
  Verify:
  `Get-Item D:/FinRL`
  `git -C F:/Quant/repos/FinRL rev-parse --show-toplevel`
  `git -C F:/Quant/repos/vnpy rev-parse --show-toplevel`
  `git -C F:/Quant/repos/wondertrader rev-parse --show-toplevel`
  Expected:
  The authoritative repos live under `F:/Quant/repos/`, legacy roots resolve correctly, and root-level duplicates no longer present as active real repo paths.

- [x] Task 4: Rebuild the managed compatibility layer and WSL placement
  Files:
  `F:/Quant/compat`
  `D:/gjqmt_link`
  `D:/gjqmt_real_live`
  `D:/mason_quant_app`
  `D:/quant-compat`
  `F:/quant-compat`
  `F:/WSL`
  `F:/Quant/wsl`
  Change:
  Create `F:/Quant/compat`, retarget the published D/F compatibility entry links into it, move the WSL payload to `F:/WSL`, and retire the workspace-local WSL alias as part of the final cleanup.
  Verify:
  `Get-Item D:/gjqmt_link`
  `Get-Item D:/gjqmt_real_live`
  `Get-Item D:/mason_quant_app`
  `Get-Item D:/quant-compat`
  `Get-Item F:/Quant/wsl`
  Expected:
  Compatibility entry points resolve into the managed tree and the physical WSL payload lives at `F:/WSL` with no active workspace-local alias required.

- [x] Task 5: Run end-to-end verification and update handoff notes
  Files:
  `F:/Quant/docs/plans/2026-04-02-quant-workspace-architecture-migration.md`
  `F:/Quant/migration-logs/`
  Change:
  Execute final path, git, worktree, compat, and WSL verification and record results, surprises, and follow-ups.
  Verify:
  Run the final verification command set after all file operations complete.
  Expected:
  The plan shows a completed migration status with concrete evidence and any residual caveats.

## Progress

- 2026-04-02: Audited the source plan and current filesystem state.
- 2026-04-02: Started parallel subagent investigation for QLIB/worktrees, non-QLIB repo consolidation, and WSL/compat paths.
- 2026-04-02: Recreated the `xtquant-qlib-cn-daily-data` QLIB worktree under `F:/Quant/worktrees/QLIB`.
- 2026-04-02: Preserved D-side-only QLIB assets, archived the old D-side repo as `D:/QLIB.__pre_junction_20260402`, and cut over `D:/QLIB` to a junction.
- 2026-04-02: Converted `F:/Quant/repos/FinRL` into a real managed repo and replaced legacy root paths for `FinRL`, `vnpy`, and `wondertrader` with junctions.
- 2026-04-02: Moved WSL storage to `F:/WSL`, rebuilt the managed compat namespace under `F:/Quant/compat`, and documented the workspace-local WSL alias as retired in the final state.
- 2026-04-02: Recorded the final post-cleanup handoff state so the plan reads as a completed migration artifact.
- 2026-04-02: Rewrote legacy compatibility path references in 397 Mason text/code artifacts to their canonical `F:/Quant` targets.
- 2026-04-02: Removed the migration-era root aliases on `D:/`, `E:/`, and `F:/`, deleted retained burn-in backups, and cleared the extra migration residue directories/files.

## Surprises

- `D:/QLIB` and `F:/Quant/repos/QLIB` were separate live repositories with matching branch tips, not one repo already relocated.
- A partial rename attempt on `D:/QLIB` moved the old repo to `D:/QLIB.__pre_junction_20260402` and left an empty shell at `D:/QLIB`; this was turned into a clean cutover opportunity after validating the backup.
- A full `wsl --export Ubuntu` proved too slow for the migration window, so the safer finish was to back up `Lxss`, stop the export, and retarget `Ubuntu` directly.
- `F:/Quant/compat` centralized compatibility through junctions to the live QMT and Mason targets, which made the final state simpler than the original mixed-root layout.

## Decision Log

- 2026-04-02: Treat the repository copy under `F:/Quant` as the canonical place to write execution notes and final handoff information.
- 2026-04-02: Prefer reversible cleanup operations such as renaming old root repos to dated backup directories instead of deleting them outright.
- 2026-04-02: Keep `D:/QLIB.__pre_junction_20260402`, `F:/vnpy-backup-2026-04-02`, and `F:/wondertrader-backup-2026-04-02` as burn-in backups instead of deleting them during the same session.
- 2026-04-02: Use `F:/WSL` as the canonical physical WSL root and treat `F:/Quant/wsl` as migration history rather than a live dependency.
- 2026-04-02: Preserve the historical root compatibility paths in the plan, but retire them from the final-state architecture.
- 2026-04-02: Close the migration as a documentation-and-handoff artifact once the managed roots and WSL placement were stable.
- 2026-04-02: At the user's request, finish the migration in the same session by deleting the retired root aliases and burn-in backups instead of keeping an additional observation window.
- 2026-04-02: Preserve only the canonical compat tree under `F:/Quant/compat`; do not keep any duplicate root-level compatibility entry points on `D:/`, `E:/`, or `F:/`.

## Verification Matrix

| Area | Command | Status | Notes |
| --- | --- | --- | --- |
| Canonical workspace roots | `Test-Path F:/Quant/repos`; `Test-Path F:/Quant/worktrees`; `Test-Path F:/Quant/compat`; `Test-Path F:/WSL` | Verified | Final handoff locations live under `F:/Quant` and `F:/WSL` |
| Canonical repos | `git -C F:/Quant/repos/QLIB rev-parse --show-toplevel`; `git -C F:/Quant/repos/FinRL rev-parse --show-toplevel`; `git -C F:/Quant/repos/vnpy rev-parse --show-toplevel`; `git -C F:/Quant/repos/wondertrader rev-parse --show-toplevel` | Verified | All managed repos resolve under `F:/Quant/repos` |
| Root alias retirement | `Test-Path D:/QLIB`; `Test-Path D:/FinRL`; `Test-Path D:/quant-compat`; `Test-Path D:/gjqmt_link`; `Test-Path D:/gjqmt_real_live`; `Test-Path D:/mason_quant_app`; `Test-Path E:/QLIBdata`; `Test-Path E:/QLIBartifacts`; `Test-Path F:/QLIBdata`; `Test-Path F:/QLIBartifacts`; `Test-Path F:/FinRL`; `Test-Path F:/vnpy`; `Test-Path F:/wondertrader`; `Test-Path F:/quant-compat`; `Test-Path F:/Quant/wsl` | Verified | All retired root compatibility entry points now return `False` |
| Compat layer | `Get-Item F:/Quant/compat/apps/mason`; `Get-Item F:/Quant/compat/qmt/live`; `Get-Item F:/Quant/compat/qmt/sim` | Verified | Only the canonical compat tree remains live |
| WSL | `wsl --list --verbose`; `Get-ChildItem F:/WSL`; `Test-Path F:/Quant/wsl`; `Get-ChildItem HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss`; `wsl -d Ubuntu -u root -- sh -lc "pwd && uname -a"` | Verified | `F:/WSL` is live, `F:/Quant/wsl` is gone, `Ubuntu` now points to `F:/WSL/Ubuntu`, and `kali-linux` remains on its existing user-local base path |
| Backups and residue | `Test-Path D:/QLIB.__pre_junction_20260402`; `Test-Path F:/FinRL.__pre_junction_20260331`; `Test-Path F:/vnpy-backup-2026-04-02`; `Test-Path F:/wondertrader-backup-2026-04-02`; `Test-Path F:/WSL/backup/Ubuntu-final-20260402.partial-aborted-20260402-151708.tar`; `Test-Path F:/Quant/migration-logs/wsl-lxss-backup-20260402-151708.reg`; `Test-Path E:/_migration_old`; `Test-Path F:/_migration_old`; `Test-Path F:/QLIBdata.__pre_junction_20260331`; `Test-Path F:/QLIBartifacts.__pre_junction_20260331`; `Test-Path F:/综合自定义交易系统v5.6.8.__pre_junction_20260331` | Verified | All targeted migration backups/residue now return `False` |
| Mason text/code paths | `Get-Content F:/Quant/artifacts/QLIBartifacts/mason/legacy_path_rewrite_changed_files.txt`; targeted string scan under `F:/Quant/artifacts/QLIBartifacts/mason` | Verified | Canonical `F:/Quant` replacements were applied to allowed text/code files and no legacy path strings remain in that text scope |

## Outcome / Handoff

- Completed on 2026-04-02.
- Canonical managed roots are now `F:/Quant/repos`, `F:/Quant/worktrees`, `F:/Quant/data`, `F:/Quant/artifacts`, `F:/Quant/compat`, and `F:/WSL`.
- Retired compatibility aliases and migration-era entry points removed from disk:
  - `D:/QLIB`
  - `D:/FinRL`
  - `D:/quant-compat`
  - `E:/QLIBdata`
  - `E:/QLIBartifacts`
  - `F:/QLIBdata`
  - `F:/QLIBartifacts`
  - `F:/FinRL`
  - `F:/vnpy`
  - `F:/wondertrader`
  - `F:/quant-compat`
  - `D:/gjqmt_link`
  - `D:/gjqmt_real_live`
  - `D:/mason_quant_app`
  - `F:/Quant/wsl`
- Removed migration backups and residue:
  - `D:/QLIB.__pre_junction_20260402`
  - `F:/FinRL.__pre_junction_20260331`
  - `F:/vnpy-backup-2026-04-02`
  - `F:/wondertrader-backup-2026-04-02`
  - `F:/WSL/backup/Ubuntu-final-20260402.partial-aborted-20260402-151708.tar`
  - `F:/Quant/migration-logs/wsl-lxss-backup-20260402-151708.reg`
  - `E:/_migration_old`
  - `F:/_migration_old`
  - `F:/QLIBdata.__pre_junction_20260331`
  - `F:/QLIBartifacts.__pre_junction_20260331`
  - `F:/综合自定义交易系统v5.6.8.__pre_junction_20260331`
- Text/code compatibility-path cleanup completed under `F:/Quant/artifacts/QLIBartifacts/mason`; the changed-file inventory is recorded in `F:/Quant/artifacts/QLIBartifacts/mason/legacy_path_rewrite_changed_files.txt`.
- Follow-up:
  - If any future live script still mentions a retired root alias, update it to the canonical `F:/Quant` or `F:/WSL` location instead of recreating the alias.
  - Keep the migration logs as the historical record for why the retired aliases existed and how the cutover was completed.
