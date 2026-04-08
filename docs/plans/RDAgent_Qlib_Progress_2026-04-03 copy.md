# RDAgent + Qlib 全A股策略研究进展报告
**日期**: 2026-04-04（更新）  
**上次更新**: 2026-04-03  
**目标**: 使用 RDAgent + DeepSeek V3.2 + Qlib 研发全A股日频多因子策略，追求最大化年化收益

---

## 一、任务完成情况

### ✅ Phase 0: 数据准备（已完成）

**问题**: C盘 Qlib 数据严重过期（仅到 2020-09-25），无法支持 2023-2026 测试区间

**解决方案**:
1. 编写 `F:/Quant/artifacts/scripts/csv_to_qlib.py` 转换脚本
2. 从 `F:/BaiduNetdiskDownload/A股/A股解压器/output/1d/` 提取 CSV 数据
3. 转换为 Qlib 二进制格式，输出到 `E:/QLIBdata/qlib_fresh/cn_data/`

**遇到的风险及修复**:
- **风险**: CSV 中包含可转债等非股票证券（symbol 为 1, 10, 1201 等短代码），导致 6982 只"股票"中有 1487 只异常
- **修复**: 在 `symbol_to_qlib()` 函数中添加过滤逻辑：
  - 仅保留标准 A 股代码（SH: 600-605, 688-689; SZ: 000-003, 300-301）
  - 自动补齐前导零（"1" → "000001"）
  - 过滤掉可转债、ETF 等非股票证券

**最终结果**:
- ✅ 5,397 只 A 股（SH: 2440, SZ: 4542）
- ✅ 1,506 个交易日（2020-01-02 至 2026-03-24）
- ✅ 7 个字段：open, close, high, low, volume, amount, factor
- ✅ 数据验证通过（茅台 1407.33，宁德时代 396.99）

---

### ✅ Phase 0.5: Tushare 复权因子全量回填（已完成 — 2026-04-04 确认）

**任务**: 使用 `F:/Quant/artifacts/scripts/fetch_tushare_adj.py` 从 Tushare API 拉取每日复权因子

**进程**: PID 7924，启动于 2026-04-04 15:56:50，已正常退出

**结果**:
| 指标 | 数值 |
|------|------|
| 原始 CSV (`1d/`) | **1,506** 个交易日 |
| 复权因子 CSV (`1d_adj/`) | **1,506** 个交易日 |
| 匹配率 | **100%**（1:1 对应，无遗漏） |
| failures.csv | **未生成**（零失败） |

**数据分布**:
- 2020~2025 年：每年 12 个月目录，全部完成
- 2026-01：20 个交易日 ✅
- 2026-02：14 个交易日 ✅
- 2026-03：17 个交易日 ✅

**下一步**: 将复权因子合入 Qlib 二进制数据（当前 `factor` 字段为 1.0 占位符）

---

### ✅ Phase 1: RDAgent 配置更新（已完成）

**1. DeepSeek API Key 更新**
- 文件: `/home/hp/projects/RD-Agent/.env` (WSL)
- 更新: `DEEPSEEK_API_KEY=sk-1d42ebffcedf4028a4169aa39bbe9fcb`
- 模型: `deepseek/deepseek-chat` (通过 LiteLLM 后端)

**2. conf.py 参数调整**
文件: `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`

对 `ModelBasePropSetting`, `FactorBasePropSetting`, `QuantBasePropSetting` 三个类统一修改：

