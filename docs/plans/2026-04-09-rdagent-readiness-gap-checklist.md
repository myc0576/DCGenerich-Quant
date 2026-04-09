# RD-Agent Readiness Gap Checklist Execution Plan

## Goal

把当前 RD-Agent 在 `merged provider + Docker GPU + qlib loop` 路径上的 readiness 缺口整理为一份可执行 checklist，明确“哪些条件已具备、哪些测试/数据/结构仍缺失、按什么顺序补齐”，用于决定何时可以安全启动全量策略研究生成。

## Context

- 本文件是对既有执行计划 `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md` 的聚焦补充，不替代其 Phase 历史记录。
- 截至 2026-04-09，当前证据显示：
  - `cn_data_merged`、benchmark 修正、CSI instruments 边界修正、GPU Docker runtime 升级、`.env` 长窗口 override 已基本就位。
  - `fin_factor` 已有完整 smoke 证据，可到 `feedback`。
  - `fin_model` 已进入真实 CUDA 训练，但在 `running_timeout_period=600` 秒时被 kill。
  - `fin_quant` 最新证据仍停在 `coding`，尚未形成 `running` 期证据。
  - Phase 5-6 所需的 deep-loop / promotion / candidate packaging 文档和目录多数仍不存在。
- 2026-04-09 的短验证补充发现：
  - `conda run -n rdagent pytest ...` 不是稳定入口，容易落到 base env 的 `pytest`。
  - `rdagent` conda 环境可 import `psutil`，但 `python -m pytest` 直接报 `No module named pytest`，说明测试依赖未安装到目标环境。
  - `test/qlib/test_model_template_config.py` 仍按旧的 `/mnt/e/.../cn_data + csi1000` 合同断言，和当前 merged/all-market runtime 已漂移。
  - `artifacts/research_reports/` 仅有骨架目录，`strategy_candidates/` 及 Phase 5-6 文档尚未建立。

## Constraints

- 不回滚、不覆盖 `D:\Quant` 或 `RD-Agent` 当前未提交实验改动。
- 优先复用现有日志、报告、测试与目录结构，不无意义重跑长任务。
- 仅把 checklist 写成执行文档；本轮不直接修复 timeout、long-coding 或数据问题。
- 所有 gap 定义都必须带验证方式，避免“看起来差不多可用”的主观判断。
- 保持与现有主计划、现有日志路径和现有 artifact 命名兼容。

## Non-goals

- 本轮不启动新的 20+ loop 深跑。
- 本轮不做 QMT / vnpy 接入。
- 本轮不处理实时数据、分钟级数据或实盘部署。
- 本轮不重构 RD-Agent 全部模板或测试体系，只定义当前 readiness 缺口与关闭顺序。

## File Map

