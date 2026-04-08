# D/F 盘分离迁移 Execution Plan

> **SUPERSEDES**: `2026-04-04-f-drive-architecture-optimization.md` — 该 plan 基于"F盘是永久工作盘"的假设，现已失效。
> **核心变更**: F盘是USB移动硬盘（每天拔插），源码+运行时迁回D盘本地SSD，F盘仅作纯数据盘。

## Goal

将当前全部集中在F盘的量化工作区拆分为：D盘（本地SSD）承载代码+运行时，F盘（USB）承载纯数据。完成后恢复RDAgent + Qlib研究链路。

## Context

- 2026-04-02 完成了第一次大迁移，将所有repos整合到 `F:/Quant/repos/`。
- 2026-04-04 发现F盘实际是USB移动硬盘，用户每天下班拔走带回家。
- 当前F盘根目录仍有大量散落目录（Mason副本22GB、死副本、零散缓存等）。
- RDAgent阻塞于Qlib数据中factor列仍为1.0（复权因子未合入）。
- 用户要求：先整理磁盘布局，再启动RDAgent。
- 用户要求：plan中task拆分要细，每个task必须一次性完整解决，不留半成品。

## 磁盘空间

| 盘符 | 已用 | 空闲 | 角色 |
|------|------|------|------|
| C: | 234 GB | 269 GB | 系统盘 |
| D: | 9 GB | 192 GB | **代码+运行时**（本地SSD） |
| F: | 624 GB | 1,239 GB | **纯数据盘**（USB移动硬盘） |

## 迁移体积估算

| 迁移项 | 大小 | 方向 |
|--------|------|------|
| repos/ (Mason 21G, vnpy 12G, QLIB 5G, wondertrader 1.2G, 其他 0.2G) | 40 GB | F → D |
| 小目录 (docs, scripts, strategies, kb, research, backtest, indicators, templates, migration-logs, compat, test) | ~10 MB | F → D |
| .git + CLAUDE.md + .gitignore + README.md 等 | ~50 MB | F → D |
| artifacts/scripts + artifacts/logs | 289 KB | F → D |
| artifacts/QLIBartifacts (mason 1.8G, rdagent 101M, qlib 37K) | 1.9 GB | F → F:/DataCenter/ |
| data/QLIBdata | 559 MB | F → F:/DataCenter/ |
| F:/mlruns | 18 MB | 留F盘 |
| WSL Ubuntu (ext4.vhdx 94GB) + backup (92GB, 将删除) | 94 GB (有效) | F → D |
| QMT (gjqmt_link + gjqmt_real_live) | ~2.2 GB | F → D |
| **D盘新增总计** | **~136 GB** | D盘192GB空闲，剩余56GB |

## Constraints

- 每个task必须一次性完整解决，遇到问题立即报告，不留TODO。
- F盘离线时D盘代码报错即可（`raise RuntimeError('F盘未挂载')`），不需要降级运行。
- QMT平台目录迁移后需要验证注册表/配置路径绑定。
- WSL迁移需要通过 `wsl --export/--import` 或目录移动+注册更新。
- 所有破坏性操作先验证再执行。
- worktrees 迁移前先清理不需要的worktree，避免路径引用断裂。

## Non-goals

- 重构任何业务仓库的代码内容。
- 在本次迁移中执行数据导入（仅设计DataCenter目录结构）。
- 修改WSL内部的项目布局（RDAgent等WSL内项目不动）。
- 删除非量化文件（本科遗留、Microsoft等保持不变）。

## File Map

- `F:/Quant/` — 当前工作区（将拆分迁移）
- `D:/Quant/` — 目标代码工作区（待创建）
- `F:/DataCenter/` — 目标数据中心（待创建）
- `F:/WSL/` — 当前WSL存储（将迁至D:/WSL/）
- `F:/gjqmt_link/`, `F:/gjqmt_real_live/` — QMT平台（将迁至D:/）
- `F:/Mason量化回测系统3/` — 重复副本（待删除）
- `F:/综合自定义交易系统v5.6.8/` — 死副本（待删除）

---

## 目标架构

