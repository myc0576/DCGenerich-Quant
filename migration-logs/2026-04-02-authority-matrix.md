# 2026-04-02 Authority Matrix

## Summary

This document freezes the current authority decisions and observed health state after the 2026-04-02 review and low-risk repair batch.

Sources used:
- `F:/Quant/migration-logs/2026-04-02-authority-repos.md`
- `F:/Quant/migration-logs/2026-04-02-authority-links.md`
- `F:/Quant/migration-logs/2026-04-02-authority-wsl-worktrees.md`

## Canonical Decisions

| Area | Canonical / Authority | Current Status | Notes |
|---|---|---|---|
| Control plane | `F:\Quant` | active | Independent management repo. |
| QLIB repo | `F:\Quant\repos\QLIB` | active but not clean | Same HEAD as `D:\QLIB`, but cutover not complete and sync residue exists on canonical side. |
| QLIB legacy entry | `D:\QLIB` | still physical repo | Not yet downgraded to junction; maintenance window still required. |
| FinRL repo | `F:\FinRL` | active authority | `F:\Quant\repos\FinRL` now resolves to `F:\FinRL` via junction and is no longer an empty pseudo-canonical directory. |
| vnpy repo | `F:\Quant\repos\vnpy` | likely canonical | Root and canonical share branch/HEAD, canonical contains sync residue. |
| wondertrader repo | `F:\Quant\repos\wondertrader` | likely canonical | Root and canonical share branch/HEAD, canonical contains sync residue and deleted-added virtualenv noise. |
| Mason repo | `F:\Quant\repos\Mason量化回测系统3` | active authority | Root copy behaves more like a mirror / duplicate working tree. |
| 综合自定义交易系统 | `F:\Quant\repos\综合自定义交易系统v5.6.8` | canonical candidate | Requires pair-specific follow-up before root cleanup. |
| QLIB data | `F:\Quant\data\QLIBdata` | healthy | Real payload moved into canonical path on 2026-04-02. |
| QLIB artifacts | `F:\Quant\artifacts\QLIBartifacts` | healthy | Real payload moved into canonical path on 2026-04-02. |
| WSL Ubuntu | `F:\Quant\wsl\Ubuntu` | healthy | Confirmed by registry `BasePath`. |
| WSL Kali | `C:\Users\HP\AppData\Local\wsl\...` | not consolidated | Outside current managed root. |
| QMT compat root | `D:\quant-compat` | healthy | Recreated on 2026-04-02 and now backs all three legacy aliases. |

## Legacy Entry Health

| Entry | Target | Health | Notes |
|---|---|---|---|
| `D:\FinRL` | `F:\Quant\repos\FinRL -> F:\FinRL` | healthy | Healthy chained junction path to the real FinRL repo. |
| `D:\QLIB` | n/a | reachable | Still a physical repo, not yet a compatibility junction. |
| `E:\QLIBdata` | `F:\Quant\data\QLIBdata` | healthy | Reached canonical payload after 2026-04-02 move. |
| `E:\QLIBartifacts` | `F:\Quant\artifacts\QLIBartifacts` | healthy | Reached canonical payload after 2026-04-02 move. |
| `D:\gjqmt_link` | `D:\quant-compat\qmt\sim` | healthy | `userdata_mini` confirmed reachable. |
| `D:\gjqmt_real_live` | `D:\quant-compat\qmt\live` | healthy | Restored via `D:\quant-compat`. |
| `D:\mason_quant_app` | `D:\quant-compat\apps\mason` | healthy | Restored via `D:\quant-compat` to Mason canonical repo. |

## Worktree State

| Root | State |
|---|---|
| `D:\QLIB\.worktrees` | 4 QLIB worktrees still active |
| `C:\Users\HP\.config\superpowers\worktrees\QLIB` | 1 QLIB worktree still active |
| `F:\Quant\.worktrees` | 1 QUANT worktree (`quant-kb-v1`) |
| `F:\Quant\worktrees` | absent |

Implication:
- `QLIB` cutover cannot proceed until `D:\QLIB\.worktrees` is drained or migrated.
- Existing `C:\Users\HP\.config\superpowers\worktrees\QLIB\*` must stay in scope for any final worktree consolidation.

## 2026-04-02 Completed Low-Risk Changes

1. Moved `F:\QLIBdata` payload into `F:\Quant\data\QLIBdata`.
2. Moved `F:\QLIBartifacts` payload into `F:\Quant\artifacts\QLIBartifacts`.
3. Recreated `F:\QLIBdata` and `F:\QLIBartifacts` as compatibility junctions back to canonical paths.
4. Recreated `D:\quant-compat` and its sub-junctions:
   - `D:\quant-compat\qmt\sim -> D:\国金QMT交易端模拟`
   - `D:\quant-compat\qmt\live -> D:\国金证券QMT交易端`
   - `D:\quant-compat\apps\mason -> F:\Quant\repos\Mason量化回测系统3`
5. Replaced empty `F:\Quant\repos\FinRL` with a junction to `F:\FinRL`, preserving both `F:\Quant\repos\FinRL` and `D:\FinRL` as valid access paths to the real FinRL repo.

## Remaining High-Risk Decisions

1. Decide when to physically move or retire `F:\FinRL`, given that `F:\Quant\repos\FinRL` is now only a compatibility junction and not a separate payload.
2. Decide exact cleanup strategy for `vnpy`, `wondertrader`, and other duplicated repo pairs with sync residue.
3. Drain or migrate all QLIB worktrees under `D:\QLIB\.worktrees`.
4. Perform `D:\QLIB` cutover only inside a maintenance window.
