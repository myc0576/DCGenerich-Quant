# RDAgent + Qlib 全A股日频研究 Execution Plan

## Goal

Restore a reproducible `RDAgent + DeepSeek V3.2 + Qlib` All-A-share daily research lane that uses adjusted OHLCV inputs, a single declared provider contract, and a stable factor-loop launch path before handing off to model and quant stages.

## Context

- The original `2026-04-03` note was a progress report, not an execution plan, so this file now acts as the living handoff artifact for the All-A-share lane.
- `F:/Quant/artifacts/scripts/csv_to_qlib.py` exists and can convert BaiduNetdisk daily CSV files into a fresh Qlib binary sidecar at `E:/QLIBdata/qlib_fresh/cn_data`.
- The fresh sidecar currently contains `5397` instruments and trading dates from `2020-01-02` through `2026-03-24`.
- The canonical in-workspace provider at `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data` also ends at `2026-03-24`, but contains `5503` instruments, so the fresh sidecar is not yet a drop-in replacement.
- The converter currently writes `factor = 1.0` for every row, which makes the fresh sidecar unsuitable for factor mining on ex-dividend / ex-rights dates.
- Historical RDAgent artifacts under `F:/Quant/artifacts/QLIBartifacts/rdagent` prove that a CSI1000 lane ran successfully in March 2026, but that evidence does not transfer directly to the target All-A-share / `topk=8` contract.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/tasks/20260322_220346_mason_reversal_finfactor20/preflight.json` recorded `readiness_status = DEGRADED` because Windows-side provider probes failed while the WSL runtime was still usable.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260327-1100_fin_factor/exit.json` shows a clean historical factor-stage receipt with `exit_code = 0`.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/20260320_160318_58829f18/manifest.json` shows an earlier A-share prototype was not execution-ready because `rows_factors = 0` and `rows_signals = 0`.
- Historical replay evidence still points at `/mnt/e/QLIBdata/.qlib/qlib_data/cn_data`, while the workspace now has a canonical provider under `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data`.

## Constraints

- Do not start a new All-A-share factor loop on unadjusted daily data or on a provider that still synthesizes `factor = 1.0`.
- Keep this lane limited to daily OHLCV-derived factors for now.
- The runtime contract must explicitly align provider path, universe (`market = all`), concentration (`topk = 8`), account size, and realistic transaction-cost assumptions before claiming readiness.
- Use canonical `F:/Quant/...` paths for workspace-owned assets; if a WSL-only runtime path must be referenced, label it as external runtime context rather than canonical workspace state.
- Preserve existing CSI1000 research artifacts as historical evidence; do not rewrite or delete them as part of this lane.
- Prefer a direct loop-instantiation launcher over debugging `fire` internals if that is the fastest path to stable execution.
- Long-running jobs must produce durable logs and receipts (`stdout.log`, `stderr.log`, `exit.json`) and survive terminal disconnects.

## Non-goals

- Revalidating every March 2026 CSI1000 research package under the new All-A-share contract.
- Root-causing the `fire` integration path if a standalone launcher is stable enough for the research workflow.
- Extending this lane to minute data, VNpy live deployment, or real-entry execution.
- Moving canonical `F:/Quant/worktrees` into `.worktrees`; current repo documentation still treats `F:/Quant/worktrees` as canonical.
- Treating the March 20, 2026 A-share prototype bundle as proof of current All-A-share readiness.
- Performing workspace-wide hygiene refactors such as `artifacts/` ignore policy cleanup before the research blocker is cleared.

## File Map

- `F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md`: living execution plan for the All-A-share lane.
- `F:/Quant/artifacts/scripts/csv_to_qlib.py`: raw CSV to Qlib sidecar converter; currently writes synthetic `factor = 1.0`.
- `F:/Quant/artifacts/scripts/fetch_tushare_adj.py`: (planned) Tushare API fetcher for adjustment factors.
- `E:/QLIBdata/qlib_fresh/cn_data`: staging sidecar generated from raw daily CSV data; not yet canonical.
- `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data`: canonical in-workspace Qlib provider snapshot currently available to the repo.
- `F:/Quant/data/QLIBdata/registry/provider_roots.yaml`: provider registry still carrying legacy `E:/QLIBdata/provider/...` assumptions.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/tasks/20260322_220346_mason_reversal_finfactor20/preflight.json`: degraded preflight evidence for provider/runtime drift.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260327-1100_fin_factor/`: clean historical factor-stage receipt.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260328-114830_fin_model_receipt/`: receipt-grade historical model rerun.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260328-114854_fin_quant_receipt/`: receipt-grade historical quant rerun.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/20260320_160318_58829f18/`: earlier A-share prototype bundle with zero packaged factor/signal rows.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/csi1000_oversold_reversal/20260327-1219-formal-review/`: authoritative historical CSI1000 review bundle.
- `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/rdagent-backtest-validation/20260327-default_alpha20-replay/`: replay-validation evidence for the CSI1000 control winner.
- `F:/Quant/.gitignore`: current ignore rules; already ignores `.worktrees/`, `data/raw/`, and `data/cache/`, but not `artifacts/`.
- `F:/Quant/scripts/init_env.py`: planned bootstrap helper; currently missing.
- `F:/Quant/worktrees/`: canonical managed worktree root in repo documentation.
- `F:/Quant/.worktrees/`: separate hidden worktree storage already in use for other work.
- `/home/hp/projects/RD-Agent/.env`: current external WSL runtime secret/config context referenced by historical artifacts.
- `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`: current external WSL runtime contract file referenced by the original report.
- `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py`: historical factor-loop entrypoint in the WSL runtime.
- `/home/hp/projects/RD-Agent/run_factor_custom.py`: planned standalone WSL launcher to bypass `fire`.

## Risks

- P0 data-contract risk: the fresh sidecar is built from unadjusted daily data and currently writes synthetic `factor = 1.0`, which invalidates momentum, volatility, and drawdown-style factor calculations around corporate actions.
- Provider-path drift risk: historical artifacts reference `/mnt/e/QLIBdata/.qlib/qlib_data/cn_data`, the registry references `E:/QLIBdata/provider/...`, and the workspace holds `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data`.
- Scope-transfer risk: the strongest existing replay evidence is still CSI1000 / `topk = 50` / `account = 10000000`, not the target All-A-share / `topk = 8` contract.
- Receipt-quality risk: March 27 inline model/quant wrappers leaked the heredoc terminator and produced noisy receipts before March 28 receipt-grade reruns corrected that gap.
- Liquidity-and-cost risk: a concentrated daily `topk = 8` strategy can look materially better than reality if trading cost, stamp duty, slippage, and illiquid micro-cap exposure are not constrained.
- Hygiene drift risk: `.gitignore` and worktree notes in the old report were partially stale relative to the current repo state.

## Task Breakdown

- [x] Task 1: Audit the current evidence baseline and contract drift
  Files:
  `F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/tasks/20260322_220346_mason_reversal_finfactor20/preflight.json`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/csi1000_oversold_reversal/20260327-1219-formal-review/winner_manifest.json`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/rdagent-backtest-validation/20260327-default_alpha20-replay/validation_summary.json`
  Change:
  Consolidate the current runtime/provider evidence into this plan so the All-A-share lane does not inherit unsupported claims from the older CSI1000 path.
  Verify:
  `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/tasks/20260322_220346_mason_reversal_finfactor20/preflight.json'`
  `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/csi1000_oversold_reversal/20260327-1219-formal-review/winner_manifest.json'`
  `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/rdagent-backtest-validation/20260327-default_alpha20-replay/validation_summary.json'`
  Expected:
  The plan clearly distinguishes validated historical CSI1000 evidence from the still-blocked All-A-share lane.

