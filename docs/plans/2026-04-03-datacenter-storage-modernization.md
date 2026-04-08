> **STATUS: SUPERSEDED** — 被 `2026-04-04-d-f-drive-split-migration.md` 取代。
> 核心变更：数据方案从 MySQL → SQLite + DuckDB。

# DataCenter Storage Modernization Execution Plan

## Goal

Establish `F:/DataCenter` as the single authoritative market and research data hub for the workspace, migrate legacy CSV/XLSX workflows toward Parquet + MySQL, and standardize downstream delivery for Mason, 综合自定义交易系统, Qlib, vnpy, and RD-Agent-driven Qlib research.

## Context

- The user wants a new center data repository rooted at `F:/DataCenter`.
- First-wave ingestion must include:
  - `F:/Quant/repos/Mason量化回测系统3/全部历史数据.csv`
  - `F:/BaiduNetdiskDownload/A股` extracted `1d` and `1m` history trees
  - `F:/BaiduNetdiskDownload/A股-财务数据` CSV files
- Legacy projects currently read history from CSV and persist operational state to many `.xlsx` files.
- `F:/Quant/data/QLIBdata` already contains provider/canonical/feature/registry structures and must be reconciled with the new center-hub design.
- Mason web backend currently uses SQLite for runtime metadata and batch metadata.
- Existing registry data still points to retired roots such as `E:/QLIBdata/provider/...`.
- RD-Agent artifacts and validation history show a real `RD-Agent -> Qlib -> research_outputs -> replay/validation` workflow that depends on stable Qlib provider paths and stable research output locations.

## Constraints

- Treat `F:/DataCenter` as the only authoritative data source after cutover.
- Use Parquet for large historical market/factor/fundamental datasets.
- Use local MySQL for transactional/stateful data that is currently stored in Excel.
- Plan for phased compatibility cutover rather than a one-shot hard switch.
- Include Windows-local MySQL installation/bootstrap in scope because no active `MySQL*` Windows service is currently visible.
- Preserve research reproducibility for Qlib and RD-Agent runs; provider contract changes must remain auditable.

## Non-goals

- Rewriting every unrelated helper script that only exports ad hoc `数据.xlsx` scratch files on day one.
- Changing Qlib upstream internals beyond what is needed for provider-path and contract integration.
- Replacing MLflow or RD-Agent runtime internals.
- Deleting legacy CSV/XLSX assets before the new pipeline and downstream adapters are validated.

## File Map

- `F:/DataCenter/`
- `F:/Quant/docs/plans/2026-04-03-datacenter-storage-modernization.md`
- `F:/Quant/data/QLIBdata/`
- `F:/Quant/repos/Mason量化回测系统3/`
- `F:/Quant/repos/综合自定义交易系统v5.6.8/`
- `F:/Quant/repos/QLIB/`
- `F:/Quant/repos/vnpy/`
- `F:/Quant/artifacts/QLIBartifacts/rdagent/`
- `F:/BaiduNetdiskDownload/A股/`
- `F:/BaiduNetdiskDownload/A股-财务数据/`

## Risks

- Legacy project code contains a large number of scattered `.xlsx` reads/writes, including both core runtime state and strategy-specific intermediate artifacts.
- Mason backend currently mixes file exports, Parquet artifacts, and SQLite metadata; replacing storage paths without an adapter layer would be brittle.
- Existing `provider_roots.yaml` and historical docs still reference retired `E:/QLIBdata` roots, which can silently break RD-Agent/Qlib reproducibility if only part of the stack is migrated.
- `1m` history volume under `F:/BaiduNetdiskDownload` is large enough that import batching, partitioning, and manifest-based verification are required.
- RD-Agent validation evidence currently references WSL-side `/mnt/e/QLIBdata/...` providers, so path normalization and replay compatibility must be designed deliberately.

## Task Breakdown
- [ ] Task 1: Lock the target data architecture and contracts
  Files:
  `F:/Quant/docs/plans/2026-04-03-datacenter-storage-modernization.md`
  `F:/Quant/data/QLIBdata/registry/provider_roots.yaml`
  Change:
  Define the authoritative storage layers for `F:/DataCenter` and the compatibility relationship to `F:/Quant/data/QLIBdata`, including raw, standardized, published, registry, and research/replay contract responsibilities.
  Verify:
  Review the written architecture against existing Qlib, vnpy, Mason, and RD-Agent path expectations.
  Expected:
  Every downstream consumer has a single declared source of truth and no ambiguous dual-root ownership remains.