- `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  当前 readiness gap checklist。
- `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md`
  当前主执行计划与 phase 状态来源。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\.env`
  当前 runtime canonical windows 与 provider 配置。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\conf.py`
  qlib loop 参考默认值。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\components\coder\model_coder\conf.py`
  `fin_model` smoke timeout 当前入口。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\utils\env.py`
  Docker/Conda env timeout 与 mount 逻辑。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\model_template\conf_baseline_factors_model.yaml`
  baseline model 模板，当前仍保留旧默认合同。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\model_template\conf_sota_factors_model.yaml`
  SOTA model 模板，当前仍保留旧默认合同。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\pyproject.toml`
  pytest 配置与 optional dependency 入口。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\requirements\test.txt`
  测试依赖定义，当前 env 未完全安装。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_env_config.py`
  当前 Docker mount 回归测试。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_csi_instrument_alignment.py`
  当前 instrument/calendar 边界回归测试。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_runtime_window_alignment.py`
  当前 `.env` override 回归测试。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_benchmark_provider_contract.py`
  当前 benchmark/provider 合同测试。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_template_config.py`
  当前已漂移的 model template 测试。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-15-39-972748\`
  最新 `fin_model` timeout 证据。
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-27-58-215656\`
  最新 `fin_quant` 停留在 coding 的证据。
- `D:\Quant\artifacts\research_reports\`
  现存 sidecar 骨架目录。
- `D:\Quant\artifacts\strategy_candidates\`
  计划中的策略候选产物目录，当前缺失。
- `D:\Quant\docs\reports\factor_evolution_log.md`
- `D:\Quant\docs\reports\model_evolution_log.md`
- `D:\Quant\docs\reports\quant_evolution_log.md`
- `D:\Quant\docs\strategies\rdagent_best_strategy.md`
- `D:\Quant\docs\reports\research_report_sources.md`
  Phase 5-6 计划中的文档产物，当前均缺失。

## Risks

- `fin_model` 已进入真实训练，若继续沿用 600 秒 smoke timeout，会反复产生“启动成功但证据链不闭合”的假就绪状态。
- `fin_quant` 仍未进入 `running`，如果直接启 20+ loop，会把 coding 耗时误当成 runtime readiness。
- model template 默认值仍停留在旧合同，未来维护者容易误判“模板默认值 = 当前运行合同”。
- 测试入口不稳定，当前 `pytest`/`python -m pytest` 在不同 env 下结果不一致，导致 readiness 结论不可复验。
- `F:` 外置数据盘仍是单点故障；一旦长跑期间断连，checkpoint 与候选结果都可能丢失。
- 当前 artifact/doc 结构未成型，即使跑出结果，也没有统一的 checkpoint、candidate 和 promotion 落点。

## Task Breakdown

- [x] Task 1: Stabilize the canonical RD-Agent verification environment
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\pyproject.toml`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\requirements\test.txt`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\README.md`, `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  Change: 明确唯一测试入口为 `PYTHONPATH=. conda run -n rdagent python -m pytest ...`，并把 `pytest`/coverage 等 test extras 实际安装到 `rdagent` env；若当前团队依赖 `requirements/test.txt`，则补一条标准化安装命令或 make target。
  Verify: `conda run -n rdagent python -m pytest test/qlib/test_model_env_config.py -q` 能在 `rdagent` env 中收集并执行，不再依赖 base env 的 `pytest`。
  Expected: 所有 readiness 结论都能用单条命令复验，不再受 shell PATH 偏差影响。

- [x] Task 2: Repair stale qlib template tests and decide the canonical template contract
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_template_config.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\model_template\conf_baseline_factors_model.yaml`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\scenarios\qlib\experiment\model_template\conf_sota_factors_model.yaml`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\conf.py`
  Change: 决定 model template 的默认值究竟继续保留旧 `csi1000` 合同，还是升级为当前 merged/all-market 合同；随后把测试断言和模板默认值对齐，消除“运行时靠 override 跑通，但模板层仍旧漂移”的状态。
  Verify: `test_model_template_config.py` 对当前被接受的合同全部通过，且失败时能准确暴露模板/运行时漂移。
  Expected: 模板层与 runtime 层的语义关系清晰，不再出现“半通过、半漂移”的伪稳定状态。

- [x] Task 3: Add parity bootstrap and dotenv tests for model and quant entrypoints
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\model.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\quant.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_entrypoint_bootstrap.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_quant_entrypoint_bootstrap.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_env_config.py`
  Change: 按照现有 factor bootstrap 测试思路，为 model/quant 增加 package-root 注入、`.env` 提前加载、当前 checkout 优先于 site-packages 的回归测试。
  Verify: 新测试能证明 `python -m rdagent.app.cli fin_model ...` 与 `fin_quant ...` 在当前 repo checkout 下运行，并正确读取 `.env`。
  Expected: factor/model/quant 三条入口链路在 bootstrap 保障上对齐。

- [ ] Task 4: Close the `fin_model` smoke success-path beyond the 600-second timeout
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\components\coder\model_coder\conf.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\utils\env.py`, `D:\Quant\docs\reports\model_evolution_log.md`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\`
  Change: 为 model smoke 明确一个可复验的 launch gate：要么提高 `running_timeout_period`，要么降低 smoke 的训练预算/epoch 数；目标不是长跑，而是拿到一次当前 merged-data 合同下的成功 `running -> feedback` 证据。
  Verify: 生成一个新的 `fin_model` 日志目录，包含 `Loop_0/running` 与 `Loop_0/feedback`，且 feedback 不再以 timeout 为失败原因。
  Expected: `fin_model` 从“能启动训练”升级到“能完成一次 smoke 成功路径”。

- [ ] Task 5: Force `fin_quant` to reach `running` before any deeper readiness claim
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\quant.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\components\coder\model_coder\conf.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\components\coder\factor_coder\config.py`, `D:\Quant\docs\reports\quant_evolution_log.md`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\`
  Change: 给 quant smoke 增加 long-coding 控制手段，例如限制 coding budget、复用已有 workspace、缩短单轮搜索空间；目标是先进入 `running`，再判断是否还有独立 runtime/data blocker。
  Verify: 新日志目录下出现 `Loop_0/running`，或者至少形成结构化证据说明为何不能进入 running。
  Expected: `fin_quant` 的 blocker 被从“猜测”升级为“有运行期证据的事实”。

- [x] Task 6: Create deep-loop checkpoint artifacts and abort criteria before any 20+ loop run
  Files: `D:\Quant\docs\reports\factor_evolution_log.md`, `D:\Quant\docs\reports\model_evolution_log.md`, `D:\Quant\docs\reports\quant_evolution_log.md`, `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md`, `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  Change: 建立 factor/model/quant 三份 evolution log 模板，定义启动条件、checkpoint cadence、日志路径、失败回滚、人工介入条件。
  Verify: 每条长跑路径都至少有 5-loop checkpoint 规则、结果记录字段、停止条件和 owner。
  Expected: deep-loop 不再是“无人看管的长命令”，而是可观察、可中断、可接力的执行过程。