- [x] Task 2: Build a fresh All-A-share staging sidecar from raw daily CSV
  Files:
  `F:/Quant/artifacts/scripts/csv_to_qlib.py`
  `E:/QLIBdata/qlib_fresh/cn_data`
  Change:
  Create a fresh Qlib-format daily sidecar from BaiduNetdisk CSV data and filter non-stock securities so the raw source is at least usable as a staging baseline.
  Verify:
  `Select-String -Path 'F:/Quant/artifacts/scripts/csv_to_qlib.py' -Pattern 'symbol_to_qlib|DST_ROOT|factor = 1.0'`
  `Get-Content 'E:/QLIBdata/qlib_fresh/cn_data/calendars/day.txt' -Tail 5`
  `(Get-Content 'E:/QLIBdata/qlib_fresh/cn_data/instruments/all.txt').Count`
  Expected:
  A staging sidecar exists with A-share-only symbols and date coverage through `2026-03-24`, even though it is not yet research-safe.

- [ ] Task 3: Repair adjusted price and factor support using Tushare before any new factor mining
  Files:
  `F:/Quant/artifacts/scripts/csv_to_qlib.py`
  `F:/Quant/artifacts/scripts/fetch_tushare_adj.py`
  `E:/QLIBdata/qlib_fresh/cn_data`
  `F:/Quant/repos/QLIB/scripts/check_data_health.py`
  Change:
  Fetch daily adjustment factors (`adj_factor`) from Tushare API (using the provided API key), merge them with the raw Baidu OHLCV CSVs, compute the final Qlib `factor`, regenerate the staging sidecar, and explicitly treat this as the gate that must close before Phase 2 resumes.
  Verify:
  `Select-String -Path 'F:/Quant/artifacts/scripts/fetch_tushare_adj.py' -Pattern 'tushare'`
  `python F:/Quant/repos/QLIB/scripts/check_data_health.py --qlib_dir E:/QLIBdata/qlib_fresh/cn_data check_data`
  Expected:
  The staging sidecar integrates real Tushare adjustment factors, and the health check does not surface the obvious corporate-action distortion that blocks factor mining.

