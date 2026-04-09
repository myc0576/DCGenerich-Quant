# QUANT

This repo is a personal quant sandbox for code, scripts, and docs. Consolidated KB content now lives at `F:/QuantKB/`.

## What goes where

- `research/`  : rough experiments / scratchpads (promote stable KB-style notes to `F:/QuantKB/`)
- `strategies/`: strategy specs (idea -> assumptions -> implementation notes)
- `indicators/`: indicator definitions + implementations
- `backtest/`  : backtest runners / adapters / examples
- `data/`      : data dictionary + small samples only (large data ignored)
- `scripts/`   : entrypoints for common tasks
- `docs/`      : glossary, conventions
- `templates/` : templates for notes / research / strategy writeups

## Conventions

- Write notes in Markdown. Prefer short, atomic pages.
- Every strategy note should state: universe, signal, execution, costs, risk, eval.
- Keep raw datasets out of git; store paths/config locally.

## Quick start

### Node/TS

- Install deps: `npm install`
- Run tests: `npm test`

### Python

- Use `uv` if available: `uv run python scripts/hello.py`
- Otherwise: `python scripts/hello.py`

## Index

- `F:/QuantKB/`
- `docs/GLOSSARY.md`
