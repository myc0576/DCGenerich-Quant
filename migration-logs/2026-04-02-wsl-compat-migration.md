# WSL + Compat Migration Notes

- Moved `F:/Quant/wsl` to `F:/WSL` and recreated `F:/Quant/wsl` as a junction to preserve the old path.
- Built `F:/Quant/compat` as the canonical compat tree and recreated `D:/quant-compat` and `F:/quant-compat` as junctions to it.
- Repointed `D:/gjqmt_link`, `D:/gjqmt_real_live`, and `D:/mason_quant_app` directly into `F:/Quant/compat`.
- Backed up the current WSL registry state to `F:/Quant/migration-logs/wsl-lxss-backup-20260402-151708.reg`.
- Stopped the slow `wsl --export Ubuntu` run, preserved its partial artifact as `F:/WSL/backup/Ubuntu-final-20260402.partial-aborted-20260402-151708.tar`, and switched to a registry retarget approach instead of full export/import.
- Retargeted the `Ubuntu` WSL registry `BasePath` from `F:/Quant/wsl/Ubuntu` to `F:/WSL/Ubuntu`.
- Verified `wsl -d Ubuntu -u root -- sh -lc \"uname -a && pwd\"` succeeds after the registry retarget.

Guard assumptions:

- The compat trees contained only directory placeholders and junctions, with no standalone files to preserve.
- Existing junction targets were left intact, including the live QMT target path.
