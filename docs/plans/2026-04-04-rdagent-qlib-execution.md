# RDAgent + Qlib Execution Plan

## Goal

Unblock the RDAgent all-A-share workflow, align the current code/config state with the reported plan, and land the highest-value immediate fixes needed to run Phase 1.5 and start Phase 2 safely.

## Context

- Source plan/report provided by the user: `C:\Users\HP\Desktop\RDAgent_Qlib_Progress_2026-04-03.md`
- Relevant workspace repo: `F:\Quant`
- Relevant runtime repo: `/home/hp/projects/RD-Agent` inside WSL Ubuntu
- Current observed state differs from the report in several places:
  - `F:\Quant\artifacts\scripts\csv_to_qlib.py` already supports adjusted-factor input.
  - `F:\Quant\.gitignore` ignores `.worktrees/` but does not ignore `worktrees/`, `repos/`, or `artifacts/`.
  - `F:\Quant\worktrees\QLIB\...` still exists and is not ignored.
  - `/home/hp/projects/RD-Agent/.env` still points embedding to `openai/BAAI/bge-m3` via local port `18000`.
  - `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py` still hardcodes factor/model windows and provider URIs.
- Two runtime blockers are confirmed:
  - Embedding path/config is still inconsistent with the report's recommended state.
  - Factor-loop launch path still needs a reliable smoke-test path in the `rdagent` runtime environment.

## Constraints

- The `F:\Quant` git worktree is dirty and contains untracked files that are directly relevant to this task; do not discard or overwrite them.
- Use multi-subagent execution with disjoint ownership.
- Prefer targeted fixes with verification over broad refactors.
- Keep the execution plan live during implementation.
- Full multi-hour model/factor/quant research completion is not realistic inside one interactive turn; immediate focus is unblock, verify, and launch-ready state.

## Non-goals

- Completing all long-running Phase 2-6 research loops end-to-end in this single session.
- Large-scale `F:\Quant` architecture migration beyond the minimum hygiene fix needed now.
- Rewriting unrelated RD-Agent internals without proof they are part of the current blocker.

## File Map

- `F:\Quant\.gitignore`
- `F:\Quant\worktrees\QLIB\...`
- `F:\Quant\artifacts\scripts\csv_to_qlib.py`
- `F:\Quant\artifacts\scripts\fetch_tushare_adj.py`
- `F:\Quant\docs\plans\RDAgent_Qlib_Progress_2026-04-03.md`
- `/home/hp/projects/RD-Agent/.env`
- `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
- `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py`
- `/home/hp/start_factor_loop.sh`

## Risks

- WSL command execution in this environment is noisy and sometimes requires timeouts to recover output.
- The RD-Agent runtime may depend on the `rdagent` conda environment and unavailable local services.
- `F:\Quant` contains substantial untracked content; careless moves could hide or strand active worktrees.
- The report and current code are already out of sync, so each “planned” step must be verified against reality before edits.

## Task Breakdown

- [ ] Task 1: Normalize plan state and capture actual blockers
  Files:
  `F:\Quant\docs\plans\2026-04-04-rdagent-qlib-execution.md`
  `F:\Quant\docs\plans\RDAgent_Qlib_Progress_2026-04-03.md`
  Change:
  Record the real current state, note divergences from the source report, and convert the work into execution-ready tasks.
  Verify:
  Manual review of the execution plan contents and current repo observations.
  Expected:
  A live execution plan that matches the codebase and environment, not just the report.

- [ ] Task 2: Land minimum `F:\Quant` repo hygiene fixes
  Files:
  `F:\Quant\.gitignore`
  `F:\Quant\worktrees\QLIB\...`
  Change:
  Prevent `worktrees/`, `repos/`, `artifacts/`, and large data paths from polluting git status; handle legacy `worktrees/` safely.
  Verify:
  `git -C F:\Quant status --short --branch`
  `git -C F:\Quant check-ignore -v .worktrees worktrees`
  Expected:
  The root repo stops surfacing large irrelevant directories as active changes for this workflow.

- [ ] Task 3: Repair RD-Agent runtime configuration for Phase 1.5
  Files:
  `/home/hp/projects/RD-Agent/.env`
  `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
  `/home/hp/start_factor_loop.sh`
  Change:
  Align embedding/chat/env settings with the chosen runtime path, reduce hardcoded drift where safe, and make the launch path explicit.
  Verify:
  Targeted config reads plus a minimal runtime smoke test in the `rdagent` environment.
  Expected:
  RD-Agent has a coherent config for chat, embedding, execution mode, and factor time windows.