- [x] Task 7: Create strategy-candidate packaging and promotion documents
  Files: `D:\Quant\artifacts\strategy_candidates\`, `D:\Quant\docs\strategies\rdagent_best_strategy.md`, `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  Change: 建立候选策略目录、命名规则、最小元数据、评分字段与 top-N 晋级规则，明确 annualized return / Sharpe / max drawdown / turnover / stability 的 gate。
  Verify: 目录存在、文档存在、至少有一个样例 candidate schema；文档中存在“未满足任一 gate 时禁止晋级”的规则。
  Expected: 全量研究生成的产物有稳定落点，避免“跑完只剩散落日志”。

- [x] Task 8: Add research-grade data QA and leakage checks for merged-data runs
  Files: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_dataset_window_leakage.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_feature_coverage_contract.py`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_backtest_contract.py`, `F:\DataCenter\qlib\cn_data_merged\`, `D:\Quant\docs\reports\data_merge_report.md`
  Change: 新增窗口切分无泄漏、benchmark/feature 覆盖率、停牌/边界样本、回测成本配置等检查，补齐当前仅有“provider 合同级”测试的缺口。
  Verify: 新测试能在 merged provider 上通过，并能在窗口漂移、缺 feature、边界越界时明确失败。
  Expected: readiness 判断从“能加载数据”升级到“数据足以支撑研究结论”。

- [x] Task 9: Formalize artifact resilience and backup for the external `F:` data disk
  Files: `D:\Quant\docs\reports\data_resilience_runbook.md`, `F:\DataCenter\qlib\cn_data_merged\`, `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  Change: 为 `cn_data_merged`、日志目录和候选策略目录定义备份策略、恢复步骤和最低保留周期，降低外置盘断连导致的长跑损失。
  Verify: runbook 中存在备份目标路径、校验方式、恢复命令和责任人；至少完成一次 dry-run 或 checksum 级验证。
  Expected: readiness 评估不再忽略数据盘单点故障。

