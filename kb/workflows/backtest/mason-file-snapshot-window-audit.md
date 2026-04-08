---
id: wf-mason-file-snapshot-window-audit
type: playbook
title: Mason File Snapshot Window Audit
aliases:
  - mason replay audit
  - file snapshot backtest audit
markets:
  - equities
stage: backtest
algo_family: foundations
status: active
confidence: high
updated_at: 2026-03-20
source_refs:
  - type: internal
    title: Mason A-share reversal multifactor repair
    url: local
related_ids:
  - wf-backtest-audit
agent_actions:
  - summarize
  - checklist
---
# Mason File Snapshot Window Audit

## Purpose
Audit whether a Mason replay run that uses frozen `hist.csv` and `index_hist.csv` actually executes the requested date window and produces trustworthy run-local evidence.

## Inputs
- strategy entrypoint
- `hist_file`
- `index_hist_file`
- requested `start_date`
- requested `end_date`
- run-local `manifest.json`
- run-local `backtest_trace.json`

## Steps
1. Confirm the strategy is launched with the approved interpreter for the workspace, not the shell default.
2. Verify that file-based history inputs are clipped to `start_date` and `end_date` before they are passed into the trader runtime.
3. Capture stdout and stderr under a dedicated `runs/<timestamp>_<task>/` directory instead of relying on a single shell call.
4. Validate the replay window twice:
   - `manifest.json` sample bounds
   - account snapshot first and last trading dates
5. Prefer run-local evidence under `research_outputs/<strategy>/<run_id>/` over root-level shared output folders.
6. Require `backtest_trace.json` and `snapshots/` before declaring the replay closed-loop.

## Outputs
- replay validation memo
- accepted run id
- regression tests for any window-contract bugs
- run-local evidence package

## Watchouts
- default interpreter mismatch on Windows
- file snapshots that silently ignore requested date bounds
- synthetic smoke runs overwriting shared root-level Excel and HTML outputs
- timed-out shell commands whose child process actually kept running
