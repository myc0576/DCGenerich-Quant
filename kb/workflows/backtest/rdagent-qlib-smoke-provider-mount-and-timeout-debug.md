---
id: wf-rdagent-qlib-smoke-provider-mount-and-timeout-debug
type: playbook
title: RD-Agent Qlib Smoke Provider Mount and Timeout Debug
aliases:
  - rdagent qlib smoke debug
  - rdagent provider day false blocker
  - sz000852 sh000852 drift
markets:
  - equities
stage: backtest
algo_family: agent-runtime
status: active
confidence: high
updated_at: 2026-04-08
source_refs:
  - type: local
    title: execution plan
    path: D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md
  - type: local
    title: benchmark provider contract test
    path: \\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_benchmark_provider_contract.py
  - type: local
    title: docker env mount regression test
    path: \\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_env_config.py
agent_actions:
  - summarize
  - checklist
  - execute
---
# RD-Agent Qlib Smoke Provider Mount and Timeout Debug

## Purpose
Record the real completion state of the 2026-04-08 Task 12-14 execution, preserve the debugging path that overturned the earlier wrong diagnosis, and define the next launch gates before any 20+ loop run.

## Tested Reference
- Date: `2026-04-08`
- Quant repo: `D:\Quant`
- RD-Agent repo: `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent`
- Live plan: `D:\Quant\docs\plans\2026-04-06-rdagent-full-setup-plan.md`
- Active provider: `F:\DataCenter\qlib\cn_data_merged`
- Docker image: `local_qlib:latest`
- GPU: `NVIDIA GeForce RTX 5070 Laptop GPU`
- Key logs:
  - `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-15-39-972748`
  - `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\log\2026-04-08_06-27-58-215656`

## Completion Summary
1. Task 12 is confirmed closed. The old `local_qlib` baseline failure was a real binary compatibility issue: `torch 2.2.1 + cu121` on host `sm_120`, not a missing-GPU issue.
2. Task 13 is confirmed closed. The rebuilt `local_qlib:latest` uses `torch 2.7.1+cu128`, includes `sm_120` in `arch_list`, passes a real CUDA tensor op, and still imports `qlib`, `xgboost`, `catboost`, and `tables`.
3. Task 14a is closed after two fixes:
   - runtime benchmark drift: `SH000852` was wrong, `SZ000852` is the symbol that actually exists in `cn_data_merged`
   - Qlib Docker runtime mount gap: the active provider path was not mounted into the smoke container by default
4. `fin_model` no longer fails on provider/day access. It now reaches real CUDA training and is blocked by the 600-second runtime timeout.
5. `fin_quant` no longer reproduced the old provider/day error in this round, but it spent about 30 minutes in coding and did not reach `running`. Treat this as a separate launch gate, not as the same blocker as `fin_model`.

## Root Cause Summary
Two earlier conclusions were wrong.

1. The provider did not miss the CSI 1000 benchmark data. The dataset already contained:
   - `F:\DataCenter\qlib\cn_data_merged\features\sz000852\`
   - `F:\DataCenter\qlib\cn_data_merged\instruments\all.txt` with `SZ000852`
2. The smoke container did not actually have access to the active provider path. Before the fix, `QlibDockerConf` mounted only `~/.qlib` plus workspace/cache paths, so `qrun` inside Docker could not read `/mnt/f/DataCenter/qlib/cn_data_merged`.

The old `instrument: {'__DEFAULT_FREQ': '/mnt/f/DataCenter/qlib/cn_data_merged'} does not contain data for day` error was therefore a false combined symptom:
- wrong benchmark symbol in runtime config
- missing bind mount for the active provider path

## Debug Timeline
1. Re-validated the upgraded GPU runtime with a minimal CUDA probe. This closed the old `no kernel image is available for execution on the device` path.
2. Re-read merged provider contents on disk and found that the dataset contains `SZ000852`, not `SH000852`.
3. Added a regression test for the runtime benchmark contract and watched it fail:
   - runtime settings pointed to `SH000852`
   - `features/sh000852` did not exist
   - `instruments/all.txt` did not contain `SH000852`
4. Changed the runtime benchmark defaults in `rdagent/app/qlib_rd_loop/conf.py` to `SZ000852` and reran the test to green.
5. Re-ran `fin_model` and `fin_quant`. Both still surfaced the same provider/day error in the old path, which proved that the symbol fix alone was not enough.
6. Reproduced minimal `qlib.init -> D.instruments('all') -> D.features(...)` reads both:
   - directly in WSL
   - directly inside `local_qlib:latest` with an explicit `-v /mnt/f/...:/mnt/f/...`
7. Those minimal reads succeeded, which proved the merged provider itself was healthy and the container could read it when mounted.
8. Compared that successful direct container run with RD-Agent smoke `Run Info`. The smoke container was missing the `/mnt/f/DataCenter/qlib/cn_data_merged` bind mount.
9. Added provider auto-mount logic to `QlibDockerConf`, guarded by active provider env vars, and added a regression test for it.
10. Re-ran `fin_model` with `.env` exported before CLI launch. The run info then showed the `/mnt/f/...` mount, and the old provider/day error disappeared.
11. The new `fin_model` blocker became a real training gate: 600-second timeout after entering CUDA training.

## Concrete Changes
### Runtime config
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\app\qlib_rd_loop\conf.py`
  - corrected benchmark defaults to `SZ000852` at all three Qlib loop property settings

