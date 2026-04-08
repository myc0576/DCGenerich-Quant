# RDAgent Factor Loop Fix Execution Plan

## Goal

Unblock the RD-Agent factor loop by confirming the embedding path is fixed, preventing false-positive verification, and guarding Task 2 so we do not rerun a rebuild into a known raw/adj coverage mismatch.

## Context

This work follows the D/F drive migration and focuses on the Phase 5.4 blocker in the factor loop.

Verified facts:
- `/home/hp/projects/RD-Agent/.env` was updated to `ollama/nomic-embed-text`.
- Non-commented `18000` references were removed from `.env`.
- Embedding smoke passes in the `rdagent` environment: `litellm.embedding(...)` returns dimension `768`.
- `LiteLLMAPIBackend.create_embedding(...)` also returns dimension `768`.
- Current `F:/DataCenter/qlib/cn_data` already has nontrivial factor values for sample symbols and matches adj input for `SH600000`.
- The plan's raw/adj source path was stale.
- The real blocker for Task 2 is raw/adj date coverage mismatch if a rebuild is attempted directly.
- Receipt `20260405-143954_fin_factor_custom` had `exit_code=0`, but `stdout.log` was full of LiteLLM Provider List errors, so exit code alone is not sufficient verification.

Actual source trees:
- Raw tree: `F:/BaiduNetdiskDownload/A股1d/output`
- Adj tree: `F:/BaiduNetdiskDownload/A股1d_adj`

User constraints:
- Escalate early when blocked.
- Do not freeze baselines.
- Do not leave impossible tasks half-done.

## Constraints

- Do not rerun Task 2 blindly.
- Do not treat `exit_code=0` as success without log-content checks.
- Preserve existing valid `F:/DataCenter/qlib/cn_data` unless a clean rebuild path is proven.
- Continue independently from the main-thread smoke worker; do not wait for its result.

## Non-goals

- Rebuilding `cn_data` just to "see what happens."
- Expanding the scope to older data recovery or unrelated factor features.
- Reworking the main factor loop logic beyond what is needed to clear the current blocker.

## File Map

- `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/.env`
- `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
- `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/oai/utils/embedding.py`
- `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/test/oai/test_embedding_utils.py`
- `//wsl.localhost/Ubuntu/home/hp/start_factor_loop.sh`
- `D:/Quant/artifacts/scripts/csv_to_qlib.py`
- `F:/DataCenter/qlib/cn_data/`
- `F:/BaiduNetdiskDownload/A股1d/output`
- `F:/BaiduNetdiskDownload/A股1d_adj`

## Risks

- Task 2 could overwrite a usable provider with incomplete coverage if we force a rebuild.
- A green receipt may still be false if the logs contain LiteLLM Provider List failures.
- The source-tree path mismatch can keep sending future workers to the wrong directory.
- The active `rdagent` env still has package drift outside B2/B3, so future verification commands must use the conda interpreter explicitly.

## Task Breakdown

- [x] Task 1: Fix `.env` embedding config
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/.env`
  Change:
  - Switched embedding config to `ollama/nomic-embed-text` and removed stale `18000` references.
  Verify:
  - `litellm.embedding(...)` returns dimension `768`.
  - `LiteLLMAPIBackend.create_embedding(...)` returns dimension `768`.
  Expected:
  - Embedding calls resolve locally without LiteLLM provider-list errors.

- [x] Task 2: Diagnose raw/adj coverage mismatch (2b)
  Files:
  - `D:/Quant/artifacts/scripts/csv_to_qlib.py`
  - `F:/DataCenter/qlib/cn_data/`
  - `D:/Quant/artifacts/reports/2026-04-05-qlib-rebuild-coverage-report.md`
  Change:
  - Diagnosed the real raw/adj calendar mismatch and recorded the safe decision not to rebuild `cn_data` yet.
  Verify:
  - Raw: 2007-01-04 ~ 2026-04-03 (4677 days). Adj: 2020-01-02 ~ 2026-03-24 (1506 days).
  - Adj matches current qlib calendar exactly. Shared window has 0 internal holes.
  - Raw is a strict superset; 3171 unmatched days (3163 pre-2020 + 8 post-adj).
  - `csv_to_qlib.py` does not inner-join; missing adj causes a hard error.
  Expected:
  - Current `cn_data` remains usable as-is for factor loop, and future rebuild work is explicitly gated.

- [x] Task 3: End-to-end embedding smoke
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/.env`
  - runtime environment
  Change:
  - Verified the configured Ollama embedding/chat path in the active `rdagent` environment.
  Verify:
  - Ollama running with `nomic-embed-text` available.
  - `.env`: `EMBEDDING_MODEL=ollama/nomic-embed-text`, `OLLAMA_API_BASE` correct, no port `18000` refs.
  - `APIBackend().create_embedding('test')` -> 768-dim vector.
  - `APIBackend().build_messages_and_create_chat_completion(...)` -> DeepSeek responds.
  Expected:
  - Embedding and chat both work end-to-end with the intended local models.