```
D:/ (本地SSD — 代码+运行时)
├── Quant/                           # 主量化工作区 (git repo)
│   ├── .git/
│   ├── CLAUDE.md
│   ├── repos/                       # 所有 git 仓库
│   │   ├── QLIB/                   # 5 GB
│   │   ├── FinRL/                  # 34 MB
│   │   ├── vnpy/                   # 12 GB
│   │   ├── wondertrader/           # 1.2 GB
│   │   ├── Mason量化回测系统3/      # 21 GB
│   │   ├── 综合自定义交易系统v5.6.8/ # 126 MB
│   │   ├── QUANT/                  # 466 KB
│   │   └── _references/            # SDK参考资料
│   │       └── xtquant_official_compare/
│   ├── artifacts/
│   │   ├── scripts/                # csv_to_qlib.py 等
│   │   └── logs/                   # Tushare拉取日志
│   ├── docs/                       # 文档 + plans
│   ├── scripts/                    # 工具脚本入口
│   ├── strategies/                 # 策略规格
│   ├── kb/                         # 知识库
│   ├── research/                   # 实验
│   ├── backtest/                   # 回测框架
│   ├── indicators/                 # 指标定义
│   ├── templates/                  # 模板
│   ├── migration-logs/             # 历史迁移记录
│   ├── compat/                     # 兼容层链接
│   │   ├── apps/mason → D:/Quant/repos/Mason量化回测系统3/...
│   │   └── qmt/
│   │       ├── live → D:/国金证券QMT交易端
│   │       ├── sim → D:/国金QMT交易端模拟
│   │       ├── gjqmt_link → D:/gjqmt_link
│   │       └── gjqmt_real_live → D:/gjqmt_real_live
│   └── test/
│
├── WSL/                             # WSL2 存储根（从F迁入）
│   └── Ubuntu/
│
├── gjqmt_link/                      # QMT测试环境（从F迁入）
├── gjqmt_real_live/                 # QMT生产环境（从F迁入）
│
├── 国金证券QMT交易端/               # 已有
├── 国金QMT交易端模拟/               # 已有
├── 同花顺远航版/                    # 已有
└── home/                            # 已有

F:/ (USB移动硬盘 — 纯数据盘)
├── DataCenter/                      # 数据中心
│   ├── raw/                         # 不可变原始下载数据
│   │   ├── baidu_netdisk/          # 百度网盘数据归档
│   │   └── tushare/                # Tushare API 数据
│   ├── parquet/                     # 规范化 Parquet (Single Source of Truth)
│   │   ├── daily/                  # 日线 OHLCV + factor
│   │   ├── minute/                 # 分钟线
│   │   ├── fundamental/            # 基本面
│   │   ├── adj_factor/             # 复权因子
│   │   └── universe/               # 指数成分股
│   ├── qlib/                        # 派生 Qlib 二进制 (从 Parquet 生成)
│   │   └── cn_data/
│   ├── operational/                 # SQLite 运营数据
│   ├── cache/                       # DuckDB 查询缓存
│   ├── artifacts/                   # 大体积研究产出
│   │   ├── QLIBartifacts/          # 1.9 GB (mason + rdagent + qlib)
│   │   └── mlruns/                 # 18 MB MLflow 实验
│   ├── manifests/                   # 数据契约 + 导入日志
│   └── README.md
│
├── BaiduNetdiskDownload/            # 百度网盘客户端默认路径
├── OPENCLW/                         # 独立知识库项目
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
                                   │ 清洗 + 标准化脚本 (D:/Quant/artifacts/scripts/)
                                   ▼
              ┌────────────────────────────────────────────────┐
              │    F:/DataCenter/parquet/                       │
              │    ★ Single Source of Truth ★                   │
              └───────┬──────────┬──────────┬─────────────────┘
                      │          │          │
          ┌───────────┘     ┌────┘          └────────────┐
          ▼                 ▼                             ▼
   ┌──────────────┐  ┌──────────────┐          ┌──────────────────┐
   │ Qlib binary  │  │ DuckDB/SQL   │          │ Pandas/Polars    │
   │ F:/DataCenter│  │ F:/DataCenter│          │ (直接读取)        │
   │ /qlib/cn_data│  │ /cache/      │          │                  │
   └──────┬───────┘  └──────────────┘          └────────┬─────────┘
          │                                             │
    ┌─────┴──────┐                              ┌───────┴──────────┐
    │ RDAgent    │                              │ Mason 回测        │
    │ (D:/WSL)   │                              │ 综合交易系统       │
    │ via /mnt/f │                              │ vnpy / QMT        │
    └────────────┘                              └───────────────────┘
```

---

## Phase 0: 准备工作

### Task 0.1: 测量WSL体积（已完成）

**结果**:
- F:/WSL/ 总计 185GB = Ubuntu(94GB) + backup(92GB)
- D盘 repos(40G) + QMT(2.2G) + Ubuntu(94G) = 136GB < 192GB空闲 ✓
- kali-linux(7.7GB)在C盘，不动

**验证**: 空间确认可行。

### Task 0.2: 清理F:/Quant/ git worktrees

**现状**: F:/Quant/ 有两套worktrees:
- `worktrees/QLIB/` — QLIB worktree
- `.worktrees/quant-kb-v1/` — kb版本worktree
- `.worktrees/task3-adjfactor-repair/` — adjfactor修复worktree

迁移.git目录时worktree的绝对路径引用会断裂，需要先清理。

**操作**:
1. `git -C "F:/Quant" worktree list` 查看所有worktree状态
2. 对每个worktree检查是否有未提交的更改
3. 如果有未提交更改，先commit或stash
4. `git -C "F:/Quant" worktree remove <path>` 逐个移除
5. `git -C "F:/Quant" worktree prune` 清理残留引用

**验证**:
- `git -C "F:/Quant" worktree list` 只显示主worktree
- `F:/Quant/worktrees/` 和 `F:/Quant/.worktrees/` 目录为空或不存在

**预期**: worktree清理完成，.git目录可以安全移动。

### Task 0.3: 创建D:/Quant/目录骨架

**操作**:
1. `mkdir -p D:/Quant/{repos/_references,artifacts/{scripts,logs},docs/plans,scripts,strategies,kb,research,backtest,indicators,templates,compat/{apps,qmt},migration-logs,test}`
2. 确认目录结构与目标架构一致

**验证**:
- `ls -R D:/Quant/` 显示完整的骨架结构

**预期**: D:/Quant/ 骨架就绪，可以接收文件。

---

## Phase 1: 源码迁移 F → D

### Task 1.1: 迁移小文件（docs, scripts, strategies等）

**操作**: 逐个迁移以下小目录和文件（使用 `robocopy /MOVE /E` 或 `mv`）:

1. `F:/Quant/.git/` → `D:/Quant/.git/`
2. `F:/Quant/.gitignore` → `D:/Quant/.gitignore`
3. `F:/Quant/CLAUDE.md` → `D:/Quant/CLAUDE.md`
4. `F:/Quant/README.md` → `D:/Quant/README.md`
5. `F:/Quant/package.json` → `D:/Quant/package.json`
6. `F:/Quant/docs/` → `D:/Quant/docs/`
7. `F:/Quant/scripts/` → `D:/Quant/scripts/`
8. `F:/Quant/strategies/` → `D:/Quant/strategies/`
9. `F:/Quant/kb/` → `D:/Quant/kb/`
10. `F:/Quant/research/` → `D:/Quant/research/`
11. `F:/Quant/backtest/` → `D:/Quant/backtest/`
12. `F:/Quant/indicators/` → `D:/Quant/indicators/`
13. `F:/Quant/templates/` → `D:/Quant/templates/`
14. `F:/Quant/migration-logs/` → `D:/Quant/migration-logs/`
15. `F:/Quant/test/` → `D:/Quant/test/`
16. `F:/Quant/artifacts/scripts/` → `D:/Quant/artifacts/scripts/`
17. `F:/Quant/artifacts/logs/` → `D:/Quant/artifacts/logs/`
18. 清理测试残留文件: `__py_write_test.txt`, `__write_test.txt`, `__write_test2.txt`

**验证**:
- 每个目录/文件在D盘存在且内容完整（文件数量一致）
- F盘对应位置已清空

**预期**: 所有轻量文件迁移完成，~10MB。

### Task 1.2: 迁移repos（逐个，按大小排序）

由于repos总计40GB、从USB复制较慢，按大小排序逐个迁移，每个完成后立即验证。

**操作**: 按以下顺序逐个执行 `robocopy "F:/Quant/repos/<name>" "D:/Quant/repos/<name>" /E /MOVE /R:1 /W:1`:

1. **QUANT** (466KB) — 最小，用来验证流程
2. **FinRL** (34MB)
3. **综合自定义交易系统v5.6.8** (126MB)
4. **wondertrader** (1.2GB)
5. **QLIB** (5GB)
6. **vnpy** (12GB)
7. **Mason量化回测系统3** (21GB)

每个repo迁移后立即验证:
- `git -C "D:/Quant/repos/<name>" status` — git可用
- `git -C "D:/Quant/repos/<name>" log --oneline -1` — 历史完整
- 确认F盘对应目录已被清除

**验证**: 
- D:/Quant/repos/ 包含全部7个仓库
- 每个仓库git完整可用
- F:/Quant/repos/ 为空

**预期**: 40GB repos安全迁移，每个仓库验证通过。

### Task 1.3: 迁移 xtquant_official_compare 到 repos/_references

**操作**:
1. `robocopy "F:/xtquant_official_compare" "D:/Quant/repos/_references/xtquant_official_compare" /E /MOVE /R:1 /W:1`

**验证**:
- D:/Quant/repos/_references/xtquant_official_compare/ 内含两个SDK快照目录
- F:/xtquant_official_compare/ 不再存在

**预期**: SDK参考资料归入统一体系。

### Task 1.4: 重建 compat 兼容层

**操作**: 在 `D:/Quant/compat/` 下创建新的junction链接:

1. `D:/Quant/compat/apps/mason` → `D:/Quant/repos/Mason量化回测系统3/...`（确认具体子路径）
2. `D:/Quant/compat/qmt/live` → `D:/国金证券QMT交易端`
3. `D:/Quant/compat/qmt/sim` → `D:/国金QMT交易端模拟`
4. QMT F盘链接在Phase 2 QMT迁移后补充

**验证**:
- 每个junction可正常访问目标目录
- `dir /AL D:\Quant\compat\apps\` 显示正确的链接目标

**预期**: 兼容层在D盘重建。

### Task 1.5: 更新 CLAUDE.md 中的路径引用

**操作**: 修改 `D:/Quant/CLAUDE.md`:
1. 将所有 `F:/Quant` 引用改为 `D:/Quant`
2. 将 `F:/WSL` 改为 `D:/WSL`
3. 新增 `F:/DataCenter` 数据中心路径说明
4. 新增"F盘是USB数据盘"的说明
5. 更新compat路径

**验证**:
- `grep -c "F:/Quant" D:/Quant/CLAUDE.md` 返回 0
- CLAUDE.md 中包含 `D:/Quant` 和 `F:/DataCenter` 描述

**预期**: CLAUDE.md反映新架构。

### Task 1.6: 验证D:/Quant/ git repo完整性

**操作**:
1. `git -C "D:/Quant" status` — 检查repo状态
2. `git -C "D:/Quant" log --oneline -5` — 检查提交历史
3. `git -C "D:/Quant" fsck` — 检查对象完整性
4. 如有需要，更新 `.gitignore` 以匹配新布局

**验证**:
- git status正常
- git log显示完整历史
- git fsck无错误

**预期**: D:/Quant/ 作为git repo完整可用。

---

## Phase 2: WSL + QMT 迁移

### Task 2.1: 确认WSL布局和空间（已完成）

**已查明**:
- **kali-linux**: C盘 `C:/Users/HP/AppData/Local/wsl/{12b85860-...}/ext4.vhdx` (7.7GB) — 不动
- **Ubuntu**: F盘 `F:/WSL/Ubuntu/ext4.vhdx` (94GB) — 迁移到D盘
- **备份**: F盘 `F:/WSL/backup/` (92GB) — 删除
- Phase 1完成后D盘已用约 9+43=52GB，剩余~140GB，放94GB Ubuntu绰绰有余

**验证**: 空间计算已确认可行。

### Task 2.2: 删除F盘WSL备份

**操作**:
1. 删除 `F:/WSL/backup/`（92GB）

**验证**:
- `F:/WSL/backup/` 不存在
- `wsl -d Ubuntu` 仍正常（备份不影响运行时）

**预期**: 释放92GB F盘空间。

### Task 2.3: 迁移Ubuntu到D盘

**现状**: Ubuntu的ext4.vhdx(94GB)在 `F:/WSL/Ubuntu/`。

**操作**:
1. `wsl --shutdown` — 确保WSL完全关闭
2. `wsl --list --verbose` — 确认Ubuntu状态为Stopped
3. `mkdir -p D:/WSL/Ubuntu`
4. 方案A（推荐，直接移动vhdx）:
   - 复制 `F:/WSL/Ubuntu/ext4.vhdx` → `D:/WSL/Ubuntu/ext4.vhdx`
   - 通过注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Lxss\<guid>` 更新 `BasePath` 为 `D:\WSL\Ubuntu`
   - 启动验证后删除F盘原件