- [ ] Task 4: Align the provider root and All-A-share runtime contract
  Files:
  `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data`
  `F:/Quant/data/QLIBdata/registry/provider_roots.yaml`
  `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
  Change:
  Decide which provider root is authoritative for the All-A-share lane, promote the validated adjusted sidecar into that contract, and align the runtime settings for `market = all`, `topk = 8`, account size, and cost assumptions.
  Verify:
  `Get-Content -Raw 'F:/Quant/data/QLIBdata/registry/provider_roots.yaml'`
  `Test-Path 'F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data'`
  `wsl -d Ubuntu -e bash -lc "ls -ld /mnt/f/Quant/data/QLIBdata/.qlib/qlib_data/cn_data /mnt/e/QLIBdata/.qlib/qlib_data/cn_data"`
  Expected:
  There is one declared provider contract for this lane, and the runtime configuration no longer points at stale or contradictory roots.

- [ ] Task 5: Add a direct Factor Loop launcher with durable background receipts
  Files:
  `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py`
  `/home/hp/projects/RD-Agent/run_factor_custom.py`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/`
  Change:
  Implement a standalone launcher that directly instantiates `FactorRDLoop`, initializes base features, and runs under `tmux` / `nohup` with durable `stdout.log`, `stderr.log`, and `exit.json` receipts.
  Verify:
  `wsl -d Ubuntu -e bash -lc "cd /home/hp/projects/RD-Agent && source /opt/miniconda3/etc/profile.d/conda.sh && conda activate rdagent && python run_factor_custom.py --loop_n 1 --step_n 1"`
  `wsl -d Ubuntu -e bash -lc "cd /home/hp/projects/RD-Agent && nohup python run_factor_custom.py > factor_loop.log 2>&1 & echo $!"`
  Expected:
  The All-A-share factor loop has a stable launch path that does not depend on `fire` and survives terminal disconnects.

- [x] Task 6: Configure trading-cost and liquidity guardrails for the `topk = 8` contract
  Files:
  `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
  `F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md`
  Change:
  Explicitly encode commission, stamp duty, slippage, ST filtering, and liquidity gates so the research lane does not overfit illiquid micro-cap exposures.
  Verify:
  `wsl -d Ubuntu -e bash -lc "grep -nE 'market|topk|account|cost|slippage|liquid|ST' /home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py"`
  `Get-Content -Raw 'F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md'`
  Expected:
  The runtime contract and this plan say the same thing about concentration, liquidity, and trading-cost realism.

- [ ] Task 7: Execute the All-A-share factor loop and package non-zero evidence
  Files:
  `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/`
  Change:
  Run the repaired All-A-share factor lane, capture receipts and manifests, and require non-zero packaged factor and signal evidence before claiming Phase 2 is complete.
  Verify:
  `Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/runs' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 3 FullName`
  `Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 3 FullName`
  `Get-Content -Raw ((Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName + '/manifest.json')`
  Expected:
  A new All-A-share bundle exists with `rows_factors > 0`, `rows_signals > 0`, and a clean factor-stage receipt.

