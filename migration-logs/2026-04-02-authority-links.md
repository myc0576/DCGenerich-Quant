# 2026-04-02 Authority Links / Compat Inventory

## Scope

Read-only check of:
`D:\FinRL`, `D:\QLIB`, `D:\gjqmt_link`, `D:\gjqmt_real_live`, `D:\mason_quant_app`, `E:\QLIBdata`, `E:\QLIBartifacts`, `D:\quant-compat`, `F:\quant-compat`, `F:\Quant\compat`

## Inventory

| Path | Kind | Link type | Target | Health | Notes | Repair priority |
|---|---|---:|---|---|---|---:|
| `D:\FinRL` | junction | Junction | `F:\Quant\repos\FinRL` | healthy-link | Link resolves and target is reachable. | 4 |
| `D:\QLIB` | entity | n/a | n/a | healthy | Plain directory, accessible. | 4 |
| `D:\gjqmt_link` | junction | Junction | `D:\quant-compat\qmt\sim` | broken-link | Junction exists, but target path is not reachable. | 1 |
| `D:\gjqmt_real_live` | junction | Junction | `D:\quant-compat\qmt\live` | broken-link | Junction exists, but target path is not reachable. | 1 |
| `D:\mason_quant_app` | junction | Junction | `D:\quant-compat\apps\mason` | broken-link | Junction exists, but target path is not reachable. | 1 |
| `E:\QLIBdata` | junction | Junction | `F:\Quant\data\QLIBdata` | healthy-link | Link resolves and target is reachable. | 4 |
| `E:\QLIBartifacts` | junction | Junction | `F:\Quant\artifacts\QLIBartifacts` | healthy-link | Link resolves and target is reachable. | 4 |
| `D:\quant-compat` | absent | n/a | n/a | missing-or-inaccessible | Direct check failed: path does not exist. This is the common missing root for the three broken junctions above. | 0 |
| `F:\quant-compat` | entity | n/a | n/a | healthy | Plain directory, accessible. No direct dependency observed from the checked paths. | 4 |
| `F:\Quant\compat` | absent | n/a | n/a | missing-or-inaccessible | Direct check failed: path does not exist. No direct link dependency observed in this scan. | 3 |

## Recommended Repair Order

1. Restore or recreate `D:\quant-compat` first.
   - It is the shared missing root for `D:\gjqmt_link`, `D:\gjqmt_real_live`, and `D:\mason_quant_app`.
   - Until this root exists, those three junctions will stay broken even though the link objects themselves are present.
2. Re-validate or repoint the three broken junctions after `D:\quant-compat` is back.
   - `D:\gjqmt_link` should point to a valid `qmt\sim` tree.
   - `D:\gjqmt_real_live` should point to a valid `qmt\live` tree.
   - `D:\mason_quant_app` should point to a valid `apps\mason` tree.
3. Decide whether `F:\Quant\compat` is meant to be an active compatibility root.
   - It is currently missing, but no direct dependency was observed in the inspected entry set.
4. Leave the healthy entries alone for now.
   - `D:\FinRL`, `D:\QLIB`, `E:\QLIBdata`, `E:\QLIBartifacts`, and `F:\quant-compat` are currently reachable.

## Health Summary

- Healthy: `D:\QLIB`, `F:\quant-compat`
- Healthy links: `D:\FinRL`, `E:\QLIBdata`, `E:\QLIBartifacts`
- Broken links: `D:\gjqmt_link`, `D:\gjqmt_real_live`, `D:\mason_quant_app`
- Missing / inaccessible: `D:\quant-compat`, `F:\Quant\compat`

## Notes

- The broken junctions all converge on `D:\quant-compat`, so the most likely single-point fix is to restore that root and its expected subtrees.
- `F:\Quant\compat` looks like a separate missing path rather than the immediate cause of the broken junctions in this scan.

## Post-Repair Update

After the low-risk repair batch on 2026-04-02:

- `D:\quant-compat` was recreated as a real directory root.
- `D:\quant-compat\qmt\sim -> D:\国金QMT交易端模拟`
- `D:\quant-compat\qmt\live -> D:\国金证券QMT交易端`
- `D:\quant-compat\apps\mason -> F:\Quant\repos\Mason量化回测系统3`
- `D:\gjqmt_link`, `D:\gjqmt_real_live`, and `D:\mason_quant_app` now resolve successfully again.
- `Test-Path D:\gjqmt_link\userdata_mini` returned `True`.
- `Test-Path D:\mason_quant_app` returned `True`.