- [ ] Task 2: Design the `F:/DataCenter` directory layout and dataset registry
  Files:
  `F:/DataCenter/`
  `F:/Quant/data/QLIBdata/registry/datasets.parquet`
  `F:/Quant/data/QLIBdata/registry/consumer_contracts.parquet`
  Change:
  Specify the exact directory structure, partition keys, manifest schema, naming rules, and consumer contract registry for `1d`, `1m`, `tick`, `factor`, `fundamentals`, and RD-Agent/Qlib research views.
  Verify:
  Validate that the contract can represent Mason CSV imports, BaiduNetdisk snapshots, Qlib provider exports, vnpy AlphaLab exports, and RD-Agent replay metadata.
  Expected:
  A single registry can answer what each dataset is, where it lives, which consumer uses it, and how it was generated.

- [ ] Task 3: Plan bulk import and normalization for legacy historical files
  Files:
  `F:/Quant/repos/Mason量化回测系统3/全部历史数据.csv`
  `F:/BaiduNetdiskDownload/A股/`
  `F:/BaiduNetdiskDownload/A股-财务数据/`
  Change:
  Define importer scripts, schema normalization, partition strategy, duplicate handling, manifest output, and validation checks for the Mason CSV baseline plus BaiduNetdisk 1d/1m/fundamental CSV trees.
  Verify:
  Compare row counts, symbol counts, date coverage, and schema hashes between source files and imported Parquet partitions.
  Expected:
  All first-wave source datasets land in `F:/DataCenter` with repeatable import manifests and no manual file-by-file handling.

- [ ] Task 4: Plan MySQL replacement for legacy Excel-backed state
  Files:
  `F:/Quant/repos/Mason量化回测系统3/`
  `F:/Quant/repos/综合自定义交易系统v5.6.8/`
  Change:
  Define local MySQL installation/bootstrap, SQLAlchemy repository layer, schema groups, migration order, and Excel-to-MySQL backfill strategy for holdings, accounts, orders, buy/sell candidate lists, strategy state, and batch/report metadata.
  Verify:
  Confirm each legacy Excel object has a mapped table, ownership boundary, and read/write adapter path.
  Expected:
  Excel is no longer a required system-of-record format for operational state once cutover completes.

- [ ] Task 5: Plan Mason and 综合自定义交易系统 read/write refactors
  Files:
  `F:/Quant/repos/Mason量化回测系统3/`
  `F:/Quant/repos/综合自定义交易系统v5.6.8/`
  Change:
  Inventory and group `pd.read_csv`, `pd.to_csv`, `pd.read_excel`, and `pd.to_excel` call sites into migration waves, starting with market-history reads and core transactional state, then expanding to broader business Excel usage.
  Verify:
  Cross-check grouped call sites against runtime-critical paths, batch workflows, and automated tests.
  Expected:
  Refactor work is sequenced by risk and ownership instead of attempting a fragile all-at-once replacement.

- [ ] Task 6: Plan unified daily pipeline and downstream publishing
  Files:
  `F:/Quant/scripts/`
  `F:/Quant/repos/QLIB/`
  `F:/Quant/repos/vnpy/`
  Change:
  Define `daily_update.py` orchestration for download, ingest, normalize, manifest, publish-to-Qlib, publish-to-vnpy, and state sync, including failure handling, re-runs, and partial-success reporting.
  Verify:
  Confirm the pipeline can support daily delta updates without rewriting the whole center store.
  Expected:
  One entrypoint governs daily data freshness across all consumers.

- [ ] Task 7: Plan RD-Agent and Qlib research data integration
  Files:
  `F:/Quant/artifacts/QLIBartifacts/rdagent/`
  `F:/Quant/repos/QLIB/`
  `F:/Quant/data/QLIBdata/registry/provider_roots.yaml`
  Change:
  Define how `F:/DataCenter` publishes stable Qlib-compatible provider views, research dataset contracts, replay manifests, and artifact lineage so RD-Agent can control Qlib strategy development reproducibly.
  Verify:
  Check that provider paths, run manifests, and replay evidence can be normalized away from retired `E:/QLIBdata`/`E:/QLIBartifacts` assumptions.
  Expected:
  RD-Agent research runs use a stable, auditable provider contract and remain replayable after the storage migration.