- [ ] Task 8: Gate handoff into Model Loop and Quant Loop
  Files:
  `F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/`
  `F:/Quant/artifacts/QLIBartifacts/rdagent/runs/`
  `F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md`
  Change:
  Record the go / no-go conditions for model and quant stages so the next operator can tell whether the All-A-share lane is truly ready, rather than borrowing CSI1000 receipts.
  Verify:
  `Get-Content -Raw ((Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Recurse -Filter 'winner_manifest.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName)`
  `Get-Content -Raw ((Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Recurse -Filter 'validation_summary.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName)`
  Expected:
  The All-A-share lane has an explicit readiness verdict, and this plan records whether the handoff is blocked, partial, or ready.

## Progress

- 2026-03-22: Historical preflight recorded `DEGRADED` readiness because Windows-side provider probes failed while the WSL runtime remained usable.
- 2026-03-27: Historical `fin_factor` run completed with `exit_code = 0`; the authoritative CSI1000 review still kept `default_alpha20` as the control winner and left the reversal branch incomplete.
- 2026-03-28: Receipt-grade model and quant reruns both finished with `exit_code = 0`, improving wrapper quality relative to the noisier March 27 inline wrappers.
- 2026-04-03: Fresh All-A-share daily sidecar regenerated by `F:/Quant/artifacts/scripts/csv_to_qlib.py`; observed `5397` instruments and coverage through `2026-03-24`, but adjustment factors remain synthetic.
- 2026-04-03: Rewrote this file from a narrative progress report into the repository-required execution-plan template using multi-agent evidence collection.
- 2026-04-03: Started Task 3 implementation on `F:/Quant/artifacts/scripts/csv_to_qlib.py`; added regression tests that prove the converter must derive real `factor` values from a separate adjusted-data CSV and no longer accept the synthetic `factor = 1.0` path.
- 2026-04-03: Refactored `csv_to_qlib.py` to require an explicit `CSV_TO_QLIB_ADJ_ROOT`, merge raw daily snapshots with a separate adjusted daily source, compute `factor`, adjust OHLCV into Qlib semantics, and fail fast when adjustment coverage is missing.
- 2026-04-03: Decided to use Tushare API (apikey: `56b696effe507f20e605bbb9a7872ee2f37151441621839a64baa96e`) for fetching missing adjustment factors instead of waiting for a Baidu CSV export. The plan and Task 3 are updated to reflect this new data source.
- 2026-04-04: Hardened `F:/Quant/artifacts/scripts/fetch_tushare_adj.py` for long-range backfills with resumable `--skip-existing` behavior, configurable `--max-retries` / `--sleep-seconds`, and a CSV failure manifest so interrupted Tushare pulls can resume without re-fetching completed dates.
- 2026-04-04: Started the first resumable full-range Tushare backfill under Windows using the hardened fetcher, with the active run logging to `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-104024/` and failure capture reserved at `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-104024/failures.csv`.
- 2026-04-04: Confirmed the first full-range Tushare backfill failed because multi-day `adj_factor(start_date, end_date)` calls were truncated by the API row limit; fixed `fetch_tushare_adj.py` to query one trade date at a time while preserving `--skip-existing`, retries, sleep, and failure-manifest behavior.
- 2026-04-04: Re-ran `python -m unittest F:/Quant/artifacts/scripts/tests/test_fetch_tushare_adj.py` after the per-day fetch fix; `8` tests passed locally.
- 2026-04-04: Re-launched the full-range Windows-side Tushare backfill with the repaired fetcher under `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-153213/`.
- 2026-04-04: Ran a live two-day smoke pull (`2020-01-02` and `2020-01-03`) against the repaired fetcher; both adjusted CSV files were written successfully under `%TEMP%/tushare-live-smoke-20260404/adj`.
- 2026-04-04: Fixed `F:/Quant/artifacts/scripts/csv_to_qlib.py` to prepend the Qlib-required float32 start-index header (`0.0` for the current full-calendar write strategy) to every `*.day.bin` and updated the local converter regression test plus size/header verification summary.
- 2026-04-04: Re-ran `python -m unittest F:/Quant/artifacts/scripts/tests/test_csv_to_qlib.py` after the bin-header fix; `4` tests passed locally.
- 2026-04-04: WSL launcher access partially recovered after a targeted `wsl --terminate Ubuntu`; `wsl -d Ubuntu -e bash -lc ...` now executes commands again, and the actual RD-Agent runtime tree is confirmed at `/home/hp/projects/RD-Agent`.
- 2026-04-04: Closed Task 6 at the contract/documentation level: `conf.py` now consistently encodes the All-A-share provider, `topk = 8`, `account = 100000`, and explicit open/close/min costs across factor/model/quant settings, while richer ST/liquidity/slippage controls remain a documented runtime-integration gap.
- 2026-04-04: The repaired full-range backfill progressed through `24` dates before failing on `2020-02-13`; the API returned successfully but `write_adjustment_csv` still saw missing rows, so the fetcher was further hardened to retry incomplete daily frames in addition to transport-level failures.
- 2026-04-04: Re-ran `python -m unittest F:/Quant/artifacts/scripts/tests/test_fetch_tushare_adj.py` after the incomplete-frame retry fix; `9` tests passed locally.
- 2026-04-04: Verified the problematic `2020-02-13` date succeeds in isolation with the current fetcher, then resumed the full-range Windows-side backfill under `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/` with `24` adjusted CSVs already present for skip-based continuation.