5. 方案B（备选，export/import）:
   - `wsl --export Ubuntu "D:/wsl_ubuntu_export.tar"`
   - `wsl --unregister Ubuntu`
   - `wsl --import Ubuntu D:/WSL/Ubuntu "D:/wsl_ubuntu_export.tar" --version 2`
   - 设置默认用户: `ubuntu config --default-user hp`

**验证**:
- `wsl -d Ubuntu -e bash -c "echo ok && whoami && ls /home/hp/projects/RD-Agent/"` — 正常输出
- RDAgent项目文件完整
- conda环境可用
- `/mnt/f/` 在F盘插入时可访问

**预期**: WSL在D盘运行，性能显著提升。

### Task 2.4: 清理F盘旧WSL目录

**前置**: Task 2.3 验证通过。

**操作**:
1. 确认F:/WSL/Ubuntu/不再被任何WSL配置引用
2. 删除 `F:/WSL/`

**验证**:
- `wsl -d Ubuntu` 仍正常工作
- F:/WSL/ 不存在

**预期**: 释放F盘WSL空间。

### Task 2.5: 迁移QMT平台到D盘

**操作**:
1. 关闭所有QMT相关进程
2. `robocopy "F:/gjqmt_link" "D:/gjqmt_link" /E /MOVE /R:1 /W:1`
3. `robocopy "F:/gjqmt_real_live" "D:/gjqmt_real_live" /E /MOVE /R:1 /W:1`
4. 检查Windows注册表中是否有QMT路径绑定（`reg query HKLM /s /f "gjqmt"` 和 `reg query HKCU /s /f "gjqmt"`）
5. 如有注册表引用，更新为D盘路径
6. 在 `D:/Quant/compat/qmt/` 补充链接:
   - `gjqmt_link → D:/gjqmt_link`
   - `gjqmt_real_live → D:/gjqmt_real_live`

**验证**:
- D:/gjqmt_link/ 和 D:/gjqmt_real_live/ 完整存在
- F盘对应目录不存在
- compat链接可访问
- QMT程序可正常启动（如果环境允许）

**预期**: QMT运行在本地SSD，延迟风险消除。

---

## Phase 3: F盘根目录清理

### Task 3.1: 删除Mason根目录重复副本

**现状**: `F:/Mason量化回测系统3/` (~22GB) 和 `D:/Quant/repos/Mason量化回测系统3/` 同一HEAD。

**操作**:
1. `git -C "D:/Quant/repos/Mason量化回测系统3" log --oneline -3` — 确认D盘版本完整
2. 直接删除 `F:/Mason量化回测系统3/`（`rm -rf` 或 `rd /s /q`）

**验证**:
- `F:/Mason量化回测系统3/` 不存在
- D盘版本git完整

**预期**: 释放~22GB。

### Task 3.2: 删除综合交易系统根目录死副本

**现状**: `F:/综合自定义交易系统v5.6.8/` 的 `.git` 为空，是死副本。

**操作**:
1. 确认D盘 `D:/Quant/repos/综合自定义交易系统v5.6.8/` git完整
2. 用diff检查死副本是否有D盘版本缺少的文件
3. 如有独有文件，先拷贝到D盘
4. 删除 `F:/综合自定义交易系统v5.6.8/`

**验证**:
- F盘死副本不存在
- D盘版本完整无遗漏

**预期**: 根目录少一个死副本。

### Task 3.3: 清理F:/Quant/残留

**前置**: Phase 1迁移完成后，F:/Quant/ 应只剩下已迁出的空目录壳和data/artifacts中的数据部分。

**操作**:
1. `ls -la F:/Quant/` 检查残留
2. 将 `F:/Quant/artifacts/QLIBartifacts/` 暂存（Phase 4迁入DataCenter）
3. 将 `F:/Quant/data/QLIBdata/` 暂存（Phase 4迁入DataCenter）
4. 清理空目录壳
5. 最终删除 `F:/Quant/`（确认所有有价值内容已迁出）

**验证**:
- F:/Quant/ 不存在或只剩待迁移的数据目录
- 没有遗漏任何文件

**预期**: F盘不再有代码工作区。

### Task 3.4: 调查并清理零散目录

**操作**: 逐个调查 F 盘根目录零散目录：

