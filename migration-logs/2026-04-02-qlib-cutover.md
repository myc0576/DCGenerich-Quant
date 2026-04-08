# QLIB Cutover Notes

- Recreated the previously out-of-root `xtquant-qlib-cn-daily-data` worktree under `F:/Quant/worktrees/QLIB/`.
- Preserved D-side-only assets before cutover by copying:
  - `D:/QLIB.__pre_junction_20260402/docs/plans/2026-03-31-rdagent-qlib-vnpy-live-deployment.md`
  - the `vnpy-csi1000-integration` worktree plan, converter script, `scripts/rdagent`, related tests, and `tmp` labs
  into the managed `F:/Quant/repos/QLIB` / `F:/Quant/worktrees/QLIB/vnpy-csi1000-integration` locations.
- Replaced the live `D:/QLIB` path with a junction to `F:/Quant/repos/QLIB`.
- Preserved the previous D-side repository as `D:/QLIB.__pre_junction_20260402` for rollback and burn-in validation.

Verification:

- `Get-Item D:/QLIB` shows `LinkType = Junction` and `Target = F:/Quant/repos/QLIB`.
- `git -C D:/QLIB worktree list --porcelain` resolves only to the managed F-side repo and worktrees.
- `git -C D:/QLIB rev-parse --show-toplevel` resolves to `F:/Quant/repos/QLIB`.
