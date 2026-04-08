> **STATUS: SUPERSEDED** — 被 `2026-04-04-d-f-drive-split-migration.md` 取代。
> 核心变更：F盘确认为USB移动硬盘，架构从"F盘一体化"改为"D=代码/F=数据"分离。

# F 盘量化工作区架构优化 Execution Plan

## Goal

将 F 盘从当前的"历史遗留 + 迁移残留 + 重复副本"混乱状态，优化为一个职责清晰、路径规范、数据管理现代化的量化研发 + 实盘交易工作区。同时恢复 RDAgent + Qlib 研究链路的可用性。

## Context

- 2026-04-02 完成了第一次大迁移（见 `2026-04-02-quant-workspace-architecture-migration.md`）：所有 git 仓库整合到 `F:/Quant/repos/`，WSL 迁移到 `F:/WSL`，旧兼容别名退役。
- 2026-04-03 启动了 DataCenter 现代化计划（见 `2026-04-03-datacenter-storage-modernization.md`）和 RDAgent 全A股研究计划（见 `RDAgent_Qlib_Progress_2026-04-03.md`），但均未完成。
- 当前 F 盘根目录仍有大量散落目录，包括 ~22GB 的 Mason 重复副本、死掉的综合交易系统副本、QMT 平台安装目录等。
- 用户确认：WSL 是主力开发环境，RDAgent 留在 WSL 内；数据方案采用 Parquet + SQLite + DuckDB（放弃原 MySQL 方案）；数据中心位于 `F:/DataCenter/`。
- 本 plan 是四个工作流的统一入口，取代 `2026-04-03-datacenter-storage-modernization.md` 中尚未启动的 Task。

## 磁盘空间

| 盘符 | 已用 | 空闲 |
|------|------|------|
| C: | 234 GB | 269 GB |
| D: | 9 GB | 191 GB |
| E: | 19 GB | 231 GB |
| F: | 624 GB | 1,239 GB |

F 盘空间充裕（1.2TB 空闲），不存在空间瓶颈。

## Constraints

- QMT 平台目录 (`gjqmt_link/`, `gjqmt_real_live/`) 原地不动，仅建立 compat 链接。
- 非量化文件（`本科遗留/`, `Microsoft/`, `Users/` 等）保持不变。
- OPENCLW 保持根目录独立。
- 所有破坏性操作（删除副本等）在验证后执行，先备份再清理。
- WSL 内项目（RDAgent 等）不移出 WSL，Windows 侧通过 `/mnt/f/` 互操作。
- 保留已完成的 4月2日迁移成果，不回退。

## Non-goals

- 重构任何业务仓库的代码内容。
- 迁移 WSL 内部的项目布局。
- 搬动非量化文件。
- 本次不执行数据导入（仅设计目录结构和契约）。
- 替换 MLflow 或 RD-Agent 运行时内部实现。
- 删除历史迁移日志（保留作为参考）。

## File Map

- `F:/Quant/docs/plans/2026-04-04-f-drive-architecture-optimization.md` — 本 plan
- `F:/Quant/docs/plans/2026-04-02-quant-workspace-architecture-migration.md` — 已完成的迁移 plan
- `F:/Quant/docs/plans/2026-04-03-datacenter-storage-modernization.md` — 被本 plan 取代的 DataCenter 草案
- `F:/Quant/docs/plans/RDAgent_Qlib_Progress_2026-04-03.md` — RDAgent 全A股研究 plan（继续生效）
- `F:/Quant/CLAUDE.md` — 工作区说明文档
- `F:/Quant/repos/Mason量化回测系统3/` — Mason 仓库（保留版本）
- `F:/Mason量化回测系统3/` — Mason 根目录重复副本（待删除）
- `F:/综合自定义交易系统v5.6.8/` — 综合交易系统根目录死副本（待删除）
- `F:/Quant/repos/综合自定义交易系统v5.6.8/` — 综合交易系统仓库（保留版本）
- `F:/gjqmt_link/` — QMT 测试环境（原地不动）
- `F:/gjqmt_real_live/` — QMT 生产环境（原地不动）
- `F:/Quant/compat/` — 兼容层
- `F:/DataCenter/` — 数据中心（待创建）
- `F:/Quant/data/QLIBdata/` — 现有 Qlib 数据（将被 DataCenter 取代）
- `F:/Quant/artifacts/scripts/csv_to_qlib.py` — CSV → Qlib 转换器
- `F:/Quant/artifacts/scripts/fetch_tushare_adj.py` — Tushare 复权因子拉取器
- `F:/mlruns/` — MLflow 实验数据（待迁入 artifacts）
- `F:/xtquant_official_compare/` — XTQuant SDK 快照（待迁入 repos/_references）

