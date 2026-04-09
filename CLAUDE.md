# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A personal quant sandbox for code, scripts, docs, and experiments. Consolidated knowledge-base content now lives under `F:/QuantKB/`. Bilingual (Chinese/English) content is common throughout. The workspace lives at `D:/Quant` on Windows 11 with bash shell (Git Bash). A Phase-1 workspace migration (2025-04-05) split the old `F:/Quant` into `D:/Quant` (code, scripts, docs) and `F:/DataCenter/` (large data). F: remains a USB removable hard drive; use `D:/Quant` canonical paths for code and `F:/QuantKB` for the consolidated SQLite KBs.

## Commands

```bash
# Node/TS
npm install                    # install deps (ESM, type: "module")
npm test                       # node --test

# Python
uv run python scripts/<file>   # preferred if uv is available
python scripts/<file>          # fallback
```

## Architecture

### Directory Layout

| Path | Purpose |
|---|---|
| `research/` | Rough experiments / scratchpads; promote stable KB-style notes to `F:/QuantKB/` when ready |
| `strategies/` | Strategy specs – each gets its own folder with README (use `templates/strategy.md`), `src/`, and backtest examples |
| `indicators/` | Indicator definitions + reference implementations + tests |
| `backtest/` | Backtest runners, adapters, OHLCV→signal→positions→trades→PnL pipeline |
| `data/` | Data dictionary + small samples only; bulk data lives at `F:/DataCenter/`; `data/raw/` and `data/cache/` are gitignored |
| `scripts/` | Entrypoints (`kb-index.mjs` generates the Markdown index) |
| `docs/` | Glossary, conventions, migration plans |
| `templates/` | Templates for strategy, indicator, and research-note writeups |
| `repos/` | Managed git repos: QLIB, FinRL, vnpy, wondertrader, Mason, 综合自定义交易系统v5.6.8 |
| `worktrees/` | Git worktrees (currently QLIB worktrees) |
| `artifacts/` | Build/research outputs under `QLIBartifacts/` (mason, qlib, rdagent subsystems) |
| `compat/` | Compatibility layer via junctions: `compat/apps/mason`, `compat/qmt/live`, `compat/qmt/sim` |
| `migration-logs/` | Historical migration records (reference only) |

### Managed Repos (`repos/`)

These are full git repositories, not submodules:
- **QLIB** — Microsoft qlib-based factor/model research
- **FinRL** — DRL-based trading research
- **vnpy** — vn.py trading platform (with QMT broker integration)
- **wondertrader** — WonderTrader C++ framework
- **Mason量化回测系统3** — Mason backtesting system (A-share strategies)
- **综合自定义交易系统v5.6.8** — Custom integrated trading system

### External Paths

- `D:/WSL` – canonical WSL storage root (Ubuntu distro)
- `D:/Quant/compat/qmt/live` and `sim` – QMT (国金证券) live/sim environments
- `D:/Quant/compat/apps/mason` – Mason desktop app data
- `F:/QuantKB/` – consolidated SQLite-backed local knowledge bases
- `F:/DataCenter/` – bulk data storage on USB drive (market data, QLIB datasets, backtest results)

## Conventions

- Markdown for all notes; prefer short, atomic pages.
- Every strategy note must cover: universe, signal, execution, costs, risk, eval.
- Large datasets stay out of git – only commit samples, schemas, and dictionaries.
- Timestamps: ISO-8601 with timezone. Prices: float with currency. Returns: decimal (0.01 = 1%).
- Stable local KB content is maintained in `F:/QuantKB/`, not inside this repository.
- When referencing workspace paths in scripts or notes, always use canonical `D:/Quant/...` paths for code and `F:/DataCenter/...` for data, never retired aliases.

## Key Glossary

alpha, beta, IC (information coefficient), IR (information ratio), Sharpe, max drawdown, turnover, slippage — definitions in `docs/GLOSSARY.md`.
