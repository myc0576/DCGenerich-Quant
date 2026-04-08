# Qlib Dataset Merge Execution Plan

## Goal

Create and run a WSL-based merge workflow that combines the official Qlib CN dataset, the existing extended dataset, and staged CSI instrument memberships into `/mnt/f/DataCenter/qlib/cn_data_merged/`, then document the outcome in `D:/Quant/docs/reports/data_merge_report.md`.

## Context

- Source datasets:
  - Official: `/mnt/f/DataCenter/qlib/cn_data_official/`
  - Existing: `/mnt/f/DataCenter/qlib/cn_data/`
  - CSI staging: `/mnt/f/DataCenter/qlib/instruments_staging/`
- Target dataset:
  - Merged: `/mnt/f/DataCenter/qlib/cn_data_merged/`
- User-defined merge rules:
  - Union calendar, sorted and deduplicated.
  - Common instruments merge by symbol, case-insensitive.
  - For overlap, prefer official values during dates present in the official calendar.
  - Preserve `change` only where official data exists.
  - Preserve `amount` only where existing data exists.
  - Copy staged `csi500.txt`, `csi1000.txt`, `csi2000.txt` and official `csi100.txt`, `csi300.txt`.
- Environment notes:
  - WSL2 `Ubuntu` is running; the default distro is not the requested environment.
  - `qlib` is not importable from the default `python3` environment, so verification may need repo-path or environment-path adjustment.

## Constraints

- All Python and Qlib commands must run in WSL `Ubuntu`.
- The merge is large; the script must support sampled runs before a full run and print progress.
- Qlib feature directories may differ only by symbol case; symbol handling must be case-insensitive while preserving a stable output naming convention.
- The plan must remain executable even if the merged dataset directory already exists partially.
- Report output must land at `D:/Quant/docs/reports/data_merge_report.md`.

## Non-goals

- Rebuilding or normalizing source datasets beyond the requested merge rules.
- Recomputing derived features not explicitly requested by the user.
- Modifying upstream official, existing, or staging dataset contents in place.
- Installing or reconfiguring a full Qlib environment unless verification cannot be completed otherwise.

## File Map

- Create: `F:/DataCenter/qlib/merge_datasets.py`
- Create: `D:/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py`
- Create: `D:/Quant/docs/reports/data_merge_report.md`
- Update: `D:/Quant/docs/plans/2026-04-06-qlib-dataset-merge.md`

## Risks

- Source field drift: the official dataset appears to include at least one extra field (`adjclose`) in some symbols; the script must choose whether to ignore or optionally carry unexpected fields without corrupting required outputs.
- Runtime and storage cost: a full rewrite of all merged feature arrays may take substantial time and disk space.
- Environment drift: `qlib` import currently fails in the default Ubuntu Python environment, which may block direct provider verification until an existing repo/env path is identified.
- Partial outputs: an interrupted merge could leave a half-built target tree unless writes are staged carefully or rerunnable behavior is implemented.
- Data alignment errors: incorrect calendar-to-binary index mapping would silently corrupt merged histories.

## Task Breakdown
- [x] Task 1: Inspect source dataset structure and select edge-case handling
  Files:
  - `F:/DataCenter/qlib/cn_data_official/`
  - `F:/DataCenter/qlib/cn_data/`
  - `F:/DataCenter/qlib/instruments_staging/`
  Change:
  - Confirm calendar lengths, instrument counts, field inventories, case conventions, and any unexpected fields or missing binaries that affect the merge algorithm.
  Verify:
  - Run WSL inspection commands on calendars, instruments, and sampled feature paths.
  Expected:
  - A concrete merge contract for symbol normalization, field selection, and verification scope.

- [x] Task 2: Write a failing test harness for core merge behavior
  Files:
  - `D:/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py`
  - `F:/DataCenter/qlib/merge_datasets.py`
  Change:
  - Add tests for calendar union, instrument-range merge, field precedence, case-insensitive symbol lookup, and NaN fill behavior using synthetic temporary directories.
  Verify:
  - Run `wsl.exe -d Ubuntu bash -lc "python3 -m pytest /mnt/d/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py -q"` and confirm the new tests fail for the expected missing implementation reason.
  Expected:
  - A red test suite that proves the required merge rules are encoded before production code is written.

- [x] Task 3: Implement the merge script with rerunnable sampled execution
  Files:
  - `F:/DataCenter/qlib/merge_datasets.py`
  - `D:/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py`
  Change:
  - Implement calendar merge, instrument merge, case-insensitive symbol resolution, per-field binary merge, instrument file copying, progress logging, and CLI options for sampled symbols and optional clean output behavior.
  Verify:
  - Re-run `wsl.exe -d Ubuntu bash -lc "python3 -m pytest /mnt/d/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py -q"` until all tests pass.
  Expected:
  - A green test suite and a script that can execute either sampled or full merges safely.

- [x] Task 4: Run a sampled merge and inspect output integrity
  Files:
  - `F:/DataCenter/qlib/merge_datasets.py`
  - `F:/DataCenter/qlib/cn_data_merged/`
  Change:
  - Run the script against a small symbol set that covers both shared and source-exclusive instruments, generating a sample merged dataset or sampled subset in the target tree.
  Verify:
  - Confirm expected calendars, instruments, feature files, array lengths, and overlap precedence for sampled symbols with WSL inspection commands.
  Expected:
  - Evidence that the algorithm handles overlap, NaN padding, and symbol-case normalization correctly before the full run.