---

## Phase 1: 根目录清理与去重（释放 ~22GB，消除混淆）

### Task 1.1: 删除 Mason 根目录重复副本

**现状**: `F:/Mason量化回测系统3/` (~22GB) 和 `F:/Quant/repos/Mason量化回测系统3/` (~21GB) 是两份独立完整克隆，同一 HEAD (`7ae34d8`)，repos/ 版本有更多未提交的活跃修改。

**操作**:
1. 验证 `F:/Quant/repos/Mason量化回测系统3/` 的 git status 和工作树完整性
2. 将 `F:/Mason量化回测系统3/` 重命名为 `F:/Mason量化回测系统3.__archive_20260404`
3. 观察 1 天确认无依赖后删除归档副本

**验证**:
- `git -C "F:/Quant/repos/Mason量化回测系统3" status`
- `git -C "F:/Quant/repos/Mason量化回测系统3" log --oneline -3`
- 确认 `F:/Quant/compat/apps/mason` 链接指向 repos/ 版本（已确认）

**预期**: 释放 ~22GB，根目录少一个混淆目录。

### Task 1.2: 删除综合交易系统根目录死副本

**现状**: `F:/综合自定义交易系统v5.6.8/` 的 `.git` 目录为空，是死副本。唯一活跃的 git 仓库在 `F:/Quant/repos/综合自定义交易系统v5.6.8/`。

**操作**:
1. 验证 repos/ 版本完整性
2. 检查死副本中是否有 repos/ 版本缺少的文件（diff 对比）
3. 直接删除 `F:/综合自定义交易系统v5.6.8/`

**验证**:
- `git -C "F:/Quant/repos/综合自定义交易系统v5.6.8" status`
- 确认无唯一文件丢失

**预期**: 根目录少一个死副本目录。

### Task 1.3: 整理 xtquant_official_compare

**现状**: `F:/xtquant_official_compare/` 包含两个 XTQuant SDK 时间快照，供版本对比参考。

**操作**:
1. 移入 `F:/Quant/repos/_references/xtquant_official_compare/`

**验证**:
- 确认两个快照目录完整

**预期**: 根目录少一个散落目录，SDK 参考资料归入统一体系。

### Task 1.4: 整合 mlruns 到 artifacts

**现状**: `F:/mlruns/` 散落在根目录，应归入 `F:/Quant/artifacts/` 体系。

**操作**:
1. 移动 `F:/mlruns/` 到 `F:/Quant/artifacts/mlruns/`
2. 创建 junction `F:/mlruns → F:/Quant/artifacts/mlruns/`（兼容已有路径引用）

**验证**:
- 确认 MLflow 实验记录完整
- 如有 MLflow 配置引用此路径，确认 junction 兼容

**预期**: MLflow 数据纳入统一 artifacts 管理。

### Task 1.5: QMT 平台建立 compat 链接

**现状**: `F:/gjqmt_link/` (~1.1GB) 和 `F:/gjqmt_real_live/` (~1.1GB) 是 QMT 平台实体安装。当前 compat 层已有 `F:/Quant/compat/qmt/live → D:/国金证券QMT交易端` 和 `sim → D:/国金QMT交易端模拟`。