- [ ] Task 4: Fix or bypass the factor-loop CLI blocker with proof
  Files:
  `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py`
  `/home/hp/start_factor_loop.sh`
  Change:
  Reproduce the factor-loop startup failure, identify whether the issue is `fire`, session loading, or startup wiring, then apply the smallest reliable fix.
  Verify:
  A smoke run that reaches the intended startup path without the previous immediate failure.
  Expected:
  Factor loop can be launched through a stable entrypoint.

- [ ] Task 5: Verify adjusted-factor data path and rebuild readiness
  Files:
  `F:\Quant\artifacts\scripts\csv_to_qlib.py`
  `F:\Quant\artifacts\scripts\fetch_tushare_adj.py`
  Change:
  Confirm adjusted-factor ingestion is already implemented, verify whether the target Qlib dataset needs rebuild/runbook updates, and patch only if evidence shows a gap.
  Verify:
  Script inspection plus targeted data spot checks on output bins/calendars.
  Expected:
  We know whether adjusted factors are already landed in data outputs and what remains to run operationally.

## Progress

- [x] Read the source report/plan from the Desktop path.
- [x] Confirmed `F:\Quant` is a dirty repo and that `.worktrees/` is ignored while `worktrees/` is not.
- [x] Confirmed `csv_to_qlib.py` and `fetch_tushare_adj.py` already exist and include adjusted-factor logic.
- [x] Confirmed `/home/hp/projects/RD-Agent/.env`, `conf.py`, and `factor.py` still diverge from the report's intended end state.
- [x] Landed minimum root ignore fixes so `worktrees/`, `repos/`, and `artifacts/` no longer pollute `git status`.
- [x] Spot-checked `E:\QLIBdata\qlib_fresh\cn_data\features\*\factor.day.bin`; current output still contains `1.0` placeholder factors despite non-1.0 source adjustment CSV rows.
- [ ] Subagent execution started.

## Surprises

- The repo already contains a copied report at `F:\Quant\docs\plans\RDAgent_Qlib_Progress_2026-04-03.md`.
- `F:\Quant\worktrees\QLIB\...` is still present and visible to git even though `.worktrees/` is already in use.
- The default Ubuntu shell can read RD-Agent files, but WSL command exit behavior is noisy and sometimes timeout-driven.
- Importing the factor entrypoint in the default Ubuntu Python fails because `fire` is not installed there; runtime validation must use the `rdagent` environment.
- `csv_to_qlib.py` is ahead of the report, but the target `qlib_fresh` dataset has not yet been rebuilt with real adjustment factors.

## Decision Log

- 2026-04-04: Created a separate execution plan file instead of rewriting the long progress report in place, because the existing report is status-oriented rather than execution-oriented.
- 2026-04-04: Treat Phase 1.5 + Phase 2 unblock as the critical path; later long-running research phases are secondary until startup is reliable.
- 2026-04-04: Use subagents with disjoint ownership instead of one broad agent, because repo hygiene, data-path verification, and RD-Agent runtime fixes are parallelizable.
- 2026-04-04: Chose the non-destructive hygiene fix first for `F:\Quant` by expanding `.gitignore` instead of moving legacy directories mid-session.

## Verification Matrix

| Area | Command / Check | Status |
|---|---|---|
| Source plan read | Desktop report loaded as UTF-8 | Done |
| Quant repo ignore state | `git -C F:\Quant check-ignore -v .worktrees worktrees repos artifacts` | Done |
| Qlib fresh calendar | `E:\QLIBdata\qlib_fresh\cn_data\calendars\day.txt` ends at `2026-03-24` | Done |
| Quant local calendar | `F:\Quant\data\QLIBdata\.qlib\qlib_data\cn_data\calendars\day.txt` ends at `2026-03-24` | Done |
| Qlib factor spot check | Sample `factor.day.bin` values in `qlib_fresh` are still `1.0` | Done |
| RD-Agent config read | `.env`, `conf.py`, `factor.py` read from WSL | Done |
| Runtime smoke test | To run after config and launcher fixes | Pending |

## Outcome / Handoff

Execution in progress. Next step is to dispatch multi-agent work for:
1. `F:\Quant` repo hygiene and plan/report synchronization
2. RD-Agent runtime config and factor-loop startup fix
3. Adjusted-factor data-path verification
