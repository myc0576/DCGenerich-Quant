# Quant Project Memory

> 自动生成于 2025-04-09 by Claude Code
> 记录项目的关键架构、配置和工作流程信息

---

## 项目概述

这是一个**个人量化知识库 + 可执行沙箱**项目，用于量化交易研究、策略开发和回测。

- **代码位置**: `D:\Quant`
- **数据位置**: `F:\DataCenter\` (USB移动硬盘)
- **WSL位置**: `D:\WSL` (Ubuntu)
- **操作系统**: Windows 11 + Git Bash

---

## 目录结构

| 路径 | 用途 |
|------|------|
| `kb/` | 精选知识笔记（稳定版，从 research 提升） |
| `research/` | 粗略实验/草稿 |
| `strategies/` | 策略规范（每个策略一个文件夹） |
| `indicators/` | 指标定义 + 实现代码 |
| `backtest/` | 回测运行器/适配器 |
| `scripts/` | 常用任务入口脚本 |
| `docs/` | 术语表、规范、计划 |
| `templates/` | 策略/指标/研究笔记模板 |
| `repos/` | 托管的 Git 仓库 |
| `artifacts/` | 构建/研究输出 |
| `compat/` | 兼容层（junction链接） |
| `worktrees/` | Git worktrees |

---

## 托管仓库 (repos/)

| 仓库名 | 用途 |
|--------|------|
| QLIB | Microsoft qlib 因子/模型研究 |
| FinRL | DRL 强化学习交易研究 |
| vnpy | vn.py 交易平台（含 QMT 券商集成） |
| wondertrader | WonderTrader C++ 框架 |
| Mason量化回测系统3 | Mason 回测系统（A股策略） |
| 综合自定义交易系统v5.6.8 | 自定义集成交易系统 |

---

## 命令速查

### Node/TypeScript
```bash
npm install              # 安装依赖 (ESM)
npm run kb:index         # 生成 kb/INDEX.generated.md
npm test                 # 运行测试
```

### Python
```bash
uv run python scripts/<file>   # 推荐（如有 uv）
python scripts/<file>           # 备选
```

---

## Codex 配置

配置文件：`.codex/config.toml`

```toml
model = "gpt-5.4"
model_reasoning_effort = "medium"

[features]
smart_approvals = false
```

### 切换模型到 DeepSeek

如需将模型切换到 DeepSeek，修改 `.codex/config.toml`：

```toml
model = "deepseek-r1"
# 或
model = "deepseek-coder"
```

前提：需要先在 Ollama 中拉取对应模型：
```bash
ollama pull deepseek-r1
ollama pull deepseek-coder
```

---

## 外部路径

| 路径 | 用途 |
|------|------|
| `D:/WSL` | WSL Ubuntu 根目录 |
| `D:/Quant/compat/qmt/live` | QMT 实盘环境 |
| `D:/Quant/compat/qmt/sim` | QMT 模拟环境 |
| `D:/Quant/compat/apps/mason` | Mason 桌面应用数据 |
| `F:/DataCenter/` | 大数据存储（USB硬盘） |

---

## 术语表

- **alpha**: 超越基准的超额收益
- **beta**: 风险因子暴露（通常是市场）
- **IC (information coefficient)**: 信号与未来收益的相关性
- **IR (information ratio)**: 均值(主动收益) / 标准差(主动收益)
- **Sharpe**: 均值(超额收益) / 标准差(超额收益)
- **max drawdown**: 最大峰值到谷值跌幅
- **turnover**: 每期交易的投资组合比例
- **slippage**: 执行价格 vs 中间价/收盘价的偏差

---

## 关键文档索引

### 计划文档 (docs/plans/)
- `2026-04-02-quant-workspace-architecture-migration.md` - 工作空间架构迁移
- `2026-04-06-rdagent-full-setup-plan.md` - RDAgent 完整设置计划
- `2026-04-06-qlib-dataset-merge.md` - Qlib 数据集合并

### 工作流笔记 (kb/workflows/)
- `infra/codex-sandbox-permission-debug.md` - Codex 沙箱权限调试
- `backtest/rdagent-qlib-smoke-provider-mount-and-timeout-debug.md` - RDAgent Qlib 调试
- `live/vnpy-qmt-formal-environment-and-account-fix.md` - vn.py QMT 环境修复

### 报告 (docs/reports/)
- `docker_setup_report.md` - Docker 设置报告
- `data_merge_report.md` - 数据合并报告

---

## 最近工作主题

1. **RDAgent + Qlib** - 因子挖掘和模型研究
2. **vn.py + QMT** - 实盘交易集成
3. **Mason 回测系统** - A股策略回测
4. **工作空间迁移** - 从 F:\Quant 拆分到 D:\Quant (代码) + F:\DataCenter (数据)

---

## 注意事项

1. **大数据不进 Git** - 只提交样本、架构和字典
2. **路径规范** - 代码用 `D:/Quant/...`，数据用 `F:/DataCenter/...`
3. **时间戳格式** - ISO-8601 with timezone
4. **价格格式** - float with currency
5. **收益格式** - decimal (0.01 = 1%)