- [x] Task 10: Either complete or explicitly demote the research-report sidecar track
  Files: `D:\Quant\docs\reports\research_report_sources.md`, `D:\Quant\artifacts\research_reports\`, `D:\Quant\docs\plans\2026-04-09-rdagent-readiness-gap-checklist.md`
  Change: 对 `research_reports` sidecar 做二选一：要么补齐至少一条真实 source -> crawler -> extractor -> storage 的闭环；要么正式标记为非 readiness 前置，避免 skeleton 目录被误读为“已经具备”。
  Verify: 文档里明确 sidecar 当前状态、是否阻塞全量研究、样例产物是否真实存在。
  Expected: sidecar 状态从“目录存在但语义不明”升级为“已闭环”或“明确不阻塞主线”。

## Progress

- 2026-04-09: 基于 `2026-04-06-rdagent-full-setup-plan.md`、当前 qlib 测试文件、最新 `fin_model` / `fin_quant` 日志和 `D:\Quant` 文档/目录状态，创建本 checklist。
- 2026-04-09: 已在 WSL `rdagent` env 安装 `pytest` / `coverage`，并以 `PYTHONPATH=. /home/hp/miniconda3/bin/conda run -n rdagent python -m pytest test/qlib/test_model_env_config.py -q` 复验 canonical 入口。
- 2026-04-09: 已补齐 model/quant entrypoint bootstrap、model template merged/all-market 合同，以及 dataset window / feature coverage / backtest contract 三组 readiness 测试。
- 2026-04-09: 已创建 deep-loop evolution logs、strategy candidate schema、promotion gate、data resilience runbook 和 research-report sidecar 降级说明。
- 2026-04-09: 当前真正阻塞正式 loop 的只剩两条 critical path：`fin_model` timeout gate 与 `fin_quant` running gate。

## Surprises

- `rdagent` conda 环境最初能 import `psutil`，但缺 `pytest`；只有补装后，canonical WSL 验证命令才真正稳定。
- `QTDockerEnv` 使用了可变默认 `QlibDockerConf()` 对象，导致 timeout 设置会在测试间残留；这类共享状态会直接污染 readiness gate 判断。
- `test_model_template_config.py` 之前同时呈现“模板渲染通过”和“运行合同断言失败”，说明模板默认值与 runtime 合同已经分叉。
- `fin_quant` 最新日志目录只有 `direct_exp_gen` 与 `coding`，没有 `running` 目录，说明 readiness claim 仍缺运行期证据。
- `research_reports` 的骨架目录会被误读为“已经具备”；如果不显式降级，评估会继续失真。

## Decision Log

- 2026-04-09: 选择新建 focused companion checklist，而不是继续扩写 `2026-04-06-rdagent-full-setup-plan.md`，因为当前目标是聚焦 readiness gap，而非重写既有 phase 历史。
- 2026-04-09: 将 readiness 结论定义为“未完全具备全量研究生成条件”，直到 `fin_model` timeout gate 与 `fin_quant` running gate 至少形成最小闭环证据。
- 2026-04-09: 把“测试入口可复验”列为最优先 gap，因为没有稳定验证命令，后续所有 ready/not-ready 结论都不稳。
- 2026-04-09: 接受“正式 loop 前先闭合验证入口、模板合同、bootstrap、checkpoint/promotion 文档、data QA 与 resilience/runbook；model/quant 运行证据留作最后两条主线 blocker”这一拆分。
- 2026-04-09: 将 `research_reports` sidecar 正式降级为 readiness 非阻塞项，避免目录骨架造成误判。

## Verification Matrix

| Item | Status | Evidence |
| --- | --- | --- |
| merged provider / benchmark / CSI 边界基本合同 | Completed | `test_model_env_config.py`, `test_csi_instrument_alignment.py`, `test_runtime_window_alignment.py`, `test_benchmark_provider_contract.py` |
| `fin_factor` 当前 merged-data smoke success-path | Completed | `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md`, `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-07_09-09-32-898276\` |
| `fin_model` 当前 merged-data smoke success-path | Partial | `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-15-39-972748\`；训练进入 `cuda:0` 后被 600 秒 timeout kill |
| `fin_quant` 当前 merged-data smoke 到达 running | Pending | `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-27-58-215656\` 仅见 `direct_exp_gen` / `coding` |
| 测试入口在 `rdagent` env 内可稳定执行 | Completed | `PYTHONPATH=. /home/hp/miniconda3/bin/conda run -n rdagent python -m pytest test/qlib/test_model_env_config.py -q` 通过；README 已固化 canonical WSL 命令 |
| model template 默认合同与当前 runtime 一致 | Completed | `test_model_template_config.py` 已对齐 merged provider + all market + 当前窗口；模板渲染与 PROP_SETTING 断言全部通过 |
| model / quant entrypoint bootstrap parity | Completed | `test_model_entrypoint_bootstrap.py`、`test_quant_entrypoint_bootstrap.py` 通过；`model.py` / `quant.py` 已补 `_script_bootstrap` + `.env` 加载 |
| deep-loop checkpoint gate 文档存在 | Completed | 已创建 `D:\Quant\docs\reports\factor_evolution_log.md`、`model_evolution_log.md`、`quant_evolution_log.md` |
| strategy promotion gate 文档存在 | Completed | 已创建 `D:\Quant\docs\strategies\rdagent_best_strategy.md`，写清 promotion gates |
| strategy candidate artifact path 存在 | Completed | 已创建 `D:\Quant\artifacts\strategy_candidates\`、schema 与 sample candidate |
| merged-data data QA / leakage / backtest contracts | Completed | `test_dataset_window_leakage.py`、`test_feature_coverage_contract.py`、`test_backtest_contract.py` 全部通过 |
| research-report sidecar 状态已定性 | Completed (Demoted) | `research_report_sources.md` 已明确 sidecar 当前为 readiness 非阻塞项 |
| 外置数据盘备份/恢复策略已定义 | Completed | 已创建 `D:\Quant\docs\reports\data_resilience_runbook.md`，定义 backup / restore / checksum / dry-run / owner |

## Outcome / Handoff

- 当前结论：RD-Agent 仍不具备“直接启动全量策略研究生成”的完全条件，但正式 loop 前的大部分验证、结构和文档前置已经落地。
- 最短 critical path：Task 4 -> Task 5。
- 已闭合的前置：Task 1、Task 2、Task 3、Task 6、Task 7、Task 8、Task 9、Task 10。
- 只有在以下最小条件同时满足后，才建议重新评估是否进入 20+ loop：
  - `fin_model` 完成一次当前合同下的 smoke 成功路径。
  - `fin_quant` 至少进入一次 `running` 并留下结构化证据。
  - checkpoint 文档与 candidate/promotion 结构持续与新增 run evidence 同步。
- 与当前主计划的关系：本文件负责列 readiness 缺口和关闭顺序；新的 model/quant 运行证据仍应同步回 `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md`。