**操作**:
1. 在 compat 层补充 F 盘 QMT 链接：
   - `F:/Quant/compat/qmt/gjqmt_link → F:/gjqmt_link`
   - `F:/Quant/compat/qmt/gjqmt_real_live → F:/gjqmt_real_live`
2. 原目录保持不动

**验证**:
- 链接可正常访问

**预期**: 所有 QMT 相关路径统一通过 `F:/Quant/compat/qmt/` 发现。

### Task 1.6: 清理 F:/TRADE, F:/pickle_cache, F:/git_ignore_folder 等零散目录

**现状**: 根目录还有 `TRADE/`, `pickle_cache/`, `git_ignore_folder/`, `tmp/`, `userdata/` 等零散目录。

**操作**:
1. 调查每个目录的来源和用途
2. `TRADE/` — 如为交易相关数据，迁入 `F:/Quant/artifacts/` 或 `F:/DataCenter/`
3. `pickle_cache/` — 如为运行时缓存，迁入 `F:/Quant/data/cache/` 或直接清理
4. `git_ignore_folder/` — 调查来源后决定保留或清理
5. `tmp/` — 确认无活跃依赖后清理
6. `userdata/` — 调查来源后决定

**验证**:
- 每个目录处理前确认其用途和是否有外部依赖

**预期**: F 盘根目录只保留职责明确的顶层目录。

---

## Phase 2: DataCenter 数据中心建设

> 取代 `2026-04-03-datacenter-storage-modernization.md` 中的 Task 1-8（全部 PENDING）。
> 核心变更：数据方案从 Parquet + MySQL 改为 **Parquet + SQLite + DuckDB**。

### Task 2.1: 创建 DataCenter 目录结构

**操作**: 创建以下目录布局：

```
F:/DataCenter/
├── raw/                              # 不可变原始下载数据
│   ├── baidu_netdisk/                # 百度网盘下载归档
│   │   ├── a_share_1d/              # A股日线 CSV
│   │   ├── a_share_1m/              # A股分钟线 CSV（如有）
│   │   └── financial_statements/     # 财务数据 CSV
│   └── tushare/                     # Tushare API 拉取的原始数据
│       └── adj_factor/              # 复权因子（已有部分）
│
├── parquet/                          # 规范化 Parquet 数据（Single Source of Truth）
│   ├── daily/                       # 日线 OHLCV + factor
│   │   └── {instrument}.parquet     # 按股票分文件
│   ├── minute/                      # 分钟线（按年分区）
│   │   └── {instrument}/
│   │       └── {YYYY}.parquet
│   ├── fundamental/                 # 基本面/财务数据
│   │   ├── income.parquet
│   │   ├── balance.parquet
│   │   └── cashflow.parquet
│   ├── adj_factor/                  # 复权因子
│   │   └── daily_adj.parquet        # 全量复权因子表
│   └── universe/                    # 成分股/指数权重
│       ├── csi300.parquet
│       ├── csi500.parquet
│       ├── csi1000.parquet
│       └── all_a.parquet
│
├── qlib/                            # 派生: Qlib 二进制格式（从 Parquet 生成，可再生）
│   └── cn_data/
│       ├── calendars/
│       ├── instruments/
│       └── features/{symbol}/
│
├── operational/                     # SQLite 运营数据（替代 Excel）
│   ├── trading.db                   # 订单、成交、持仓
│   ├── metadata.db                  # 股票元信息、交易日历
│   └── backtest.db                  # 回测结果、评分
│
├── cache/                           # DuckDB 临时查询缓存
│   └── analytics.duckdb
│
├── manifests/                       # 数据血统与导入清单
│   ├── import_log.jsonl             # 每次导入的元数据记录
│   └── schema_registry.yaml         # 各数据集的 schema 定义
│
└── README.md                        # 数据中心说明文档
```

**列定义**（daily Parquet schema）:
| 列名 | 类型 | 说明 |
|------|------|------|
| date | date | 交易日期 |
| open | float64 | 开盘价（不复权） |
| high | float64 | 最高价 |
| low | float64 | 最低价 |
| close | float64 | 收盘价 |
| volume | float64 | 成交量（股） |
| amount | float64 | 成交额（元） |
| factor | float64 | 复权因子（前复权 = close * factor） |

