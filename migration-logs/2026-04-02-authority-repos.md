# Repo Authority Inventory - 2026-04-02

## Goal
Produce a read-only authority inventory for the requested repo pairs and identify the best canonical working entry for migration and cutover decisions.

## Context
Scanned pairs:
- `D:/QLIB` vs `F:/Quant/repos/QLIB`
- `F:/FinRL` vs `F:/Quant/repos/FinRL`
- `F:/vnpy` vs `F:/Quant/repos/vnpy`
- `F:/wondertrader` vs `F:/Quant/repos/wondertrader`
- `F:/Mason量化回测系统3` vs `F:/Quant/repos/Mason量化回测系统3`
- `F:/综合自定义交易系统v5.6.8` vs `F:/Quant/repos/综合自定义交易系统v5.6.8`

## Constraints
- Read-only inspection only.
- No changes outside this file.
- Other agents may be modifying other locations in parallel.

## Non-goals
- No repository repairs.
- No history rewriting.
- No cleanup of unrelated dirty state.
- No deep provenance investigation beyond the current scan.

## File Map
- `F:/Quant/migration-logs/2026-04-02-authority-repos.md`

## Risks
- Some copies are exact mirrors, so authority is inferred from path role and working-context signals rather than divergence.
- `F:/Quant/repos/FinRL` behaves like a non-standalone git context, so the local `git` view there is not a canonical repo boundary.

## Task Breakdown
- [x] Task 1: Collect repo metadata
  Files:
  - Read-only inspection of the six requested pairs
  Change:
  - Captured `HEAD`, branch, `git status` summary, `.git` presence, approximate size, commit/tracked-file density, and remote hints
  Verify:
  - All conclusions below reflect the latest read-only scan
  Expected:
  - Enough evidence to rank authority without extra digging

- [x] Task 2: Derive authority conclusions
  Files:
  - This inventory file only
  Change:
  - Wrote the final recommendation for each pair
  Verify:
  - Conclusions match the observed repo topology and status
  Expected:
  - Clear answer for FinRL, Mason, and QLIB cutover

## Progress
- Completed the scan and captured the most useful authority signals.

## Surprises
- `F:/Quant/repos/FinRL` does not present as a standalone repo boundary even though `git` can interpret it as worktree-like state.
- `F:/综合自定义交易系统v5.6.8` is not itself a git repo, while the `F:/Quant/repos/...` copy is.

## Decision Log
- `F:/Quant/repos/QLIB` is the preferred active entry for cutover because it is the migration-workspace copy with current edits, while the left side is the older baseline clone.
- `F:/FinRL` is the canonical standalone repo; `F:/Quant/repos/FinRL` is not an independent authority source.
- `F:/Quant/repos/Mason量化回测系统3` is the preferred working authority inside the migration set, while the root clone is effectively an equivalent mirror.
- `F:/Quant/repos/综合自定义交易系统v5.6.8` is the only valid git authority in that pair.

## Verification Matrix
- `D:/QLIB`:
  - `HEAD`: `f47ad7be505f8adf285ece6fec784c9710a385df`
  - Branch: `main`
  - Status: `ahead 2065, behind 1`, local edits in `.claude/settings.json` and `.claude/settings.local.json`
  - `.git`: present
  - Size: ~39,255 tracked files, pack ~618.05 MiB
  - Authority signal: strong baseline clone, but less active than the Quant workspace copy

- `F:/Quant/repos/QLIB`:
  - `HEAD`: `f47ad7be505f8adf285ece6fec784c9710a385df`
  - Branch: `main`
  - Status: `ahead 2065, behind 1`, local edits in `.claude/settings.local.json` and `docs/plans/2026-03-26-csi1000-rdagent-qlib-oversold-reversal.md`
  - `.git`: present
  - Size: ~39,255 tracked files, pack ~618.05 MiB
  - Authority signal: best active entry for cutover; same commit as the baseline plus in-flight migration work

- `F:/FinRL`:
  - `HEAD`: `f4283de63ca73c915321c5555fa3751698a61eec`
  - Branch: `master`
  - Status: clean
  - `.git`: present
  - Size: 198 tracked files, pack ~13.61 MiB
  - Authority signal: clean standalone repo with origin remote

- `F:/Quant/repos/FinRL`:
  - `HEAD`: `2ed64fb8c49eba61d3a0cbec30b8d0e7e8be553d`
  - Branch: `main`
  - Status: dirty, with paths reported outside the directory boundary (`../../.gitignore`, `../../package.json`)
  - `.git`: not present locally
  - Size: 0 tracked files, pack 0 bytes
  - Authority signal: not a standalone canonical repo; treat as non-authoritative for FinRL