| 参数 | 旧值 | 新值 | 原因 |
|------|------|------|------|
| `provider_uri` | `/mnt/e/QLIBdata/.qlib/qlib_data/cn_data` | `/mnt/e/QLIBdata/qlib_fresh/cn_data` | 指向新数据 |
| `market` | `csi1000` | `all` | 全 A 股挖掘 |
| `benchmark` | `SZ000852` (中证1000) | `SH000300` (沪深300) | 更通用基准 |
| `topk` | `50` | `8` | 10万资金集中持仓 |
| `n_drop` | `3` | `1` | 小仓位少丢弃 |
| `account` | `10000000` | `100000` | 10万资金 |
| `evolving_n` | `10` | `20` | 更多迭代搜索 |
| `train_start` | `2015-01-01` | `2020-01-02` | 匹配数据起点 |
| `train_end` | `2020-12-31` | `2022-12-31` | 调整训练窗口 |
| `valid_start` | `2021-01-01` | `2023-01-01` | |
| `valid_end` | `2022-12-31` | `2024-06-30` | |
| `test_start` | `2023-01-01` | `2024-07-01` | |
| `test_end` | `2026-03-23` | `2026-03-24` | 匹配数据终点 |

**3. research_theme 更新**
```python
research_theme: str = (
    "All A-share daily alpha seeking maximum excess return. "
    "Explore reversal, momentum regime-switch, micro-cap anomaly, "
    "volume-price divergence, volatility breakout, and earnings surprise factors. "
    "Target concentrated portfolio (top 8) with daily rebalance. "
    "Prioritize sharp, high-conviction signals over broad diversification. "
    "Factors must use only daily OHLCV data."
)
```

**验证结果**:
```
provider_uri: /mnt/e/QLIBdata/qlib_fresh/cn_data
market: all
topk: 8
account: 100000
train: 2020-01-02 - 2022-12-31
valid: 2023-01-01 - 2024-06-30
test: 2024-07-01 - 2026-03-24
```

---

### ⚠️ Phase 1.5: .env 配置缺陷修复（待执行 — 2026-04-04 诊断）

**诊断来源**: 对照 RDAgent 官方文档 `https://rdagent.readthedocs.io/en/latest/installation_and_configuration.html` (v0.8.0)

**当前 `.env` 全文**:
```env
MAX_RETRY=10
RETRY_WAIT_SECONDS=20
BACKEND=rdagent.oai.backend.LiteLLMAPIBackend
CONDA_DEFAULT_ENV=rdagent

CHAT_MODEL=deepseek/deepseek-chat
EMBEDDING_MODEL=openai/BAAI/bge-m3

DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_API_KEY=sk-1d42ebffcedf4028a4169aa39bbe9fcb
OPENAI_API_BASE=http://172.20.64.1:18000/v1
OPENAI_API_KEY=local-bge-m3

LITELLM_CHAT_MODEL=deepseek/deepseek-chat
LITELLM_EMBEDDING_MODEL=openai/BAAI/bge-m3
LITELLM_PROXY_API_BASE=http://172.20.64.1:18000/v1
LITELLM_PROXY_API_KEY=local-bge-m3
```

#### 问题 1（P0 阻塞）: Embedding 服务未运行
- **现象**: `.env` 中 `OPENAI_API_BASE=http://172.20.64.1:18000/v1` 指向本地 embedding 服务，但 **Windows 端口 18000 当前无任何进程监听**
- **影响**: RDAgent 的因子描述生成、代码检索、知识库查询等均依赖 embedding，此为硬阻塞

- **修复方案 （本地 — 重启 TEI 容器）**:
  WSL 中已有 `ghcr.io/huggingface/text-embeddings-inference:1.5` 镜像（1.21GB），需重新启动容器并绑定 18000 端口

#### 问题 2（P1）: Embedding model 前缀错误
- **现象**: 当前使用 `EMBEDDING_MODEL=openai/BAAI/bge-m3`
- **官方文档要求**: 当 embedding 和 chat 使用不同 provider 时，**必须**加 `litellm_proxy/` 前缀而非 `openai/`
- **风险**: LiteLLM 路由可能将请求错误地发送到 OpenAI 官方端点，导致认证失败或模型不存在错误