- [x] Task 5: Run the full merge and capture summary metrics
  Files:
  - `F:/DataCenter/qlib/merge_datasets.py`
  - `F:/DataCenter/qlib/cn_data_merged/`
  Change:
  - Execute the full merge across all symbols and required instrument files, capturing counts and any warnings emitted during the run.
  Verify:
  - Check merged calendar bounds, merged instrument count, required index files, and target feature coverage with WSL commands.
  Expected:
  - A complete merged dataset rooted at `/mnt/f/DataCenter/qlib/cn_data_merged/`.

- [x] Task 6: Run provider verification and write the report
  Files:
  - `F:/DataCenter/qlib/cn_data_merged/`
  - `D:/Quant/docs/reports/data_merge_report.md`
  - `D:/Quant/docs/plans/2026-04-06-qlib-dataset-merge.md`
  Change:
  - Run the requested quick verification snippet using an available Qlib import path or documented fallback, then write the summary report with counts, fields, verification output, and issues encountered.
  Verify:
  - Execute the chosen verification command fresh in WSL and confirm the report reflects actual output and any limitations.
  Expected:
  - A report with calendar stats, stock counts, field availability, verification results, and surfaced issues.

## Progress

- 2026-04-06: Inspected high-level dataset presence, confirmed official/existing instrument and calendar counts, and confirmed that WSL `Ubuntu` is available while `qlib` is not importable from the default `python3` environment.
- 2026-04-06: Wrote `D:/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py` and drove the merge implementation with six synthetic tests covering overlap precedence, case-insensitive symbol lookup, symbol filtering, real Qlib bin headers, leading/trailing NaN coverage, and instrument-range clamping.
- 2026-04-06: Built `F:/DataCenter/qlib/merge_datasets.py`, validated a three-symbol sample merge in `/mnt/f/DataCenter/qlib/cn_data_merged_sample/`, then completed the full merge into `/mnt/f/DataCenter/qlib/cn_data_merged/`.
- 2026-04-06: Verified the merged provider with `pyqlib 0.9.7` from `~/miniconda3/envs/rdagent/bin/python` and wrote `D:/Quant/docs/reports/data_merge_report.md`.

## Surprises

- Official feature inventory appears to contain at least one extra field (`adjclose`) outside the requested merge set.
- `wsl.exe` defaults to `kali-linux`, so all execution needs explicit `-d Ubuntu`.
- Direct `import qlib` fails in the default Ubuntu Python 3.13 environment.
- Real Qlib `.day.bin` files include a leading float32 start-index header; the task’s raw-array description was incomplete.
- Some source bins include leading or trailing NaNs outside the instrument window, so file coverage cannot be assumed to match `all.txt` exactly.
- `SH000905` in the official `all.txt` extends to `2022-06-09`, which is outside the official calendar and required clamping to `2020-09-25`.

## Decision Log

- 2026-04-06: Use explicit `wsl.exe -d Ubuntu` for all commands to honor the environment requirement and avoid default-distro drift.
- 2026-04-06: Add a lightweight synthetic test harness before writing the merge script so calendar/index precedence bugs are caught cheaply before the large merge run.
- 2026-04-06: Treat Qlib feature files as `start_index + float32 payload`, matching the local QLIB source and observed datasets, instead of the raw-float-only format described in the task text.
- 2026-04-06: Sanitize instrument date ranges against each source calendar and record adjustments rather than crashing on the lone out-of-calendar row.
- 2026-04-06: Clip source file coverage to the effective merged instrument window so leading/trailing NaN padding in source bins does not break the merge.
- 2026-04-06: Use the existing `rdagent` conda environment for final provider verification instead of installing Qlib into the default Ubuntu Python environment.

## Verification Matrix

| Item | Command | Status | Notes |
|---|---|---|---|
| Dataset structure inspection | `wsl.exe -d Ubuntu bash -lc "<inspection commands>"` | In progress | Initial counts collected; field inventory still needs a faster complete pass. |
| Test-first merge behavior | `wsl.exe -d Ubuntu bash -lc "python3 -m pytest /mnt/d/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py -q"` | Complete | `6 passed in 0.45s` after expanding the suite for real Qlib bin semantics and source-range anomalies. |
| Sample merge integrity | `wsl.exe -d Ubuntu bash -lc "python3 /mnt/f/DataCenter/qlib/merge_datasets.py --merged-dir /mnt/f/DataCenter/qlib/cn_data_merged_sample --symbols SH000300,SH600000,SH600905 --clean --progress-every 1"` | Complete | Sample merged successfully; overlap/tail checks and empty filtered CSI files verified. |
| Full merge completion | `wsl.exe -d Ubuntu bash -lc "python3 /mnt/f/DataCenter/qlib/merge_datasets.py --merged-dir /mnt/f/DataCenter/qlib/cn_data_merged --clean --progress-every 250"` | Complete | Full merge finished with 5409 symbols and fields `adjclose, amount, change, close, factor, high, low, open, volume`. |
| Qlib provider verification | `wsl.exe -d Ubuntu bash -lc "~/miniconda3/envs/rdagent/bin/python - <<'PY' ... PY"` | Complete | `pyqlib 0.9.7` loaded the merged provider and returned 4360 rows for `SH600000` between `2008-01-01` and `2026-03-01`. |

## Outcome / Handoff

- Deliverables completed:
- `F:/DataCenter/qlib/merge_datasets.py`
- `D:/Quant/artifacts/qlib_merge_tests/test_merge_datasets.py`
- `D:/Quant/docs/reports/data_merge_report.md`
- `/mnt/f/DataCenter/qlib/cn_data_merged/`
- Residual caveats:
- `sh000905` is the only symbol carrying `adjclose` and the only symbol missing `factor`.
- The merge intentionally preserved that one-off field anomaly instead of normalizing it away.