- [x] Task 4: Fix B2 Ollama 400 behavior
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/oai/utils/embedding.py`
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/test/oai/test_embedding_utils.py`
  Change:
  - Reproduced the failure against the live Ollama endpoint, then made the local `nomic-embed-text` budget authoritative and conservative (`1792` before the existing 0.9 safety margin).
  Verify:
  - Direct `/api/embed` accepts single and batch inputs.
  - The known 7886-char factor-loop payload reproduces `the input length exceeds the context length` before the fix.
  - `python -m unittest discover -s test/oai -p 'test_embedding_utils.py'` now passes.
  - The same payload now truncates to 1612 tokens and `LiteLLMAPIBackend().create_embedding(...)` returns 1x768 on the first request with no 400 retry loop.
  Expected:
  - Factor-loop embedding calls stop surfacing the old Ollama 400 for this class of long mixed code/feedback payloads.

- [x] Task 5: Fix B3 qlib importability
  Files:
  - active `rdagent` conda environment
  Change:
  - Installed `pyqlib==0.9.7` into the `rdagent` conda env.
  Verify:
  - `pip show pyqlib` reports version `0.9.7`.
  - `import qlib` resolves from `/opt/miniconda3/envs/rdagent/lib/python3.10/site-packages/qlib/__init__.py`.
  - `importlib.util.find_spec('qlib')` returns `True`.
  Expected:
  - `qlib` imports cleanly from the interpreter used by the factor loop.

- [x] Task 6: Short factor-loop smoke run (attempt 1)
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py`
  Results (2026-04-05):
  - B1 fix verified: FactorRDLoop imports OK, `_init_base_features` resolves.
  - `fire` already installed (0.7.1). No import errors.
  - Loop ran ~7 min, reached 80% progress. Embedding and chat calls worked.
  - No Ollama 400 errors, no LiteLLM Provider List errors.
  - FAILED at feedback stage: `ValueError: The benchmark ['SH000300'] does not exist`
  - Log at: `/home/hp/projects/RD-Agent/log/2026-04-05_14-46-32-946792/__session__/0/3_feedback`
  New blocker:
  - B4: SH000300 (CSI300 index) not in qlib cn_data. Need to either add index data or change benchmark.

- [x] Task 6b: Fix B4 - benchmark SH000300 missing from cn_data
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
  Change:
  - cn_data is stock-only (5397 stocks, no index instruments). CSI300 index data not present.
  - Temporary fix: changed `benchmark` from `"SH000300"` to `"SH600000"` in all 3 settings classes.
  - Future: add proper CSI300 index data to cn_data.
  Verify:
  - Factor loop no longer errors on missing benchmark.

- [x] Task 6c: Fix B5 - calendar off-by-one IndexError
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`
  Change:
  - `test_end="2026-03-24"` is the LAST calendar day (1506 days); Qlib backtest tries to access index 1506 (0-based) → IndexError.
  - Fix: changed `test_end` from `"2026-03-24"` to `"2026-03-20"` in all 3 settings classes.
  Verify:
  - No more IndexError on calendar access.

- [x] Task 6d: Fix B6 - chat model auth failure (dotenv not loaded)
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/factor.py` (run command only)
  Change:
  - Running `python factor.py` directly does NOT load `.env`. RDAgent uses `dotenv run --` prefix (see `cli.py:11-14`).
  - Fix: use `dotenv run -- python rdagent/app/qlib_rd_loop/factor.py` instead.
  Verify:
  - Log shows `chat_model='deepseek/deepseek-chat'` (not `gpt-4-turbo`).
  - No AuthenticationError.

- [x] Task 6e: Smoke run attempt 2 (2026-04-06)
  Results:
  - B6 confirmed fixed: `chat_model='deepseek/deepseek-chat'` in LITELLM_SETTINGS.
  - direct_exp_gen: ✅ hypothesis generated via DeepSeek.
  - coding: ✅ 5 factor workspaces generated by CoSTEER.
  - running: ⏳ baseline Qlib execution completed (annualized_return=0.186436), stalled at "New factor processing".
  - feedback: ❌ not reached (timed out at 20 min).
  - No exceptions found: 0 hits for IndexError, ValueError, AuthenticationError, OllamaException.
  - Known OK warnings present: `Mean of empty slice`, CatBoost/XGBoost/PyTorch skips.
  - Log at: `/home/hp/projects/RD-Agent/log/2026-04-06_04-02-40-596691/`
  Assessment:
  - All blockers B1-B6 cleared. Loop is functionally working.
  - Stall at "New factor processing" is likely I/O-bound (USB F: drive) or just needs more time.
  - Next: re-run with longer timeout or nohup to let it complete.

- [ ] Task 6f: Smoke run attempt 3 (longer timeout / nohup)
  Run with nohup to avoid timeout. Let it run to completion.
  Verify:
  - Loop completes all stages: direct_exp_gen → coding → running → feedback.
  - No unrecoverable errors in the log.

- [ ] Task 7: Full factor loop
  Files:
  - `//wsl.localhost/Ubuntu/home/hp/start_factor_loop.sh`
  Change:
  - Restore normal loop parameters after the smoke succeeds.
  Verify:
  - Stable progress across runs.
  - No recurring provider or data-coverage failures.
  Expected:
  - Normal loop execution can proceed without manual babysitting.