## Surprises

- The fresh staging sidecar has fewer instruments (`5397`) than the current canonical provider snapshot (`5503`), even though both end on `2026-03-24`.
- `F:/Quant/data/QLIBdata/registry/provider_roots.yaml` still points to legacy `E:/QLIBdata/provider/...` roots while historical replay evidence points to `/mnt/e/QLIBdata/.qlib/qlib_data/cn_data`.
- The repo already treats `F:/Quant/worktrees/` as canonical, so the old recommendation to move everything into `.worktrees/` is not aligned with current workspace conventions.
- March 27 inline wrapper receipts were structurally noisy because the heredoc terminator leaked into execution and raised `NameError: name 'PY' is not defined`; only later reruns produced clean receipt-grade evidence.
- The currently extracted BaiduNetdisk day snapshots under `F:/BaiduNetdiskDownload/A股/A股解压器/output/1d` expose raw OHLCV only; no local `AdjFactor`, `adjclose`, `qfq`, or `hfq` columns were found in the inspected daily CSVs. Task 3 will now use Tushare API to fetch these missing factors.
- A plain `python` environment under `F:/Quant` cannot import the local `qlib` repo because compiled extensions are unavailable there, so receipt-grade semantic verification still needs the dedicated Qlib runtime rather than the default shell interpreter.
- Subagent edits against workspace and UNC-backed WSL files were not fully isolated: timeout-heavy writes briefly left `provider_roots.yaml`, `test_fetch_tushare_adj.py`, and `/home/hp/projects/RD-Agent/run_factor_custom.py` empty before they were manually restored.
- `wsl.exe` verification became intermittently unavailable on April 4, 2026 with `Wsl/Service/E_UNEXPECTED`, so runtime checks had to fall back to UNC-path file access and Windows-side syntax verification.
- April 4, 2026 WSL instability is asymmetric: `wsl -l -v` can still enumerate `Ubuntu`, but direct `wsl -d Ubuntu -e ...` execution may immediately fail with `Wsl/Service/E_UNEXPECTED`, so “distro visible” is not a sufficient readiness signal.
- The first live Tushare smoke run failed on April 4, 2026 because raw `type = 11` rows still included non-target `900***` symbols; matching `csv_to_qlib.py` required an extra A-share prefix filter in `fetch_tushare_adj.py`.
- The first full-range Tushare backfill failure was not a data-source absence issue after all; it was an API pagination/truncation issue triggered by multi-day `adj_factor` range calls.
- After the pagination fix, the next full-range failure mode turned out to be subtler: a daily `adj_factor` call can succeed yet still yield an incomplete frame for `write_adjustment_csv`, so data-completeness retries are required in addition to network retries.
- The RD-Agent runtime path confusion on April 4, 2026 was session-specific rather than a true missing-path issue: UNC access and later WSL probes confirmed `/home/hp/projects/RD-Agent` is the live tree.
- `run_factor_custom.py --help` is not a cheap verification probe for this stack because top-level imports run before argument handling; launcher verification must use the intended Conda environment and should not assume argparse help is instantaneous.