#### 问题 3（P2）: 执行环境未显式配置
- **现象**: `.env` 未设置 `MODEL_COSTEER_ENV_TYPE`
- **官方文档**: 提供 `docker` 和 `conda` 两种模式
- **当前状态**: Docker daemon 在 WSL Ubuntu 中运行正常，`local_qlib:latest` 镜像已构建（10.7GB），无活跃容器（RDAgent 启动时会自动创建）
- **建议**: 显式添加 `MODEL_COSTEER_ENV_TYPE=docker`

#### 问题 4（P2）: 时间区间配置方式
- **现象**: 时间区间直接修改了 `conf.py` 源码
- **官方文档推荐**: 通过 `.env` 环境变量配置（不需要改源码）：
  ```env
  QLIB_FACTOR_TRAIN_START=2020-01-02
  QLIB_FACTOR_TRAIN_END=2022-12-31
  QLIB_FACTOR_VALID_START=2023-01-01
  QLIB_FACTOR_VALID_END=2024-06-30
  QLIB_FACTOR_TEST_START=2024-07-01
  QLIB_FACTOR_TEST_END=2026-03-24
  ```
- **影响**: 功能等价，但改源码会增加 git 冲突风险，升级 RDAgent 版本时需要重新合并

#### 修复后的完整 `.env`（推荐）:
```env
# === LLM Backend ===
BACKEND=rdagent.oai.backend.LiteLLMAPIBackend
MAX_RETRY=10
RETRY_WAIT_SECONDS=20

# === Chat Model: DeepSeek ===
CHAT_MODEL=deepseek/deepseek-chat
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_API_KEY=sk-1d42ebffcedf4028a4169aa39bbe9fcb

# === Embedding Model: SiliconFlow bge-m3 ===
EMBEDDING_MODEL=litellm_proxy/BAAI/bge-m3
LITELLM_PROXY_API_KEY=<替换为 SiliconFlow API Key>
LITELLM_PROXY_API_BASE=https://api.siliconflow.cn/v1

# === 执行环境 ===
MODEL_COSTEER_ENV_TYPE=docker
CONDA_DEFAULT_ENV=rdagent

# === 时间区间（Factor 场景）===
QLIB_FACTOR_TRAIN_START=2020-01-02
QLIB_FACTOR_TRAIN_END=2022-12-31
QLIB_FACTOR_VALID_START=2023-01-01
QLIB_FACTOR_VALID_END=2024-06-30
QLIB_FACTOR_TEST_START=2024-07-01
QLIB_FACTOR_TEST_END=2026-03-24
```

---

### ⚠️ Phase 2: RDAgent Factor Loop 启动（进行中，遇到问题）

**当前状态**: 遇到两个技术障碍（fire 冲突 + embedding 服务）

**问题 1: fire 库冲突**
使用 `fire.Fire(main)` 启动 `factor.py` 时报错：
```
AttributeError: 'FactorRDLoop' object has no attribute '_init_base_features'
```

**调试发现**:
1. ✅ `_init_base_features` 方法在 `RDLoop` 基类中存在
2. ✅ 直接实例化 `FactorRDLoop` 并调用该方法成功
3. ❌ 通过 `fire.Fire(main)` 调用时失败
4. ⏳ 绕过 `fire` 直接运行时，进程启动但无输出（可能在等待 DeepSeek API 响应）

**可能原因**:
- `fire` 库与 RDAgent 的 `LoopMeta` 元类交互问题
- Python 缓存问题（已清理 `__pycache__`，但问题依旧）
- 会话恢复逻辑与 `fire` 参数解析冲突

**问题 2: Embedding 服务不可用（2026-04-04 新发现）**
- 即使解决 fire 冲突，embedding 服务未运行也会导致 RDAgent 无法正常工作
- 详见上方 Phase 1.5 诊断

**当前尝试**:
- 后台运行直接 Python 调用（绕过 fire），等待 DeepSeek API 响应

---

## 二、环境状态快照（2026-04-04 17:30 UTC+8）