**验证**: 目录结构完整创建。

### Task 2.2: 建立数据契约文档

**操作**: 在 `F:/DataCenter/manifests/schema_registry.yaml` 中定义每个数据集的契约：
- 列名、类型、精度
- 更新频率（daily / weekly / quarterly）
- 上游来源（Baidu Netdisk / Tushare / AKShare / QMT 实时）
- 下游消费者（Qlib / Mason / 综合交易系统 / vnpy）
- 数据质量检查规则

**验证**: schema_registry.yaml 内容覆盖所有一级数据集。

### Task 2.3: 建立 Parquet → Qlib 自动转换管道

**操作**:
1. 在 `F:/Quant/artifacts/scripts/` 下创建 `parquet_to_qlib.py`，从 Parquet 读取并生成 Qlib 二进制
2. 明确数据流向：`raw/ → parquet/ → qlib/`
3. Qlib 二进制视为可再生缓存，不纳入备份
4. 现有 `csv_to_qlib.py` 保留用于 Tushare 回填过渡期

**验证**:
- 脚本可从 `F:/DataCenter/parquet/daily/` 读取并写入 `F:/DataCenter/qlib/cn_data/`
- 生成的 Qlib 数据通过 `check_data_health.py` 验证

### Task 2.4: 建立 BaiduNetdiskDownload 迁移路径

**操作**:
1. 将 `F:/BaiduNetdiskDownload/A股/` 下的已解压数据归档到 `F:/DataCenter/raw/baidu_netdisk/`
2. 将 `F:/BaiduNetdiskDownload/A股-财务数据/` 归档到 `F:/DataCenter/raw/baidu_netdisk/financial_statements/`
3. 原 `F:/BaiduNetdiskDownload/` 保留作为百度网盘客户端的默认下载目录（不改客户端配置）
4. 建立定期同步脚本：新下载 → 归档到 raw/ → 触发 Parquet 转换

**验证**:
- raw/ 下的文件与原始下载内容一致（文件数量 + 抽样 hash）
- 原 BaiduNetdiskDownload 目录不受影响

### Task 2.5: 替换 F:/Quant/data/QLIBdata 的角色

**现状**: `F:/Quant/data/QLIBdata/` 目前包含 provider/canonical/feature/registry 结构和一份 Qlib 数据快照。`provider_roots.yaml` 仍指向已退役的 `E:/QLIBdata` 路径。

**操作**:
1. `F:/DataCenter/qlib/cn_data/` 成为新的规范 Qlib provider 路径
2. 更新 `F:/Quant/data/QLIBdata/registry/provider_roots.yaml` 指向新路径
3. `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data` 标记为历史快照，不再作为活跃 provider
4. WSL 侧通过 `/mnt/f/DataCenter/qlib/cn_data` 访问

**验证**:
- `provider_roots.yaml` 指向 `F:/DataCenter/qlib/cn_data`
- RDAgent `conf.py` 中的 `provider_uri` 同步更新为 `/mnt/f/DataCenter/qlib/cn_data`

### Task 2.6: 设计 Excel → SQLite 迁移方案

**现状**: Mason 和 综合交易系统 大量使用 `.xlsx` 文件存储持仓、订单、候选股等运营状态数据。

**操作**:
1. 盘点所有 `pd.read_excel` / `pd.to_excel` 调用点，按业务域分组
2. 为每个域设计 SQLite 表结构（trading.db / metadata.db / backtest.db）
3. 编写 Excel → SQLite 批量导入脚本
4. 设计适配层，使业务代码可以渐进式切换（先读 SQLite 降级到读 Excel）

**验证**:
- 每个 Excel 文件有对应的 SQLite 表映射
- 适配层设计文档完成

### Task 2.7: 设计 DuckDB 分析查询层