### Docker env wiring
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\rdagent\utils\env.py`
  - added `_active_qlib_provider_mounts()`
  - added `QlibDockerConf.include_active_provider_mounts()`
  - behavior: if `QLIB_PROVIDER_URI` or scenario-specific provider URIs point to an absolute existing path, mount that path read-only into the same container path

### Regression tests
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_benchmark_provider_contract.py`
  - checks runtime benchmark consistency
  - checks `features/sz000852/` exists
  - checks `instruments/all.txt` contains `SZ000852`
- `\\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent\test\qlib\test_model_env_config.py`
  - checks `QlibDockerConf` auto-mounts the active provider URI
  - keeps the existing `get_model_env(extra_volumes={})` regression covered

## Verification Commands
Benchmark contract:

```powershell
cmd /c "pushd \\wsl.localhost\Ubuntu\home\hp\projects\RD-Agent && C:\Users\HP\miniconda3\Scripts\conda.exe run -n QLIB python -m pytest test/qlib/test_benchmark_provider_contract.py -q"
```

Docker mount regression:

```bash
wsl.exe -d Ubuntu -e bash -lc "cd /home/hp/projects/RD-Agent && \
  source /home/hp/miniconda3/etc/profile.d/conda.sh && \
  export PYTHONPATH=. && \
  export QLIB_PROVIDER_URI=/mnt/f/DataCenter/qlib/cn_data_merged && \
  conda run -n rdagent python -m unittest discover -s test/qlib -p 'test_model_env_config.py'"
```

Minimal CUDA probe:

```bash
wsl.exe -d Ubuntu -- docker run --rm --gpus all local_qlib:latest python -c \
"import torch; print(torch.__version__); print(torch.version.cuda); print(torch.cuda.get_arch_list()); x=torch.randn(8, device='cuda'); print(float(x.sum().item()))"
```

Smoke reruns with `.env` exported before CLI init:

```bash
wsl.exe -d Ubuntu -e bash -lc "cd /home/hp/projects/RD-Agent && \
  set -a && source .env && set +a && \
  source /home/hp/miniconda3/etc/profile.d/conda.sh && \
  export PYTHONPATH=. && \
  conda run -n rdagent python -m rdagent.app.cli fin_model --loop-n 1 --step-n 3"
```

```bash
wsl.exe -d Ubuntu -e bash -lc "cd /home/hp/projects/RD-Agent && \
  set -a && source .env && set +a && \
  source /home/hp/miniconda3/etc/profile.d/conda.sh && \
  export PYTHONPATH=. && \
  conda run -n rdagent python -m rdagent.app.cli fin_quant --loop-n 1 --step-n 3"
```

## Current State After Fix
### Closed
- GPU architecture compatibility diagnosis
- upgraded `local_qlib` runtime
- benchmark symbol drift
- active provider mount gap
- old merged-provider/day access blocker

### Still Open
- `fin_model` launch gate: training exceeds `running_timeout_period=600`
- `fin_quant` launch gate: coding stage takes too long and did not reach `running` in the bounded rerun
- CSI instruments end-date alignment vs calendar boundary
- `conf.py` vs `.env` time-window dual-track ambiguity
- dirty branch snapshot discipline

## Watchouts
- If the Docker run info does not show `/mnt/f/DataCenter/qlib/cn_data_merged`, do not trust any provider/day diagnosis from that smoke run.
- `SH000852` vs `SZ000852` is not cosmetic. The dataset contract must match the exact symbol casing and exchange prefix that exist on disk.
- Export `.env` before launching `python -m rdagent.app.cli ...` when debugging environment initialization. The smoke path depends on env state during `QlibDockerConf` construction.
- A long `coding` stage is not the same as a runtime training blocker. Track them separately.
- Do not start 20+ loop runs until:
  - `fin_model` has a defined timeout gate or a passing bounded run
  - `fin_quant` has at least one bounded rerun that reaches `running`

## Reuse Rule
For future RD-Agent Qlib smoke failures on a fresh branch or a new machine, check in this order:
1. benchmark contract on disk
2. active provider bind mount in Docker run info
3. minimal container `qlib.init + D.features(...)` read
4. minimal CUDA probe
5. only then interpret smoke-stage failures