### WSL Ubuntu 环境
| 组件 | 状态 | 备注 |
|------|------|------|
| WSL Ubuntu | ✅ 已安装 | 非默认发行版（默认为 kali-linux） |
| Docker daemon | ✅ 运行中 | `systemctl is-active docker` → active |
| Docker 容器 | ⚠️ 无活跃容器 | 9 个历史容器均已退出（2 weeks ago） |
| `local_qlib` 镜像 | ✅ 已构建 | 10.7GB，含 Qlib 运行环境 |
| TEI embedding 镜像 | ✅ 已拉取 | `ghcr.io/huggingface/text-embeddings-inference:1.5`（1.21GB） |
| Ollama | ✅ 运行中 | PID 413，`/usr/local/bin/ollama serve` |
| RDAgent .env | ⚠️ 需修复 | Embedding 配置有误，详见 Phase 1.5 |

### Windows 环境
| 组件 | 状态 | 备注 |
|------|------|------|
| Tushare 回填 (PID 7924) | ✅ 已完成 | 1506/1506 交易日，零失败 |
| QLIB conda 环境 | ✅ 运行中 | PID 35492，自 2026-03-28 持续运行，CPU 12739s |
| Embedding 服务 (端口 18000) | ❌ 未运行 | WSL .env 依赖此端口，当前无监听 |
| Python 进程数 | 43 个 | 多数为 IDE/工具进程 |

---

## 三、架构优化建议

### 当前架构问题

F:\Quant 工作区在 2026-04-02 完成大规模迁移后，存在以下结构性问题：

1. **Git 仓库膨胀**：`repos/` 包含 6 个完整的第三方 git 仓库（QLIB, FinRL, vnpy, wondertrader, Mason, 综合自定义交易系统），每个都有完整 .git 历史
2. **Worktree 污染**：`worktrees/` 与知识库共享同一 git 根，导致每个 worktree 都包含全部 repos/、artifacts/ 等无关内容
3. **数据与代码混合**：`data/` 和 `artifacts/` 包含大量二进制数据和构建产物，虽然部分被 .gitignore 排除，但结构上仍混入代码仓库
4. **职责不清**：F:\Quant 既是知识库（kb/、docs/）、又是工作区（worktrees/）、又是数据仓库（data/）、又是构建系统（artifacts/）

### 目录职责分析

| 目录 | 当前职责 | 问题 |
|------|---------|------|
| `kb/`, `docs/`, `templates/` | 知识库核心 | ✅ 正确 |
| `strategies/`, `indicators/`, `research/` | 策略/指标/研究 | ✅ 正确 |
| `repos/` | 第三方仓库 | ❌ 6个完整git仓库混入 |
| `worktrees/` | Git worktree | ❌ 污染worktree环境 |
| `artifacts/` | 构建产物 | ❌ 二进制文件混入git |
| `data/` | 数据存储 | ❌ 大量二进制数据 |

### 短期修复（立即执行，不影响当前研究）

在不影响 RDAgent 研究的前提下，立即执行以下修复：

1. **修复 .gitignore**
   ```bash
   # 添加到 F:/Quant/.gitignore
   repos/
   artifacts/
   data/raw/
   data/cache/
   data/QLIBdata/
   ```

2. **移动 worktrees**
   ```bash
   # 将 worktrees/ 移到 .worktrees/（已在 .gitignore）
   mv F:/Quant/worktrees F:/Quant/.worktrees
   ```

3. **验证 git 状态**
   ```bash
   cd F:/Quant
   git status  # 应该不再显示 repos/, artifacts/, data/ 的变更
   ```

### 中期重构（Phase 5 后执行）

在 RDAgent 研究稳定后（Phase 2-4 完成），进行渐进式重构：

**推荐架构：三层分离**