**操作**:
1. 创建 `F:/DataCenter/cache/analytics.duckdb`
2. 注册 Parquet 和 SQLite 数据源为 DuckDB external tables
3. 提供示例查询脚本（跨日线数据 + 持仓数据的联合查询）

**验证**:
- DuckDB 可直接查询 `F:/DataCenter/parquet/daily/*.parquet`
- DuckDB 可 ATTACH `F:/DataCenter/operational/trading.db` 并执行联合查询

---

## Phase 3: RDAgent + Qlib 研究链路恢复（与 Phase 1-2 并行）

> 此 Phase 继承 `RDAgent_Qlib_Progress_2026-04-03.md` 中的未完成任务。
> 该 plan 继续作为 RDAgent 执行细节的权威来源；本 plan 仅跟踪顶层依赖和状态。

### Task 3.1: 完成 Tushare 复权因子全量回填

**现状**: 4月4日启动的回填在 `F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/` 下运行，已完成 24 个交易日。回填器已修复 API 截断和不完整帧重试问题。

**操作**:
1. 检查回填进度，确认是否完成或需要恢复
2. 如未完成，使用 `--skip-existing` 恢复运行
3. 全量完成后验证日期覆盖率

**验证**:
- adj_factor CSV 覆盖 2020-01-02 至 2026-03-24 的所有交易日
- `failures.csv` 为空或无残留失败记录

**对应 RDAgent plan**: Task 3（data gate）

### Task 3.2: 重建 Qlib 数据侧车

**前置依赖**: Task 2.1（创建 `F:/DataCenter/qlib/` 目录）、Task 3.1（复权因子就绪）

**操作**:
1. 使用修复后的 `csv_to_qlib.py` 合并原始 OHLCV + Tushare 复权因子
2. 输出到 `F:/DataCenter/qlib/cn_data/`（新规范路径）
3. 运行 `check_data_health.py` 验证

**验证**:
- instruments 数量 >= 5397
- 日期覆盖 2020-01-02 ~ 2026-03-24
- factor 列非全 1.0（抽样检查含除权日的股票）

**对应 RDAgent plan**: Task 3（code gate）

### Task 3.3: 对齐 Provider 和运行时契约

**前置依赖**: Task 3.2

**操作**:
1. 更新 `provider_roots.yaml` → `F:/DataCenter/qlib/cn_data`
2. 更新 WSL 侧 RDAgent `conf.py` 的 `provider_uri` → `/mnt/f/DataCenter/qlib/cn_data`
3. 确认 `market=all`, `topk=8`, `account=100000`, 交易成本参数一致

**对应 RDAgent plan**: Task 4

### Task 3.4: 执行全A股 Factor Loop

**前置依赖**: Task 3.3

**操作**: 在 WSL 中通过 `run_factor_custom.py` 启动全A股因子循环，产出非零因子/信号证据。

**验证**:
- 新 research_outputs bundle 中 `rows_factors > 0`, `rows_signals > 0`
- 因子阶段 receipt `exit_code = 0`

**对应 RDAgent plan**: Task 5, 7, 8

---

## Phase 4: 工作区规范化（Phase 1 完成后）

### Task 4.1: 更新 CLAUDE.md

更新 `F:/Quant/CLAUDE.md` 反映新架构：
- 新增 `F:/DataCenter/` 路径说明及数据层级
- 更新数据流向说明（raw → parquet → qlib binary）
- 新增 DuckDB / SQLite 说明
- 标记 `F:/Quant/data/QLIBdata` 为历史快照

### Task 4.2: 清理旧的 worktree 引用

**操作**:
1. 检查 `F:/Quant/worktrees/QLIB/` 下的 worktree 哪些仍活跃
2. 归档已完成的 worktree 分支
3. 检查 `F:/Quant/.worktrees/` 下的 agent worktree 状态

### Task 4.3: 标记 DataCenter 现代化草案为 superseded

将 `2026-04-03-datacenter-storage-modernization.md` 顶部标注：