## Decision Log

- 2026-04-03: Convert the old progress report into an execution plan so future work is tracked against files, verifications, and go / no-go gates.
- 2026-04-03: Treat synthetic adjustment factors as a P0 blocker; do not resume All-A-share factor mining until Task 3 is complete.
- 2026-04-03: Keep the March 2026 CSI1000 artifacts as historical reference only; they cannot be cited as direct readiness proof for the All-A-share / `topk = 8` lane.
- 2026-04-03: Base the planned `run_factor_custom.py` on the historically proven direct loop-instantiation pattern rather than spending this phase on `fire` debugging.
- 2026-04-03: Defer `.gitignore` expansion and `F:/Quant/scripts/init_env.py` bootstrap work until the research-lane blocker is cleared.
- 2026-04-03: Remove the silent `factor = 1.0` fallback from `csv_to_qlib.py`; the converter must now require a distinct adjusted-data root and stop on missing adjustment coverage rather than generating research-unsafe bins.
- 2026-04-03: Use Tushare API (`pro_api`) to fetch adjustment factors (`adj_factor`) to merge with the raw OHLCV data, resolving the missing adjustment data blocker.
- 2026-04-04: Treat `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data` and its WSL mirror `/mnt/f/Quant/data/QLIBdata/.qlib/qlib_data/cn_data` as the single declared provider contract for this lane; keep `E:/QLIBdata/qlib_fresh/cn_data` as staging only until Task 3 closes.
- 2026-04-04: Do not invent unsupported ST or liquidity config knobs in `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`; keep the existing cost settings explicit and track richer guardrails as a runtime-integration gap until the stack exposes them.
- 2026-04-04: Mirror `csv_to_qlib.py` symbol filtering inside `fetch_tushare_adj.py`; raw `type = 11` alone is too broad because it still captures non-target `900***` symbols that should not block the All-A-share data gate.
- 2026-04-04: Added `F:/Quant/artifacts/scripts/fetch_tushare_adj.py` and `F:/Quant/artifacts/scripts/tests/test_fetch_tushare_adj.py`; the new regression tests now cover token resolution, mirrored per-day CSV output, and fail-fast behavior for missing adjustment rows.
- 2026-04-04: Keep the Tushare fetcher resumable by default for the multi-year backfill: skip non-empty per-day outputs that already exist, throttle chunk requests with a configurable sleep, retry transient chunk failures, and emit a failure CSV before raising so the next run can continue from partial progress.
- 2026-04-04: Launch the multi-year backfill with `python -u` rather than buffered stdout redirection so the operator can tail `stdout.log` in real time while the long-running Windows-side fetch is in progress.
- 2026-04-04: Treat multi-day `adj_factor` range calls as unsafe for this lane because the API can silently truncate rows; the fetcher now uses one trade-date query per day to guarantee full market coverage.
- 2026-04-04: Treat incomplete daily `adj_factor` frames as retriable data-plane failures, not as terminal write-time errors; the fetcher now retries the whole fetch+write cycle when row coverage is incomplete for a day.
- 2026-04-04: Restored `F:/Quant/data/QLIBdata/registry/provider_roots.yaml` after a failed subagent write left it empty, and aligned both that registry entry and `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py` to the canonical workspace provider contract (`F:/Quant/...` / `/mnt/f/...`).
- 2026-04-04: Created `/home/hp/projects/RD-Agent/run_factor_custom.py` as a fire-free Factor Loop launcher that creates receipt directories, tees `stdout.log` / `stderr.log`, and writes `exit.json`; syntax verification passed, but live WSL execution is still blocked by intermittent `Wsl/Service/E_UNEXPECTED` failures.
- 2026-04-04: A live smoke run against the `2020-01-02` raw daily CSV succeeded with the provided Tushare token after filtering non-A-share `900***` symbols; `fetch_tushare_adj.py` wrote a compatible per-day adjustment CSV and proved the fetch path works on real data.
- 2026-04-04: Match upstream Qlib day-bin contract in `csv_to_qlib.py` by prepending a float32 start-index header (`0.0` under the current full-calendar strategy) and validating the resulting file size as `(calendar_days + 1) * 4`.
- 2026-04-04: Treat Task 6 as complete once the plan and runtime agree on the currently supported guardrails: explicit costs and concentration are encoded; unsupported ST/liquidity/slippage controls stay documented as a gap instead of being invented ad hoc.

