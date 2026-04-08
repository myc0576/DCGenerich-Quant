# 2026-03-28 VNpy CSI1000 全量日线回测完成总结

## 背景

本次工作的目标，是把 `QLIB` 中已经确认的 CSI1000 反转研究结果，落到 `VNpy Alpha` 框架里，形成一条可以实际运行的比较回测链路：

- 从本地 Qlib 日线数据导出 `AlphaLab` 可读格式
- 在 VNpy 中重建 control 和 reversal 两套因子
- 增加 CSI1000 专用策略与回测支持
- 用一套统一 runner 跑出 control vs reversal 的对比结果

研究权威来源来自：

- `E:\QLIBartifacts\rdagent\research_outputs\csi1000_oversold_reversal\20260327-1219-formal-review`

本地数据源使用：

- `E:\QLIBdata\.qlib\qlib_data\cn_data`

## 本次完成的主要内容

### 1. 多子代理拆分执行

本次不是单线程实现，而是按模块拆给多个子代理并行推进，主代理负责：

- 汇总研究权威来源
- 校验本地数据可用性
- 统一约束和验收标准
- 复核子代理产物
- 做最终联调、修 bug、跑全量回测

子代理分别承担了：

- QLIB 侧策略规格提取与数据导出脚本
- VNpy 侧 RDAgent 因子包接入
- VNpy 侧 CSI1000 control/reversal 策略与时序支持
- VNpy comparison runner 搭建

### 2. QLIB 侧完成的工作

在 `D:\QLIB\.worktrees\vnpy-csi1000-integration` 中完成：

- `scripts/rdagent/vnpy_strategy_spec.py`
- `scripts/qlib_to_vnpy_converter.py`
- 对应测试文件

关键实现点：

- 从 formal-review bundle 提取 control 和 reversal 的可复用策略规格
- 将 Qlib 数据导出为 VNpy `AlphaLab` 可直接读取的目录结构
- 输出根目录 `contract.json`
- 输出 `component/{index_symbol}` 的 shelve 成分股数据
- 将股票代码统一转换为 VNpy 使用的 `vt_symbol`
- 单独导出 benchmark parquet，保证 `show_performance()` 可用

### 3. VNpy 侧完成的工作

在 `C:\Users\HP\.config\superpowers\worktrees\vnpy\csi1000-vnpy-integration` 中完成：

- `vnpy/alpha/dataset/datasets/rdagent_factors.py`
- `vnpy/alpha/strategy/strategies/csi1000_base.py`
- `vnpy/alpha/strategy/strategies/csi1000_control_strategy.py`
- `vnpy/alpha/strategy/strategies/csi1000_reversal_strategy.py`
- `vnpy/alpha/strategy/backtesting.py`
- `examples/alpha_research/csi1000_control_vs_reversal.py`
- 对应测试文件

关键实现点：

- 接入 control 20 因子包
- 接入 reversal 12 因子包
- 增加 CSI1000 long-only top-k rotation 策略基类
- 增加 control / reversal 两个候选策略
- 给回测引擎增加 `same_bar_close` 支持，为将来分钟级精确执行做准备
- 新增统一 comparison runner，负责：
  - 加载 AlphaLab 数据
  - 生成特征和标签
  - 训练两套 LightGBM
  - 保存 signal
  - 分别执行 control / reversal 回测
  - 输出 JSON 汇总

## 中途发现并修复的关键问题

### 1. AlphaLab 导出格式最初不完全兼容

一开始的导出草稿虽然能生成 parquet，但并不完全符合 VNpy `AlphaLab` 的真实契约。后续修正为：

- 根目录 `contract.json`
- `component/{index_symbol}` shelve
- `vt_symbol` 命名的日线 parquet
- benchmark 单独落地

这个修正是后续 runner 能稳定跑通的前提。

### 2. 全量回测首次运行时暴露空 OHLCV 数据问题

第一次跑全量日线回测时，control 在回测过程中提前中断，根因不是策略逻辑，而是：

- 本地 Qlib 原始日线数据中，部分股票某些日期存在 `open/high/low/close` 为空的记录
- exporter 最初把这些无效 bar 一并写入了 `AlphaLab`
- VNpy 回测撮合时出现 `float >= None`，导致 control 提前停止

最终修复方式不是在回测引擎里“打补丁绕过去”，而是在 exporter 源头直接丢弃 `OHLCV` 不完整的行。修复后：

- 新增了对应的回归测试
- 全量数据重新导出
- control / reversal 两套回测都能完整跑完

## 验证过程

本次完成了三层验证：

### 1. 单元/模块验证

- QLIB 侧 spec / converter 测试通过
- VNpy 侧 factor / strategy / timing 测试通过
- runner 的 `--help` 和 `py_compile` 通过

### 2. 小样本烟测

先用少量股票导出一个小型 `AlphaLab` 数据集，确认整条链路可以跑通：

- 数据导出
- 因子构建
- 模型训练
- control / reversal 双回测
- JSON 汇总输出

产物位置：

- `D:\QLIB\.worktrees\vnpy-csi1000-integration\tmp\vnpy_smoke_lab`

### 3. 全量日线回测

之后基于 CSI1000 全量股票导出正式 `AlphaLab` 数据目录，并执行完整日线回测。

产物位置：

- 全量 AlphaLab 数据：
  - `D:\QLIB\.worktrees\vnpy-csi1000-integration\tmp\vnpy_full_lab`
- 全量回测结果：
  - `D:\QLIB\.worktrees\vnpy-csi1000-integration\tmp\vnpy_full_lab\full_daily_summary.json`

## 全量日线回测结果

回测设置：

- Universe: `1008` 只 CSI1000 股票
- 数据区间: `2015-01-01` 到 `2026-03-23`
- 训练区间: `2015-01-01` 到 `2020-12-31`
- 验证区间: `2021-01-01` 到 `2022-12-31`
- 测试区间: `2023-01-01` 到 `2026-03-23`
- 初始资金: `1,000,000`

最终结果：

### Control

- 期末资金: `1,079,442.24`
- 总收益率: `7.94%`
- 最大回撤: `-44.24%`
- Sharpe: `0.23`
- 交易日数: `777`

### Reversal

- 期末资金: `1,379,682.57`
- 总收益率: `37.97%`
- 最大回撤: `-38.33%`
- Sharpe: `0.48`
- 交易日数: `777`

结论上，这次全量日线 VNpy 回测里，`reversal` 明显优于 `control`。

## 当前状态

到这一步，已经可以说：

- `VNpy` 的全量日线回测已经跑通
- control / reversal 两套策略都已经在 `VNpy Alpha` 中完成落地
- `QLIB -> AlphaLab -> 因子 -> 模型 -> signal -> 回测 -> JSON 总结` 这条链路已经闭环

## 仍然未完成的部分

当前仍然没有完成的是分钟级精确执行验证，也就是：

- `14:45` 买入
- 次日 `10:00` 卖出

原因不是代码框架完全不支持，而是还缺：

- 本地 `1m` 数据源
- 对应分钟级 `AlphaLab` 数据导出
- 在真实分钟行情上的最终验证

换句话说：

- 日线版已经完成
- 分钟级精确执行版还需要补数据

## 关联文档

本次工作的执行计划和过程记录在：

- `D:\QLIB\docs\plans\2026-03-28-vnpy-integration-csi1000-reversal.md`

如果后续继续推进分钟级版本，建议直接在现有 plan 基础上续写，而不是重新起一套平行文档。