```
> **STATUS: SUPERSEDED** — 被 `2026-04-04-f-drive-architecture-optimization.md` Phase 2 取代。
> 核心变更：数据方案从 MySQL → SQLite + DuckDB。
```

### Task 4.4: 未来开源项目放置策略

| 项目类型 | 放置位置 | 示例 |
|----------|----------|------|
| 量化框架/库 | `F:/Quant/repos/` | qlib, FinRL, vnpy, wondertrader |
| SDK 参考/对比 | `F:/Quant/repos/_references/` | xtquant snapshots |
| WSL 内运行的 AI/ML | WSL `/home/hp/projects/` | RDAgent |
| 通用开发工具 | `F:/Quant/repos/` 或独立根目录 | 视规模决定 |
| 非量化项目 | 独立根目录 | OPENCLW |

---

## F 盘最终目标布局

```
F:/
├── Quant/                           # 主量化工作区（git 管理）
│   ├── repos/                       # 所有 git 仓库
│   │   ├── QLIB/
│   │   ├── FinRL/
│   │   ├── vnpy/
│   │   ├── wondertrader/
│   │   ├── Mason量化回测系统3/
│   │   ├── 综合自定义交易系统v5.6.8/
│   │   └── _references/             # SDK 快照等参考资料
│   │       └── xtquant_official_compare/
│   ├── worktrees/                   # 活跃 git worktrees
│   ├── artifacts/                   # 构建/研究产出 + MLflow
│   │   ├── QLIBartifacts/
│   │   └── mlruns/                  # ← 从 F:/mlruns 迁入
│   ├── compat/                      # 兼容层（junctions/symlinks）
│   │   ├── apps/mason
│   │   └── qmt/{live,sim,gjqmt_link,gjqmt_real_live}
│   ├── data/                        # 小样本 + schema（gitignored 大文件）
│   ├── kb/                          # 知识库
│   ├── research/                    # 实验
│   ├── strategies/                  # 策略规格
│   ├── scripts/                     # 工具脚本
│   └── docs/                        # 文档 + plans
│
├── DataCenter/                      # 数据中心（Parquet + SQLite + DuckDB）
│   ├── raw/                         # 不可变原始数据
│   ├── parquet/                     # 规范化数据（Single Source of Truth）
│   ├── qlib/                        # 派生 Qlib 二进制（可再生）
│   ├── operational/                 # SQLite 运营数据库
│   ├── cache/                       # DuckDB 查询缓存
│   └── manifests/                   # 数据契约 + 导入日志
│
├── WSL/                             # WSL2 存储根
│   └── Ubuntu/                      # 内含 RDAgent, Conda 环境等
│
├── OPENCLW/                         # 独立知识库 + MCP 服务器
│
├── gjqmt_link/                      # QMT 测试环境（原地不动）
├── gjqmt_real_live/                 # QMT 生产环境（原地不动）
│
├── BaiduNetdiskDownload/            # 百度网盘下载（客户端默认路径）
│
├── 本科遗留/                        # 保持不变
├── Microsoft/                       # 保持不变
├── Users/                           # 保持不变
└── .claude/                         # Droid 配置
```

## 数据流向架构

```
                    ┌─────────────────────────────────────┐
                    │         DATA SOURCES                 │
                    │  Baidu Netdisk / Tushare API /       │
                    │  AKShare / QMT实时数据               │
                    └──────────────┬──────────────────────┘
                                   │ 下载/拉取
                                   ▼
                    ┌─────────────────────────────────────┐
                    │    F:/DataCenter/raw/                │
                    │    不可变原始数据归档                 │
                    └──────────────┬──────────────────────┘
                                   │ 清洗 + 标准化脚本
                                   ▼
              ┌────────────────────────────────────────────────┐
              │    F:/DataCenter/parquet/                       │
              │    ★ Single Source of Truth ★                   │
              │    daily/ | minute/ | fundamental/ | adj_factor/│
              └───────┬──────────┬──────────┬─────────────────┘
                      │          │          │
          ┌───────────┘     ┌────┘          └────────────┐
          ▼                 ▼                             ▼
   ┌──────────────┐  ┌──────────────┐          ┌──────────────────┐
   │ Qlib binary  │  │ DuckDB/SQL   │          │ Pandas/Polars    │
   │ (派生缓存)    │  │ (分析查询)    │          │ (直接读取)        │
   │ DataCenter/  │  │ DataCenter/  │          │                  │
   │ qlib/cn_data │  │ cache/       │          │                  │
   └──────┬───────┘  └──────────────┘          └────────┬─────────┘
          │                                             │
    ┌─────┴──────┐                              ┌───────┴──────────┐
    │ RDAgent    │                              │ Mason 回测系统     │
    │ (WSL)      │                              │ 综合交易系统       │
    │ Factor/    │                              │ vnpy              │
    │ Model/     │                              │ QMT 实盘          │
    │ Quant Loop │                              │                   │
    └────────────┘                              └───────────────────┘
```

