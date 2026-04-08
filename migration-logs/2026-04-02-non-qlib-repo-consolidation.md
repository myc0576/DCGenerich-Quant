# Non-QLIB Repository Consolidation Notes

- `F:\Quant\repos\FinRL` was converted from a junction into a real repository directory by moving the existing `F:\FinRL` contents there.
- `F:\FinRL` and `D:\FinRL` now both resolve to `F:\Quant\repos\FinRL` as junctions.
- `F:\vnpy` was renamed to `F:\vnpy-backup-2026-04-02` and replaced with a junction to `F:\Quant\repos\vnpy`.
- `F:\wondertrader` was renamed to `F:\wondertrader-backup-2026-04-02` and replaced with a junction to `F:\Quant\repos\wondertrader`.

Verification:

- `git -C` top-level resolution now points `FinRL`, `vnpy`, and `wondertrader` roots at their managed locations.
- Working-tree state remained unchanged across each repo before and after the path swaps.