## Verification Matrix

| Area | Verify | Status | Notes |
| --- | --- | --- | --- |
| Historical degraded preflight | `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/tasks/20260322_220346_mason_reversal_finfactor20/preflight.json'` | Verified | Confirms provider/runtime drift was already present before this All-A-share plan refresh |
| Fresh staging sidecar coverage | `Get-Content 'E:/QLIBdata/qlib_fresh/cn_data/calendars/day.txt' -Tail 5`; `(Get-Content 'E:/QLIBdata/qlib_fresh/cn_data/instruments/all.txt').Count` | Verified | Observed last date `2026-03-24` and `5397` instruments |
| Canonical provider snapshot | `Get-Content 'F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data/calendars/day.txt' -Tail 5`; `(Get-Content 'F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data/instruments/all.txt').Count` | Verified | Observed last date `2026-03-24` and `5503` instruments |
| Adjustment-factor gate | `Select-String -Path 'F:/Quant/artifacts/scripts/csv_to_qlib.py' -Pattern 'factor = 1.0'`; `python -m unittest F:/Quant/artifacts/scripts/tests/test_csv_to_qlib.py`; `python F:/Quant/artifacts/scripts/tests/test_fetch_tushare_adj.py -v`; `python -m py_compile F:/Quant/artifacts/scripts/fetch_tushare_adj.py`; `python F:/Quant/artifacts/scripts/fetch_tushare_adj.py --raw-root %TEMP%/tushare-live-smoke-20260404/raw --dst-root %TEMP%/tushare-live-smoke-20260404/adj --chunk-days 2 --sleep-seconds 0`; `python F:/Quant/artifacts/scripts/fetch_tushare_adj.py --raw-root %TEMP%/tushare-live-smoke-20200213/raw --dst-root %TEMP%/tushare-live-smoke-20200213/adj --chunk-days 1 --sleep-seconds 0`; `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*20260404-155634*' }`; `python F:/Quant/repos/QLIB/scripts/check_data_health.py --qlib_dir E:/QLIBdata/qlib_fresh/cn_data check_data` | In progress | The fetch script now avoids Tushare range truncation by querying one trade date at a time and retries incomplete daily frames in addition to transport failures. It passed `9` local tests on April 4, 2026, completed live smoke pulls for `2020-01-02`, `2020-01-03`, and isolated `2020-02-13`, and the resumed full-range background fetch is now `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/` with `24` adjusted CSVs already in place. Sidecar rebuild and Qlib health check are still pending. |
| Provider-root alignment | `Get-Content -Raw 'F:/Quant/data/QLIBdata/registry/provider_roots.yaml'`; `Get-Content '\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\conf.py' | Select-String -Pattern 'provider_uri'` | Partially verified | The registry and RD-Agent runtime config now point at the canonical `F:/Quant/...` / `/mnt/f/...` provider for this lane, but live WSL execution verification is still blocked by intermittent `Wsl/Service/E_UNEXPECTED` failures. |
| Historical factor-stage receipt | `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260327-1100_fin_factor/exit.json'`; `Get-Content 'F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260327-1100_fin_factor/stdout.log' -Tail 20` | Verified | Clean factor-stage receipt exists, but only for the older CSI1000 lane |
| Direct factor launcher | `python -m py_compile "\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\run_factor_custom.py"`; `wsl -d Ubuntu -u hp -e bash -lc "source /home/hp/miniconda3/etc/profile.d/conda.sh && conda activate rdagent && python -c 'import psutil; print(psutil.__version__)'"` | Partially verified | WSL command execution recovered enough to reach the intended distro and Conda env, and `psutil` imports successfully under `rdagent`. `run_factor_custom.py --help` is still not a reliable quick probe because its top-level imports execute before argparse help handling, so live launcher verification still depends on the data gate and a real loop invocation. |
| Historical A-share prototype readiness | `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs/20260320_160318_58829f18/manifest.json'` | Failed historical reference | Confirms earlier A-share prototype had `rows_factors = 0` and `rows_signals = 0` |
| Historical model / quant receipt quality | `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260328-114830_fin_model_receipt/exit.json'`; `Get-Content -Raw 'F:/Quant/artifacts/QLIBartifacts/rdagent/runs/20260328-114854_fin_quant_receipt/exit.json'` | Partially verified | Receipt quality improved on March 28, but still does not prove the All-A-share contract |
| All-A-share runtime contract alignment | `Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Recurse -Filter 'resolved_qrun_config*.yaml' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName`; `Get-Content '\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\conf.py' | Select-String -Pattern 'market|topk|account|open_cost|close_cost|min_cost'`; `Get-Content '\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\factor_template\conf_baseline.yaml' | Select-String -Pattern 'limit_threshold|deal_price'`; `Get-Content '\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\model_template\conf_baseline_factors_model.yaml' | Select-String -Pattern 'limit_threshold|deal_price'` | Verified for supported controls | `conf.py` now keeps the canonical provider plus explicit `market = all`, `topk = 8`, `account = 100000`, `open_cost = 0.0005`, `close_cost = 0.0015`, and `min_cost = 5`. The template layer also keeps `limit_threshold = 0.095` and `deal_price = close`. No exposed ST/liquidity/slippage hooks were found beyond those documented guardrails. |
| All-A-share replay reproducibility | `Get-ChildItem 'F:/Quant/artifacts/QLIBartifacts/rdagent/research_outputs' -Recurse -Filter 'validation_summary.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName` | Pending | No replay-validated All-A-share package exists yet |