## 优先级与依赖关系

```
Phase 1 (根目录清理)          Phase 3 (RDAgent 恢复)
  Task 1.1 Mason 去重  ─┐       Task 3.1 Tushare 回填
  Task 1.2 综合系统去重  │         │
  Task 1.3 xtquant 整理 ├──→ Phase 4    Task 3.2 Qlib 重建
  Task 1.4 mlruns 整合  │   (规范化)      │
  Task 1.5 QMT 链接    ─┘             Task 3.3 Provider 对齐
  Task 1.6 零散目录                     │
                                   Task 3.4 Factor Loop
Phase 2 (DataCenter)
  Task 2.1 目录结构    ←──────────┘ (3.2 依赖 2.1 的 qlib/ 路径)
  Task 2.2 数据契约
  Task 2.3 转换管道     ← Task 2.1
  Task 2.4 BaiduNetdisk ← Task 2.1
  Task 2.5 QLIBdata 替换 ← Task 3.2
  Task 2.6 Excel→SQLite 方案
  Task 2.7 DuckDB 查询层 ← Task 2.1, 2.6
```

**并行策略**: Phase 1 和 Phase 3 的早期 Task 可立即并行启动。Phase 2 的 Task 2.1（创建目录）是 Phase 3 Task 3.2 的前置依赖。Phase 4 在 Phase 1 完成后执行。

## Risks

- Mason 根目录副本中可能有某些脚本硬编码了 `F:/Mason量化回测系统3/` 路径，删除后需要排查。
- Tushare 回填可能因为 API 限流需要较长时间，影响 Phase 3 进度。
- QMT 平台内部可能有注册表或配置引用当前绝对路径，建立 compat 链接时需验证。
- WSL 的 `/mnt/f/` 路径映射在跨系统操作时可能有权限或性能问题。
- 已有的 MLflow 配置可能硬编码 `F:/mlruns`，迁移后需要 junction 兼容。
- `F:/Quant/data/QLIBdata/registry/provider_roots.yaml` 仍指向已退役的 `E:/QLIBdata`，多处历史 artifacts 也引用 `/mnt/e/QLIBdata`，需要统一清理。
- Excel → SQLite 迁移涉及大量分散的 `pd.read_excel` / `pd.to_excel` 调用点，需要分波次推进。

## Decision Log

- 2026-04-04: 数据存储方案确定为 Parquet (canonical) + Qlib binary (derived) + SQLite (operational) + DuckDB (analytics)，放弃原 MySQL 方案。原因：单用户场景下 MySQL 运维开销过大，SQLite + DuckDB 零部署、性能足够。
- 2026-04-04: 数据中心位于 `F:/DataCenter/`，与代码工作区 `F:/Quant/` 平级但分离。原因：数据生命周期和备份策略不同于代码。
- 2026-04-04: Mason 根目录重复副本删除，保留 repos/ 版本。原因：repos/ 版本有更多活跃修改，compat 链接已指向 repos/。
- 2026-04-04: 综合交易系统根目录死副本直接删除。原因：.git 为空，非活跃仓库。
- 2026-04-04: QMT 平台目录原地不动，通过 compat 层建立链接。原因：QMT 可能有注册表或内部路径绑定，搬迁风险大。
- 2026-04-04: 开源项目按用途分散：量化相关 → `F:/Quant/repos/`，WSL 项目留 WSL，通用工具另行安排。
- 2026-04-04: OPENCLW 保持根目录独立。非量化文件保持不变。
- 2026-04-04: 本 plan 取代 `2026-04-03-datacenter-storage-modernization.md` 中全部 PENDING Task。