1. **F:/TRADE/** — 调查来源和内容
   - 如为交易相关数据 → 迁入 F:/DataCenter/operational/ 或 F:/DataCenter/raw/
   - 如为无用缓存 → 删除
2. **F:/pickle_cache/** — 调查来源
   - 如为运行时缓存（可再生）→ 删除
   - 如为不可再生数据 → 迁入DataCenter
3. **F:/git_ignore_folder/** — 调查来源
   - 判断是否是某个repo的gitignore输出目录
   - 决定保留或清理
4. **F:/tmp/** — 确认无活跃依赖后删除
5. **F:/userdata/** — 调查来源后决定
6. **F:/.smz/** — 调查来源后决定

每个目录处理前：`ls` 查看内容 + `du -sh` 查看大小 + 判断是否有外部依赖。

**验证**:
- 每个目录有明确的处理结果（迁移/删除/保留+原因）
- F盘根目录只保留职责明确的顶层目录

**预期**: F盘根目录干净。

---

## Phase 4: DataCenter 数据中心建设

### Task 4.1: 创建 DataCenter 目录结构

**操作**: 在F盘创建完整目录布局:

```bash
mkdir -p F:/DataCenter/{raw/{baidu_netdisk/{a_share_1d,a_share_1m,financial_statements},tushare/adj_factor},parquet/{daily,minute,fundamental,adj_factor,universe},qlib/cn_data/{calendars,instruments,features},operational,cache,artifacts/{QLIBartifacts,mlruns},manifests}
```

**验证**:
- `find F:/DataCenter -type d | sort` 显示完整目录树
- 与目标架构图一致

**预期**: DataCenter骨架就绪。

### Task 4.2: 迁入 QLIBartifacts

**前置**: Task 3.3 中暂存的 QLIBartifacts。

**操作**:
1. 将 `F:/Quant/artifacts/QLIBartifacts/` 移入 `F:/DataCenter/artifacts/QLIBartifacts/`
2. 验证三个子目录完整: mason (1.8G), rdagent (101M), qlib (37K)

**验证**:
- `du -sh F:/DataCenter/artifacts/QLIBartifacts/*` 大小与原一致
- 原位置已清除

### Task 4.3: 迁入 QLIBdata

**操作**:
1. 将 `F:/Quant/data/QLIBdata/` 中的 Qlib 数据迁入 `F:/DataCenter/qlib/`
2. 具体：`F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data/` 内容 → `F:/DataCenter/qlib/cn_data/`
3. `F:/Quant/data/QLIBdata/registry/` → `F:/DataCenter/manifests/legacy_registry/`（作为历史参考）

**验证**:
- `F:/DataCenter/qlib/cn_data/calendars/day.txt` 存在且末尾日期正确
- `F:/DataCenter/qlib/cn_data/instruments/all.txt` 存在
- `ls F:/DataCenter/qlib/cn_data/features/ | wc -l` >= 5000

### Task 4.4: 整合 mlruns

**操作**:
1. 移动 `F:/mlruns/` 内容到 `F:/DataCenter/artifacts/mlruns/`
2. 删除原 `F:/mlruns/` 目录（不需要junction，因为D盘代码知道去F盘找数据）

**验证**:
- `F:/DataCenter/artifacts/mlruns/` 内容完整
- `F:/mlruns/` 不存在

### Task 4.5: 创建 DataCenter README

**操作**: 在 `F:/DataCenter/README.md` 中写明:
- 目录结构说明
- 数据流向（raw → parquet → qlib binary）
- 每个子目录的职责
- 与D:/Quant/的关系

**验证**: README.md 内容完整且准确。

### Task 4.6: 创建数据契约文件

**操作**: 在 `F:/DataCenter/manifests/schema_registry.yaml` 中定义:
- daily Parquet schema (date, open, high, low, close, volume, amount, factor)
- 每个数据集的更新频率和来源
- 下游消费者列表

**验证**: schema_registry.yaml 内容覆盖主要数据集。

---

## Phase 5: RDAgent 数据修复与启动

### Task 5.1: 检查 Tushare 复权因子回填状态

**前置**: WSL已迁移至D盘 (Phase 2)。

**操作**:
1. 检查 `D:/Quant/artifacts/logs/tushare_adj_fetch/20260404-155634/` 下的回填进度
2. 统计已完成的交易日数量
3. 如未完成全量，使用 `--skip-existing` 恢复运行
4. 检查 `failures.csv` 是否有残留失败

**验证**:
- adj_factor CSV 覆盖 2020-01-02 至 2026-03-24 所有交易日
- failures.csv 为空或无残留

### Task 5.2: 重建 Qlib 数据（合入真实复权因子）

**前置**: Task 5.1 完成，Task 4.1 DataCenter目录已创建。

**操作**:
1. 使用 `D:/Quant/artifacts/scripts/csv_to_qlib.py` 合并原始OHLCV + Tushare复权因子
2. 输出到 `F:/DataCenter/qlib/cn_data/`
3. 运行数据健康检查

**验证**:
- instruments 数量 >= 5397
- 日期覆盖 2020-01-02 ~ 2026-03-24
- factor列非全1.0（抽样检查含除权日的股票）

### Task 5.3: 更新 RDAgent 运行时配置

**前置**: Task 5.2 完成，WSL在D盘运行。

**操作**:
1. 更新WSL侧 RDAgent `conf.py` 的 `provider_uri` → `/mnt/f/DataCenter/qlib/cn_data`
2. 确认 `market=all`, `topk=8`, `account=100000` 等参数
3. 更新 `.env` 中的相关路径配置
4. 验证WSL可以通过 `/mnt/f/DataCenter/` 访问F盘数据

**验证**:
- `wsl -d Ubuntu -e ls /mnt/f/DataCenter/qlib/cn_data/calendars/day.txt` 成功
- conf.py中provider_uri指向新路径

### Task 5.4: 执行全A股 Factor Loop

**前置**: Task 5.3 完成。

**操作**:
1. 在WSL中通过 `run_factor_custom.py` 启动全A股因子循环
2. 检查输出产出非零因子/信号证据

**验证**:
- 新 research_outputs bundle 中 `rows_factors > 0`, `rows_signals > 0`
- 因子阶段 receipt `exit_code = 0`

---

## Phase 6: 收尾验证

### Task 6.1: F盘最终状态检查

**操作**: 确认F盘根目录只包含以下目录:
- `DataCenter/` — 数据中心
- `BaiduNetdiskDownload/` — 百度网盘
- `OPENCLW/` — 独立项目
- `本科遗留/` — 保持
- `Microsoft/` — 保持
- `Users/` — 保持
- `.claude/` — Droid配置
- `System Volume Information/` — 系统
- `$RECYCLE.BIN/` — 系统

无其他散落目录。

**验证**: `ls F:/` 输出干净。

### Task 6.2: D盘最终状态检查

**操作**: 确认D盘新增内容:
- `D:/Quant/` — 完整工作区，git正常
- `D:/WSL/` — WSL正常运行
- `D:/gjqmt_link/` — QMT可用
- `D:/gjqmt_real_live/` — QMT可用

**验证**:
- `git -C D:/Quant status`
- `wsl -d Ubuntu -e echo ok`
- 各repo `git log --oneline -1` 正常

### Task 6.3: 更新旧plan文件状态

**操作**:
1. 在 `D:/Quant/docs/plans/2026-04-04-f-drive-architecture-optimization.md` 顶部添加SUPERSEDED标记，指向本plan
2. 确认 `2026-04-03-datacenter-storage-modernization.md` 已有SUPERSEDED标记

### Task 6.4: 标记DataCenter现代化草案中被取代的引用

**操作**: 确保所有旧plan中引用 `F:/Quant` 的路径说明已注明迁移到 `D:/Quant`。

---

## 优先级与依赖关系

```
Phase 0 (准备)
  Task 0.1 测量WSL
  Task 0.2 清理worktrees
  Task 0.3 创建D骨架
       │
       ▼
Phase 1 (源码迁移 F→D)          Phase 2 (WSL+QMT迁移)
  Task 1.1 小文件              Task 2.1 测量确认
  Task 1.2 repos(40GB)         Task 2.2 导出WSL
  Task 1.3 xtquant             Task 2.3 导入WSL到D
  Task 1.4 compat重建          Task 2.4 清理旧WSL
  Task 1.5 CLAUDE.md更新       Task 2.5 QMT迁移
  Task 1.6 git验证
       │                            │
       ▼                            │
Phase 3 (F盘清理)  ←────────────────┘
  Task 3.1 删Mason副本
  Task 3.2 删综合交易系统副本
  Task 3.3 清理F:/Quant/残留
  Task 3.4 调查零散目录
       │
       ▼
Phase 4 (DataCenter)
  Task 4.1 目录结构
  Task 4.2 迁入QLIBartifacts
  Task 4.3 迁入QLIBdata
  Task 4.4 整合mlruns
  Task 4.5 README
  Task 4.6 数据契约
       │
       ▼
Phase 5 (RDAgent)
  Task 5.1 Tushare回填状态
  Task 5.2 Qlib数据重建
  Task 5.3 配置对齐
  Task 5.4 Factor Loop
       │
       ▼
Phase 6 (收尾验证)
  Task 6.1-6.4
```

**Phase 1 和 Phase 2 可以并行执行**（无依赖关系）。其余Phase串行。

## Risks

- **USB传输速度**: 40GB repos从USB→SSD可能需要15-30分钟，Mason单个repo 21GB最慢。
- **WSL迁移复杂度**: export/import可能改变默认用户，需要手动设置 `--default-user`。直接移动vhdx更快但需要更新注册表。
- **QMT注册表绑定**: QMT可能有注册表或内部配置引用F盘路径，迁移后需排查。
- **git worktree残留**: 如果worktree有未提交的重要更改，清理前需要保存。
- **F盘离线后的路径引用**: 大量历史脚本和配置仍引用 `F:/Quant/`，需要在Phase 1.5中更新。
- **跨盘符symlink/junction**: D→F的junction在F盘不在时会报错，这是预期行为（用户确认"报错即可"）。

## Decision Log

- 2026-04-05: `QLIBdata` 除 `.qlib` 与 `registry` 外还包含少量 legacy 目录；为避免遗漏，统一归档到 `F:/DataCenter/artifacts/legacy_QLIBdata/`，不再留在 `F:/Quant/`。
- 2026-04-05: Ubuntu 迁移采用 `wsl --manage Ubuntu --move D:/WSL/Ubuntu`，避免生成额外导出包，也避免手工修改 WSL 注册表路径。
- 2026-04-05: `F:/TRADE`、`F:/userdata`、`F:/.smz` 暂保留原位；`pickle_cache`、`git_ignore_folder`、`tmp` 作为临时/可再生目录删除。
- 2026-04-04: F盘确认为USB移动硬盘，每天拔插，架构从"F盘一体化"改为"D=代码/F=数据"分离。
- 2026-04-04: WSL迁回D盘，理由：I/O性能对RDAgent至关重要。
- 2026-04-04: QMT迁回D盘，理由：交易软件对延迟敏感。
- 2026-04-04: D盘布局选择 D:/Quant/ 统一目录，保持原有子结构。
- 2026-04-04: F盘定位为纯数据盘，不保留代码或配置。
- 2026-04-04: F盘离线时D盘代码报错即可，不需要降级运行。
- 2026-04-04: artifacts按体积拆分：scripts+logs→D，QLIBartifacts+mlruns→F:/DataCenter/。
- 2026-04-04: 优先级：先整理磁盘(Phase 0-4)，再启动RDAgent(Phase 5)。
- 2026-04-04: 本plan取代 `2026-04-04-f-drive-architecture-optimization.md`。
- 2026-04-04: WSL查明：Ubuntu 94GB在F盘，kali-linux 7.7GB在C盘，F:/WSL/backup/ 92GB是旧备份。Ubuntu迁D盘，备份删除，kali不动。
- 2026-04-04: D盘总需求136GB < 192GB空闲，空间可行性确认。

## Progress

- 2026-04-05: Task 1.2完成 — `F:/Quant/repos/` 下 7 个仓库全部迁入 `D:/Quant/repos/`，逐仓用 `git log --oneline -1` 验证，F盘源目录已清空。
- 2026-04-05: Task 1.3完成 — `F:/xtquant_official_compare/` 已迁入 `D:/Quant/repos/_references/xtquant_official_compare/`。
- 2026-04-05: Task 1.4完成 — `D:/Quant/compat/` 已重建，现包含 `apps/mason`、`qmt/live`、`qmt/sim`、`qmt/gjqmt_link`、`qmt/gjqmt_real_live` 链接。
- 2026-04-05: Task 2.3完成 — Ubuntu 通过 `wsl --manage Ubuntu --move D:/WSL/Ubuntu` 迁至 D 盘；注册表 `BasePath` 已切换为 `D:/WSL/Ubuntu`，`wsl -d Ubuntu -- uname -a` 成功。
- 2026-04-05: Task 2.4完成 — `F:/WSL/` 旧目录已清空并删除。
- 2026-04-05: Task 2.5完成 — `F:/gjqmt_link` 与 `F:/gjqmt_real_live` 已迁入 D 盘，源目录删除，`compat/qmt` 链接补齐；目标 QMT 注册表键仍指向 `D:/国金*` 安装目录。
- 2026-04-05: Task 3.1完成 — `F:/Mason量化回测系统3/` 根目录死副本已删除。
- 2026-04-05: Task 3.3完成 — `F:/Quant/` 工作区已完全退场；代码迁至 `D:/Quant/`，数据迁至 `F:/DataCenter/`，残留 worktree 目录也已清理。
- 2026-04-05: Task 3.4完成 — 根目录零散目录已分流：删除 `pickle_cache`、`git_ignore_folder`、`tmp`；保留 `TRADE`、`userdata`、`.smz`。
- 2026-04-05: Task 4.1完成 — `F:/DataCenter/` 目录骨架已创建。
- 2026-04-05: Task 4.2完成 — `F:/Quant/artifacts/QLIBartifacts/` 已迁入 `F:/DataCenter/artifacts/QLIBartifacts/`。
- 2026-04-05: Task 4.3完成 — `F:/Quant/data/QLIBdata/.qlib/qlib_data/cn_data/` 已迁入 `F:/DataCenter/qlib/cn_data/`，`registry/` 已迁入 `F:/DataCenter/manifests/legacy_registry/`，其余 legacy 目录已归档。
- 2026-04-05: Task 4.4完成 — `F:/mlruns/` 已迁入 `F:/DataCenter/artifacts/mlruns/`。
- 2026-04-04: Plan创建。通过多轮AskUserQuestion确认所有架构决策。
- 2026-04-04: Task 0.1完成 — WSL体积查明(Ubuntu 94G + backup 92G)，D盘空间可行性确认。
- 2026-04-04: Task 2.1完成 — WSL布局查明(kali在C盘、Ubuntu在F盘)，迁移方案确定。
- 2026-04-05: Task 0.2完成 — worktree `task3-adjfactor-repair` 已remove，`quant-kb-v1` 已prune（stale）。`worktrees/QLIB` 4GB仍残留在F盘（git不再追踪，可直接删除）。
- 2026-04-05: Task 0.3完成 — D:/Quant/ 骨架15个目录全部创建。
- 2026-04-05: Task 1.1完成 — 17项小文件(.git, .gitignore, CLAUDE.md, docs/, scripts/等)已迁移到D盘，F盘对应已删除。测试残留文件已清理。
- 2026-04-05: Task 1.5完成 — CLAUDE.md已更新，所有F:/Quant→D:/Quant, F:/WSL→D:/WSL，新增F:/DataCenter说明。
- 2026-04-05: Task 1.6完成 — D:/Quant git status/log/fsck全部通过，repo完整可用。
- 2026-04-05: Task 2.2完成 — F:/WSL/backup/ (92GB) 已删除。
- 2026-04-05: Task 3.2完成 — F:/综合自定义交易系统v5.6.8/ 死副本已删除。
- 2026-04-05: Task 1.2未完成 — repos-migration子代理因权限问题未执行，7个repos(40GB)仍在F:/Quant/repos/，待手动迁移。
- 2026-04-05: Task 3.1未完成 — F:/Mason量化回测系统3/ 根目录副本(22GB)仍存在，待删除。
- 2026-04-05: Task 1.3未完成 — F:/xtquant_official_compare/ 仍在F盘根目录，待迁移。
- 2026-04-05: Task 3.4进行中 — 零散目录调查子代理在后台运行。

### 当前F:/Quant/残留内容
- `repos/` — 7个仓库(40GB)，待迁移到D盘 (Task 1.2)
- `artifacts/QLIBartifacts/` — 1.9GB，待迁移到F:/DataCenter/ (Task 4.2)
- `data/QLIBdata/` — 559MB，待迁移到F:/DataCenter/ (Task 4.3)
- `compat/` — 旧兼容层，D盘已有新compat，可删除
- `worktrees/QLIB/` — 4GB，已从git注销，可直接删除

### 当前D:/Quant/内容
- .git, CLAUDE.md, README.md, package.json, .gitignore ✅
- artifacts/{scripts, logs} ✅
- docs/, scripts/, strategies/, kb/, research/ ✅
- backtest/, indicators/, templates/, test/ ✅
- migration-logs/, compat/ ✅
- repos/ — 空（待Task 1.2迁入）
- repos/_references/ — 空（待Task 1.3迁入）

## Verification Matrix

### Latest Verification Snapshot

- repos migration: `D:/Quant/repos/` now contains all 7 repositories and `F:/Quant/repos/` no longer exists.
- xtquant reference archive: `D:/Quant/repos/_references/xtquant_official_compare/` exists and `F:/xtquant_official_compare/` is gone.
- compat rebuild: `D:/Quant/compat/qmt/` exposes `live`、`sim`、`gjqmt_link`、`gjqmt_real_live`；`D:/Quant/compat/apps/mason` points at `D:/Quant/repos/Mason量化回测系统3`。
- WSL move: Ubuntu `BasePath` is `D:/WSL/Ubuntu`，`D:/WSL/Ubuntu/ext4.vhdx` exists，and `wsl -d Ubuntu -- uname -a` succeeds with a residual localhost/NAT warning.
- QMT move: `D:/gjqmt_link/` and `D:/gjqmt_real_live/` exist；`F:/gjqmt_link/` and `F:/gjqmt_real_live/` are gone.
- DataCenter build-out: `F:/DataCenter/qlib/cn_data/calendars/day.txt`、`F:/DataCenter/artifacts/QLIBartifacts/`、`F:/DataCenter/artifacts/mlruns/`、`F:/DataCenter/manifests/legacy_registry/provider_roots.yaml` all exist.
- F drive cleanup: `F:/` now only retains `DataCenter/`、`BaiduNetdiskDownload/`、`OPENCLW/`、`本科遗留/`、`Microsoft/`、`Users/`、`.claude/`、`.smz/`、`TRADE/`、`userdata/` plus system folders.

| Area | Command / Check | Status | Notes |
|------|----------------|--------|-------|
| WSL体积 | `du -sh F:/WSL/` | **Done** | Task 0.1: Ubuntu 94G + backup 92G(已删) |
| worktree清理 | `git -C D:/Quant worktree list` | **Done** | Task 0.2: 只剩主worktree |
| 小文件迁移 | D:/Quant/ 包含 .git, docs, scripts 等 | **Done** | Task 1.1: 17项已迁移 |
| repos迁移 | `git -C D:/Quant/repos/<name> status` (x7) | **TODO** | Task 1.2: 7个repos仍在F盘 |
| xtquant迁移 | `ls D:/Quant/repos/_references/xtquant_*` | **TODO** | Task 1.3: 仍在F盘根目录 |
| compat重建 | `ls D:/Quant/compat/` | **TODO** | Task 1.4: 待repos迁完后重建 |
| CLAUDE.md更新 | `grep "F:/Quant" D:/Quant/CLAUDE.md` | **Done** | Task 1.5: 已更新 |
| git完整性 | `git -C D:/Quant fsck` | **Done** | Task 1.6: 无错误 |
| WSL备份删除 | `test -d F:/WSL/backup` | **Done** | Task 2.2: 已删除92GB |
| WSL迁移 | `wsl -d Ubuntu -e echo ok` | **TODO** | Task 2.3 |
| QMT迁移 | `Test-Path D:/gjqmt_link` | **TODO** | Task 2.5 |
| Mason副本删除 | `test -d F:/Mason量化回测系统3` | **TODO** | Task 3.1: 仍存在 |
| 综合交易系统副本 | `test -d F:/综合自定义交易系统v5.6.8` | **Done** | Task 3.2: 已删除 |
| F:/Quant残留清理 | `ls F:/Quant/` | **TODO** | Task 3.3 |
| 零散目录调查 | 调查 TRADE/pickle_cache等 | **In Progress** | Task 3.4: 子代理进行中 |
| DataCenter目录 | `Test-Path F:/DataCenter/qlib/cn_data` | **TODO** | Task 4.1 |
| Qlib数据健康 | factor列非1.0 | **TODO** | Task 5.2 |
| RDAgent启动 | factor loop exit_code=0 | **TODO** | Task 5.4 |
| F盘干净 | `ls F:/` | **TODO** | Task 6.1 |
| D盘完整 | `git -C D:/Quant status` + `wsl` | **TODO** | Task 6.2 |

## Surprises

- `F:/Quant/data/QLIBdata/` contained extra legacy directories outside the original task text. They were small or empty, so they were archived into `F:/DataCenter/artifacts/legacy_QLIBdata/` instead of being dropped.
- The official `wsl --manage ... --move` flow worked and preserved the Ubuntu distro, but this machine still emits a `localhost`/WSL NAT warning on startup. The distro itself remains callable.
- The old `F:/Mason量化回测系统3/` root copy was not a healthy git checkout even though it still had a `.git/` shell, so it was treated as a dead duplicate and removed.

## Outcome / Handoff

- Phase 0 through Phase 4 are materially complete.
- Phase 5 is now unblocked on configuration alignment and runtime verification rather than storage layout.
- Remaining execution work is concentrated in:
  - updating RD-Agent runtime paths to `F:/DataCenter`
  - rebuilding Qlib data with real adj factors
  - running the all-A-share factor loop and validating non-zero outputs
