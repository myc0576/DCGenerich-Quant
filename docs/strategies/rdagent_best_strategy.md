# RD-Agent Best Strategy Promotion Rules

## Purpose

统一 RD-Agent 候选策略的落盘、评分和晋级标准，避免“跑完只有日志，没有可比较候选”的状态。

## Candidate Location

- Root: `D:\Quant\artifacts\strategy_candidates`
- Naming: `YYYYMMDD_loop<loop>_<stage>_<slug>`
- Required payload:
  - `metadata.json`
  - `summary.md`
  - `evidence/` (log dir, plots, report links)
  - `artifacts/` (可复用的策略或信号文件)

## Promotion Gates

所有 gate 必须同时满足；任一 gate 不满足，禁止晋级。

- annualized return >= 0.12
- Sharpe >= 1.00
- max drawdown <= 0.20
- turnover <= 0.60
- stability: 最近 3 个 checkpoint 至少 2 个方向一致，且不能依赖单日异常收益

## Human Review Gate

- 候选必须注明训练 / 验证 / 测试窗口
- 候选必须关联 source log dir 和生成命令
- 候选必须说明是否存在 timeout、手工 override 或 sidecar 依赖

## Promotion Workflow

1. 候选写入 `strategy_candidates`
2. 按 gate 打分
3. 未达标即停止，不得提升为 `best strategy`
4. 达标后再进入人工 review 和 replay

## Current Status

- 2026-04-09: 结构已建立，当前还没有通过全部 gate 的正式 best strategy。