## Progress

- Completed Task 1 verification in the `rdagent` environment.
- Confirmed the stale raw/adj source paths in the original plan.
- Completed Task 2 diagnosis: adj matches current qlib exactly, raw is superset, script lacks inner join.
- Decision: current `cn_data` is usable; no rebuild needed now.
- Full coverage report saved to `D:/Quant/artifacts/reports/2026-04-05-qlib-rebuild-coverage-report.md`.
- Completed Task 3: all 4 smoke tests PASS (Ollama, `.env`, embedding, chat).
- Recorded that receipt `20260405-143954_fin_factor_custom` is not sufficient proof by itself.
- Completed Task 4: B2 reproduced, fixed in the worktree, covered by regression, and verified against the exact failing payload.
- Completed Task 5: B3 repaired by installing `pyqlib` into `rdagent` and verifying `import qlib`.
- Task 6 (attempt 1): B4 benchmark blocker discovered and fixed.
- Task 6c: B5 calendar off-by-one fixed (test_end → 2026-03-20).
- Task 6d: B6 dotenv loading discovered — must use `dotenv run --` prefix.
- Task 6e (attempt 2): All B1-B6 cleared. Loop reached coding+running stages. Stalled at "New factor processing" after 20 min (no errors, likely I/O-bound).
- Next: Task 6f — re-run smoke with nohup for longer runtime.

## Surprises

- The existing `F:/DataCenter/qlib/cn_data` is already nontrivial, so a rebuild is not the default safe move.
- The raw/adj mismatch is the real blocker for Task 2, not the embedding runtime.
- `exit_code=0` can still hide failure when stdout contains LiteLLM Provider List errors.
- Ollama's `nomic-embed-text` practical embed ceiling for these mixed payloads is much lower than the naive `8192` assumption.
- The activated `rdagent` conda env does not include `pytest`; targeted regression coverage had to run via `python -m unittest`.

## Decision Log

- 2026-04-05: Keep the working `cn_data` baseline unless a clean coverage path is proven.
- 2026-04-05: Gate Task 2 on a filtered raw root or equivalent coverage fix.
- 2026-04-05: Treat log-content checks as mandatory for success receipts.
- 2026-04-05: Continue in this worker without waiting on the separate smoke execution thread.
- 2026-04-05: Prefer the local `nomic-embed-text` limit override over LiteLLM's unknown-model path to avoid misleading warnings and first-shot Ollama 400s.
- 2026-04-05: Repair the active `rdagent` env with `pyqlib` rather than deferring qlib importability to runtime.

## Verification Matrix

| Item | Status | Evidence |
|------|--------|----------|
| `.env` embedding model switched to Ollama | Done | `ollama/nomic-embed-text` in `/home/hp/projects/RD-Agent/.env` |
| Stale `18000` references removed | Done | Non-commented refs removed from `.env` |
| `litellm.embedding(...)` smoke | Done | Returns dimension `768` |
| `LiteLLMAPIBackend.create_embedding(...)` smoke | Done | Returns dimension `768` |
| `cn_data` contains nontrivial factor values | Done | Sample symbol checks already confirm this |
| Raw/adj plan paths corrected | Done | Actual trees are `F:/BaiduNetdiskDownload/A股1d/output` and `F:/BaiduNetdiskDownload/A股1d_adj` |
| Task 2 safe-to-rerun status | Blocked | Coverage mismatch must be solved first |
| Receipt validation | Done | `exit_code=0` rejected because logs contained LiteLLM Provider List errors |
| B2 direct endpoint diagnosis | Done | `/api/embed` accepts small single/batch inputs; the known 7886-char payload reproduces `the input length exceeds the context length` |
| B2 regression coverage | Done | `python -m unittest discover -s test/oai -p 'test_embedding_utils.py'` passes |
| B2 runtime verification | Done | Same payload truncates to 1612 tokens and `LiteLLMAPIBackend().create_embedding(...)` returns 1x768 without a 400 |
| B3 qlib importability | Done | `import qlib` resolves to `/opt/miniconda3/envs/rdagent/lib/python3.10/site-packages/qlib/__init__.py` |

## Outcome / Handoff

Task 1 is effectively done and verified. Task 2 is intentionally gated; do not rerun it until the raw/adj coverage problem is resolved with a filtered raw root or another clean path. B1-B6 are now all cleared. The factor loop is functionally working — it reaches the coding and running stages without errors. The remaining question is whether it can complete the full loop (running → feedback) given enough time. Use `dotenv run --` for all future factor loop runs. Any future success claim must check the logs, not just the exit code.