```
F:/Quant/
├── kb/                    # 知识库（独立 git 仓库）
│   ├── notes/
│   ├── strategies/
│   ├── indicators/
│   └── docs/
│
├── workspace/             # 工作区（多个独立项目）
│   ├── qlib-research/     # QLIB研究（独立git）
│   ├── vnpy-strategies/   # vnpy策略（独立git）
│   └── finrl-drl/         # FinRL DRL（独立git）
│
├── repos/                 # 第三方仓库（只读参考，非git）
├── data/                  # 数据存储（非git）
└── artifacts/             # 构建产物（非git）
```

**迁移步骤**：

1. 创建新知识库仓库 `F:/Quant/kb-new/`，提取 kb/, docs/, templates/, strategies/, indicators/, research/
2. 为每个活跃项目创建独立工作区（如 qlib-research/）
3. 将当前 worktrees/QLIB/* 的内容迁移到对应工作区
4. 更新所有配置文件和脚本路径
5. 验证后删除旧结构

### 优先级

- **P0（立即）**：修复 .gitignore，防止 git 仓库继续膨胀
- **P1（Phase 5 后）**：渐进式重构，分离知识库和工作区
- **P2（长期）**：优化数据存储和构建产物管理

详细方案见：`C:\Users\HP\.claude\plans\soft-skipping-dawn.md`

---

## 四、下一步计划

### 立即（P0 — 解除 Phase 2 阻塞）

1. **修复 Embedding 服务**（二选一）
   - 方案 A（推荐）: 注册 SiliconFlow，获取 API Key，改用云端 `litellm_proxy/BAAI/bge-m3`
   - 方案 B: 在 WSL 中重启 TEI 容器：
     ```bash
     docker run -d -p 18000:80 ghcr.io/huggingface/text-embeddings-inference:1.5 \
       --model-id BAAI/bge-m3
     ```

2. **修正 `.env` 配置**
   - 修改 `EMBEDDING_MODEL` 前缀为 `litellm_proxy/`
   - 添加 `MODEL_COSTEER_ENV_TYPE=docker`
   - 详见 Phase 1.5 修复后的完整 `.env`

3. **验证 API 通路**
   - 在修复 embedding 后，先跑一个简单的 embedding + chat 测试确认 API 可达
   ```python
   from litellm import completion, embedding
   # 测试 chat
   resp = completion(model="deepseek/deepseek-chat", messages=[{"role":"user","content":"hello"}])
   # 测试 embedding
   emb = embedding(model="litellm_proxy/BAAI/bge-m3", input=["test"])
   ```

### 短期（解除阻塞后）

4. **解决 Factor Loop 启动问题**
   - 方案 A: 修改 `factor.py` 的 `main()` 函数，避免 `fire` 冲突
   - 方案 B: 编写独立启动脚本，直接调用 `FactorRDLoop`
   - 方案 C: 检查 RDAgent 版本，可能需要更新或回退

5. **合入复权因子**
   - Tushare 复权因子已全量拉取（1506 日），需更新 `csv_to_qlib.py` 将 `adj_factor` 合入 Qlib 二进制数据
   - 当前 `factor` 字段为 1.0 占位符，合入后可支持前/后复权计算

6. **监控首次运行**
   - 观察 DeepSeek API 调用是否成功
   - 检查 Qlib 数据加载是否正常
   - 验证因子生成和回测流程

### 中期（Phase 2-4）

**Phase 2: Factor Loop（预计 6-12 小时）**
- 运行 `--loop_n 5 --step_n 20`
- 生成 100+ 候选因子
- 筛选 IC > 0.03, ICIR > 0.3 的因子

**Phase 3: Model Loop（预计 4-8 小时）**
- 基于最佳因子集训练 ML 模型
- 探索 LightGBM, MLP, Transformer 等架构
- 优化 topk=8 的排序精度

**Phase 4: Quant Loop（预计 4-8 小时）**
- Bandit 算法联合优化因子+模型
- 追求测试集最大化收益

### 长期（Phase 5-6）

**Phase 5: VNPy 回测验证**
- 将最佳策略导出为 VNPy 格式
- 独立回测验证（2024-07-01 ~ 2026-03-24）
- 评估实盘可行性

**Phase 6: 迭代优化**
- 根据回测结果调整参数
- 控制过拟合和回撤
- 平衡收益与风险

---

## 五、风险警告与应对

### 已识别风险

| 风险类别 | 具体风险 | 应对措施 | 状态 |
|---------|---------|---------|------|
| **数据质量** | 原始数据过期 | ✅ 已更新到 2026-03-24 | 已解决 |
| **数据质量** | 包含非股票证券 | ✅ 添加过滤逻辑 | 已解决 |
| **数据质量** | 复权因子缺失 | ✅ Tushare 全量拉取完成（1506 日） | 已解决，待合入 |
| **配置缺陷** | Embedding 服务不可用 | ⏳ 改用 SiliconFlow 云端或重启本地 TEI | **P0 待修复** |
| **配置缺陷** | Embedding model 前缀错误 | ⏳ 改 `openai/` → `litellm_proxy/` | **P1 待修复** |
| **配置缺陷** | 执行环境未显式配置 | ⏳ 添加 `MODEL_COSTEER_ENV_TYPE=docker` | P2 待修复 |
| **技术障碍** | fire 库冲突 | ⏳ 尝试绕过 fire 直接调用 | 处理中 |
| **架构问题** | Git 仓库膨胀 | ⏳ 修复 .gitignore，排除 repos/artifacts/data | 待执行 |
| **架构问题** | Worktree 污染 | ⏳ 移动到 .worktrees/ | 待执行 |
| **API 限制** | DeepSeek API 配额/速度 | 监控 API 调用，必要时降低并发 | 待观察 |
| **过拟合** | 小 topk + 大量迭代 | 严格区分训练/验证/测试集 | 需警惕 |
| **目标不现实** | 800% 年化极度激进 | 已向用户说明，追求最大化但保持理性预期 | 已沟通 |
| **实盘滑点** | 小市值股票流动性差 | Phase 5 回测时评估，必要时调整选股范围 | 待评估 |

### 风险变更记录（2026-04-04）

**已关闭**:
- ~~复权因子缺失~~：Tushare 全量回填已完成，1506/1506 交易日，零失败

**新增**:
1. **Embedding 服务不可用（P0）**
   - 本地 TEI 服务（端口 18000）未运行，WSL .env 依赖此端口
   - RDAgent 所有需要 embedding 的环节均会失败

2. **Embedding model 前缀错误（P1）**
   - `openai/BAAI/bge-m3` 应为 `litellm_proxy/BAAI/bge-m3`
   - 官方文档明确要求不同 provider 时使用 `litellm_proxy/` 前缀

**降级**:
- WSL 环境稳定性：WSL Ubuntu 运行正常，Docker daemon 活跃，暂无风险信号

---

## 六、关键文件清单

### 数据文件
- **源数据**: `F:/BaiduNetdiskDownload/A股/A股解压器/output/1d/`（1506 个交易日 CSV）
- **复权因子**: `F:/BaiduNetdiskDownload/A股/A股解压器/output/1d_adj/`（1506 个交易日 CSV）✅ 新增
- **Qlib 数据**: `E:/QLIBdata/qlib_fresh/cn_data/`
  - `calendars/day.txt` (1506 行)
  - `instruments/all.txt` (5397 只股票)
  - `features/<symbol>/*.day.bin` (每只股票 7 个字段)

### 配置文件
- **RDAgent .env**: `/home/hp/projects/RD-Agent/.env` (WSL) ⚠️ 需修复
- **RDAgent conf.py**: `/home/hp/projects/RD-Agent/rdagent/app/qlib_rd_loop/conf.py`

### 脚本文件
- **数据转换**: `F:/Quant/artifacts/scripts/csv_to_qlib.py`
- **复权因子拉取**: `F:/Quant/artifacts/scripts/fetch_tushare_adj.py` ✅ 新增
- **Factor Loop 启动**: `/home/hp/start_factor_loop.sh` (WSL)

### Docker 镜像（WSL）
- `local_qlib:latest` — 10.7GB，Qlib 运行环境
- `ghcr.io/huggingface/text-embeddings-inference:1.5` — 1.21GB，BGE-M3 embedding 服务
- `pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime` — 7.6GB，PyTorch 基础镜像

### 输出目录
- **RDAgent 输出**: `$RDAGENT_OUTPUT_DIR` (默认 `/home/hp/rdagent-output`)
- **研究结果**: `E:/QLIBartifacts/rdagent/research_outputs/`
- **运行日志**: `E:/QLIBartifacts/rdagent/runs/`

---

## 七、关键指标与预期

### 当前基线（之前 CSI1000 反转策略）
- IC: 0.023
- ICIR: 0.22
- 年化超额: 5.18%
- 最大回撤: -45%

### 目标指标（全 A 股新策略）
| 指标 | 理想目标 | 现实预期 | 最低可接受 |
|------|---------|---------|-----------|
| 年化收益率 | 800%+ | 50-200% | 30% |
| 最大回撤 | < 20% | < 30% | < 40% |
| Sharpe Ratio | > 3.0 | > 2.0 | > 1.5 |
| IC | > 0.08 | > 0.05 | > 0.03 |
| ICIR | > 0.8 | > 0.5 | > 0.3 |
| 日均换手 | < 20% | < 30% | < 50% |

**坦诚说明**: 800% 年化对日频多因子选股极度激进，中国顶级量化基金年化超额约 20-40%。我们会全力优化，但需保持理性预期。极端收益通常伴随极端风险、过拟合、或小样本偶然性。

---

## 八、时间估算

| 阶段 | 预计耗时 | 依赖 | 状态 |
|------|---------|------|------|
| Phase 0（数据准备） | ✅ 已完成 | - | ✅ |
| Phase 0.5（复权因子回填） | ✅ 已完成 | Tushare API | ✅ 新增确认 |
| Phase 1（RDAgent 配置） | ✅ 已完成 | - | ✅ |
| Phase 1.5（.env 缺陷修复） | 0.5-1 小时 | SiliconFlow 注册 / TEI 重启 | ⏳ 新增 |
| Phase 2（Factor Loop） | 6-12 小时 | Phase 1.5 + fire 修复 | ⏳ 阻塞中 |
| Phase 3（Model Loop） | 4-8 小时 | Phase 2 完成 | 待开始 |
| Phase 4（Quant Loop） | 4-8 小时 | Phase 3 完成 | 待开始 |
| Phase 5（VNPy 回测） | 2-4 小时 | Phase 4 完成 | 待开始 |
| Phase 6（迭代优化） | 视结果而定 | Phase 5 完成 | 待开始 |

**总计**: 17-33 小时（不含迭代优化）

**当前阻塞点**: Phase 1.5（Embedding 服务 + .env 配置修复），解除后可进入 Phase 2

---

## 九、联系与支持

**问题反馈**:
- RDAgent 项目: https://github.com/microsoft/RD-Agent
- RDAgent 文档: https://rdagent.readthedocs.io/en/latest/installation_and_configuration.html
- Qlib 项目: https://github.com/microsoft/qlib
- VNPy 项目: https://github.com/vnpy/vnpy
- SiliconFlow（Embedding 服务）: https://siliconflow.cn

---

**报告生成时间**: 2026-04-03 15:15 (UTC+8)  
**最近更新时间**: 2026-04-04 ~17:40 (UTC+8)  
**更新内容**: Tushare 回填完成确认、Embedding 服务诊断、.env 配置缺陷分析、环境状态快照  
**下次更新**: Phase 1.5 修复完成后