## Outcome / Handoff

- This file is now the canonical execution plan for the `2026-04-03` All-A-share RDAgent + Qlib lane.
- Current blocker order is strict:
  1. complete Task 3 to repair adjusted data / factors
  2. complete Task 4 to align the provider root and runtime contract
  3. complete Task 5 to establish a stable launcher
  4. only then run Task 7 and Task 8
- Task 3 is now split into two gates:
  1. data gate: Fetch adjustment factors from Tushare API to cover the dates in the Baidu raw CSVs
  2. code gate: `csv_to_qlib.py` (or a wrapper) must merge the Tushare factors with raw OHLCV so the staging sidecar can be rebuilt and checked under the Qlib runtime
- Task 3 code gate is now materially in place as of April 4, 2026: the fetch script and its regression tests exist, the fetcher now avoids Tushare range truncation by querying one trade date at a time, and `csv_to_qlib.py` now matches the Qlib day-bin header contract for the current full-calendar strategy. The live data gate still needs a successful full-range Tushare pull plus sidecar rebuild.
- The current live Task 3 data-gate run is `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/`; tail `stdout.log` / `stderr.log` there and inspect `failures.csv` if the process exits non-zero or partial dates remain missing.
- Task 5 now has a concrete launcher file, WSL command execution has partially recovered, and the intended `rdagent` Conda environment is usable again; remaining launcher verification now depends more on the data gate and a real loop invocation than on the earlier `E_UNEXPECTED` hard failure.
- Task 6 is complete for the currently supported runtime surface: explicit costs and concentration are encoded in `conf.py` and matching template-level tradability controls are documented; unsupported ST/liquidity/slippage controls remain an acknowledged gap rather than hidden assumptions.
- Recommended next Task 3 execution path: let the multi-year Tushare backfill finish, verify raw/adjusted date parity, rebuild `E:/QLIBdata/qlib_fresh/cn_data` from scratch with the repaired converter, then rerun `check_data_health.py`.
- Do not promote the historical CSI1000 control-winner receipts as proof that the All-A-share lane is ready.
- Keep this plan live during implementation by updating `Progress`, `Surprises`, `Decision Log`, `Verification Matrix`, and `Outcome / Handoff` after each material change.