## Progress

- 2026-04-04: Plan 创建。通过三轮 AskUserQuestion 确认所有架构决策。

## Surprises

- `F:/Mason量化回测系统3/` 和 `F:/Quant/repos/Mason量化回测系统3/` 同一 HEAD 但各自独立完整克隆，合计 ~43GB。
- `F:/综合自定义交易系统v5.6.8/` 的 `.git` 目录为空（0 字节），是不完整的死副本。
- `F:/gjqmt_link/` 和 `F:/gjqmt_real_live/` 都是实体安装（各 ~1.1GB），不是 junction，`gjqmt_real_live` 含 `bin.x64/` 可执行文件。
- 社区调研结论：单用户量化场景下 ClickHouse/MySQL 属于过度工程，Parquet + SQLite + DuckDB 是更合适的栈。

## Verification Matrix

| Area | Command / Check | Status | Notes |
|------|----------------|--------|-------|
| Mason 根目录副本 | `Test-Path F:/Mason量化回测系统3`; `git -C "F:/Quant/repos/Mason量化回测系统3" status` | Pending | 待 Task 1.1 执行 |
| 综合交易系统死副本 | `Test-Path F:/综合自定义交易系统v5.6.8`; `.git` 为空已确认 | Pending | 待 Task 1.2 执行 |
| QMT compat 链接 | `Get-Item F:/Quant/compat/qmt/gjqmt_link`; `Get-Item F:/Quant/compat/qmt/gjqmt_real_live` | Pending | 待 Task 1.5 执行 |
| DataCenter 目录 | `Test-Path F:/DataCenter/parquet`; `Test-Path F:/DataCenter/qlib` | Pending | 待 Task 2.1 执行 |
| Provider 对齐 | `Get-Content F:/Quant/data/QLIBdata/registry/provider_roots.yaml` | Pending | 待 Task 2.5 / 3.3 执行 |
| Tushare 回填 | `ls F:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/*.csv \| wc -l` | In progress | 已完成 24 天 |
| Qlib 数据健康 | `python check_data_health.py --qlib_dir F:/DataCenter/qlib/cn_data` | Pending | 待 Task 3.2 执行 |
| MLflow 迁移 | `Test-Path F:/Quant/artifacts/mlruns`; `Get-Item F:/mlruns` is junction | Pending | 待 Task 1.4 执行 |
| CLAUDE.md 更新 | `Select-String -Path F:/Quant/CLAUDE.md -Pattern 'DataCenter'` | Pending | 待 Task 4.1 执行 |

## Outcome / Handoff

- Draft execution plan created on 2026-04-04.
- 本 plan 统一管理四个并行工作流：根目录清理、DataCenter 建设、RDAgent 恢复、工作区规范化。
- RDAgent 执行细节继续由 `RDAgent_Qlib_Progress_2026-04-03.md` 跟踪。
- `2026-04-03-datacenter-storage-modernization.md` 中的 PENDING Task 被本 plan Phase 2 取代。
- 推荐执行顺序：
  1. **立即并行**: Task 1.1-1.5 (清理) + Task 2.1 (创建 DataCenter 目录) + Task 3.1 (恢复 Tushare 回填)
  2. **回填完成后**: Task 3.2 (重建 Qlib 数据) → Task 3.3 (Provider 对齐) → Task 3.4 (Factor Loop)
  3. **清理完成后**: Task 4.1-4.3 (规范化)
  4. **中期推进**: Task 2.2-2.7 (数据契约、管道、Excel 迁移)