- `F:/vnpy`:
  - `HEAD`: `df4204793b9d7e73a44f56a9135b603ab62c8776`
  - Branch: `master`
  - Status: `ahead 2`, local edits in `vnpy/alpha/dataset/datasets/__init__.py` and `vnpy/alpha/lab.py`
  - `.git`: present
  - Size: ~3,549 tracked files, pack ~306.18 MiB
  - Authority signal: healthy active repo, but no evidence separating it from the Quant copy

- `F:/Quant/repos/vnpy`:
  - `HEAD`: `df4204793b9d7e73a44f56a9135b603ab62c8776`
  - Branch: `master`
  - Status: `ahead 2`, same local edits as the root copy
  - `.git`: present
  - Size: ~3,549 tracked files, pack ~306.18 MiB
  - Authority signal: mirror-level parity with the root copy; acceptable active workspace

- `F:/wondertrader`:
  - `HEAD`: `70feef13ef7cbc6d4c3333a6158a92b919311d48`
  - Branch: `master`
  - Status: dirty, with added `.codex_tmp/...` log files
  - `.git`: present
  - Size: ~8,553 tracked files, pack ~283.77 MiB
  - Authority signal: active repo with origin remote

- `F:/Quant/repos/wondertrader`:
  - `HEAD`: `70feef13ef7cbc6d4c3333a6158a92b919311d48`
  - Branch: `master`
  - Status: same dirty state as the root copy
  - `.git`: present
  - Size: ~8,553 tracked files, pack ~283.77 MiB
  - Authority signal: mirror-level parity with the root copy

- `F:/Mason量化回测系统3`:
  - `HEAD`: `7ae34d8733640d6cb4a8beb046083822681f1eef`
  - Branch: `codex/a-share-reversal-multifactor`
  - Status: dirty, with edits in `qmt_trader/etf_fund_data_qmt.py` and `qmt_trader/stock_data_qmt.py`
  - `.git`: present
  - Size: ~852 tracked files, pack 0 bytes
  - Authority signal: same commit and branch as the Quant copy; good mirror, but not a better signal than the migration workspace path

- `F:/Quant/repos/Mason量化回测系统3`:
  - `HEAD`: `7ae34d8733640d6cb4a8beb046083822681f1eef`
  - Branch: `codex/a-share-reversal-multifactor`
  - Status: same dirty state as the root copy
  - `.git`: present
  - Size: ~852 tracked files, pack 0 bytes
  - Authority signal: preferred working authority in the migration set

- `F:/综合自定义交易系统v5.6.8`:
  - `HEAD`: not available
  - Branch: not available
  - Status: not available
  - `.git`: not present as a git repo
  - Size: not available
  - Authority signal: not canonical for git-based repo operations

- `F:/Quant/repos/综合自定义交易系统v5.6.8`:
  - `HEAD`: `d1a9f579fa203fac1ef0a0467cc2115f702ec65f`
  - Branch: `main`
  - Status: dirty, with deletions in `__pycache__/analysis_models.cpython-39.pyc` and `__pycache__/bond_cov_data.cpython-39.pyc`
  - `.git`: present
  - Size: ~2,926 tracked files, pack 0 bytes
  - Authority signal: only valid git authority in the pair

## Outcome / Handoff
### Current best-value conclusions
1. `FinRL` canonical is the standalone repo at `F:/FinRL`; `F:/Quant/repos/FinRL` is not an independent git repo authority.
2. For `Mason`, prefer `F:/Quant/repos/Mason量化回测系统3` as the working authority in the migration set. The root copy is effectively an equivalent mirror, so there is no meaningful divergence signal, but the Quant copy is the better operational anchor.
3. For `QLIB`, `F:/Quant/repos/QLIB` looks like the more active cutover entry because it carries current migration work in `docs/plans/...`, while both sides otherwise share the same commit lineage.
4. `vnpy` and `wondertrader` are effectively tied mirrors; there is no strong authority split from the current scan.
5. `F:/Quant/repos/综合自定义交易系统v5.6.8` is the only valid git authority in that pair.

### Next-step suggestions
- Use `F:/Quant/repos/QLIB` for cutover work and treat `D:/QLIB` as the baseline mirror.
- Keep `F:/FinRL` as the canonical FinRL repo and avoid treating `F:/Quant/repos/FinRL` as authoritative.
- Use `F:/Quant/repos/Mason量化回测系统3` and `F:/Quant/repos/综合自定义交易系统v5.6.8` as the primary migration targets.
- Treat `vnpy` and `wondertrader` as parity mirrors unless a future diff shows divergence.