- [ ] Task 8: Plan cutover, compatibility, and retirement
  Files:
  `F:/Quant/docs/plans/2026-04-03-datacenter-storage-modernization.md`
  `F:/Quant/data/QLIBdata/registry/provider_roots.yaml`
  Change:
  Define the staged rollout order, temporary compatibility adapters, success criteria, rollback posture, and retirement conditions for old CSV/XLSX and old provider roots.
  Verify:
  Ensure each cutover stage has explicit go/no-go checks and rollback boundaries.
  Expected:
  The migration can proceed safely without keeping permanent dual-write ambiguity.

## Progress

- 2026-04-03: Confirmed the user wants `F:/DataCenter` to be the single center data source rather than an extension of `F:/Quant/data/QLIBdata`.
- 2026-04-03: Confirmed first-wave ingestion scope includes Mason baseline CSV plus BaiduNetdisk `1d`, `1m`, and financial CSV trees.
- 2026-04-03: Confirmed Excel replacement scope is full-business migration, but cutover should be phased rather than one-shot.
- 2026-04-03: Confirmed local MySQL install/bootstrap must be included in the plan.
- 2026-04-03: Audited representative CSV/XLSX/Parquet usage across Mason and 综合自定义交易系统; found large Excel usage surface and existing Mason SQLite runtime metadata.
- 2026-04-03: Audited `RD-Agent -> Qlib -> research_outputs` evidence and confirmed historical provider/artifact path drift still exists in docs and registry files.

## Surprises

- `F:/Quant/data/QLIBdata/registry/provider_roots.yaml` still points to retired `E:/QLIBdata` provider roots even though the canonical workspace has already moved under `F:/Quant`.
- Mason backend is already partially modernized around Parquet artifacts and SQLite metadata, which means a clean repository abstraction can reduce migration risk.
- RD-Agent validation artifacts still encode `/mnt/e/QLIBdata/...` and `E:/QLIBartifacts/...` assumptions, so RD-Agent reproducibility must be treated as a first-class migration concern.

## Decision Log

- 2026-04-03: Use `F:/DataCenter` as the new single authoritative data root.
- 2026-04-03: Keep Parquet as the storage format for historical market/factor/fundamental datasets.
- 2026-04-03: Replace Excel-backed operational state with local MySQL through a SQLAlchemy-based repository layer.
- 2026-04-03: Use phased compatibility cutover instead of an immediate hard switch.
- 2026-04-03: Include RD-Agent-controlled Qlib strategy research as an explicit downstream consumer in the data architecture rather than treating it as an incidental side path.

## Verification Matrix

| Area | Verify | Status | Notes |
| --- | --- | --- | --- |
| Center root choice | Confirm user-selected root and authority model | In progress | User selected `F:/DataCenter` as sole authority |
| Source inventory | Confirm Mason CSV + BaiduNetdisk 1d/1m/fundamental paths | In progress | First-wave sources are identified |
| Legacy call-site audit | Search `read_csv`/`read_excel`/`to_excel`/`to_csv` usage | In progress | High-volume Excel surface confirmed |
| Existing provider registry | Inspect `provider_roots.yaml` | In progress | Still references retired `E:/QLIBdata` roots |
| RD-Agent path lineage | Inspect `artifacts/QLIBartifacts/rdagent` evidence | In progress | Historical `/mnt/e/...` and `E:/...` assumptions confirmed |
| MySQL readiness | Check for local Windows MySQL service | In progress | No active `MySQL*` service observed |

## Outcome / Handoff

- Draft execution plan created and being refined in planning mode.
- Next planning focus:
  - finalize the RD-Agent/Qlib data contract scope
  - finalize how `F:/Quant/data/QLIBdata` coexists with or proxies to `F:/DataCenter`
  - convert this draft into a decision-complete implementation plan with explicit file-level tasks and acceptance checks
