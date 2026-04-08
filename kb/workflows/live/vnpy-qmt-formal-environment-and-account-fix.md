---
id: wf-vnpy-qmt-formal-environment-and-account-fix
type: playbook
title: vn.py QMT Formal Environment and Account Fix
aliases:
  - vnpy qmt install fix
  - vnpy qmt available cash fix
  - vnpy qmt chinese path connect -1
  - vnpy qmt formal environment repair
markets:
  - equities
stage: live
algo_family: broker-integration
status: active
confidence: high
updated_at: 2026-04-02
source_refs:
  - type: local
    title: vnpy qmt account mapping regression test
    path: F:\Quant\repos\vnpy\tests\test_qmt_account_mapping.py
agent_actions:
  - summarize
  - checklist
  - execute
---
# vn.py QMT Formal Environment and Account Fix

## Purpose
Solidify a working `vnpy + vnpy_qmt + xtquant` environment on Windows Python 3.12, fix the QMT account cash mapping in `vnpy_qmt`, and verify that MiniQMT account data can be queried correctly from the formal runtime.

## Tested Reference
- Date: `2026-04-02`
- Workspace: `F:\Quant\repos\vnpy`
- Knowledge base root: `F:\Quant\kb`
- Python: `C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe`
- QMT root: `F:\Quant\compat\qmt\sim`
- QMT userdata: `F:\Quant\compat\qmt\sim\userdata_mini`
- Tested account: `8886662822`

## Root Cause Summary
Two separate issues were present:

1. Inline Python launched from PowerShell corrupted the Chinese QMT install path when the path literal was embedded directly in the script body. That made `XtQuantTrader.connect()` return `-1` even though MiniQMT was already logged in and healthy.
2. `vnpy_qmt` mapped `AccountData.balance` to `asset.total_asset`, which caused `AccountData.available` to display total assets instead of available cash because vn.py computes:

```python
available = balance - frozen
```

For stock accounts, the correct mapping for the available-cash display is:
- `balance = asset.cash`
- `frozen = asset.frozen_cash`

The original investigation used retired `D:\` and `E:\` root aliases. Those paths are now historical only; the maintained workspace lives under `F:\Quant`.

## Formal Environment Setup
Use the formal Python 3.12 interpreter and install:

```powershell
C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe -m pip install `
  vnpy_qmt==0.3.3 xtquant==250516.1.1 tzlocal ta-lib loguru pyqtgraph `
  qdarkstyle pyzmq plotly tqdm nbformat deap pytest

C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe -m pip install -e F:\Quant\repos\vnpy
```

Expected import result from a directory outside the repo:

```python
import vnpy
import vnpy_qmt
import xtquant
```

## Required QMT Connection Rule
When the QMT path contains Chinese characters, pass the `userdata_mini` path through an environment variable or another Unicode-safe input path. Do not hardcode the legacy Chinese path inside inline PowerShell Python snippets.

Safe pattern:

```powershell
$env:QMTUD='F:\Quant\compat\qmt\sim\userdata_mini'
@'
import os
path = os.environ["QMTUD"]
'@ | python -
```

Unsafe pattern:

```powershell
@'
path = r"<legacy Chinese QMT userdata path>"
'@ | python -
```

## vnpy_qmt Patch
Patched file:
- `C:\Users\HP\AppData\Local\Programs\Python\Python312\Lib\site-packages\vnpy_qmt\td.py`

Patched logic:

```python
def on_stock_asset(self, asset):
    account = AccountData(
        accountid=asset.account_id,
        frozen=asset.frozen_cash,
        balance=asset.cash,
        gateway_name=self.gateway.gateway_name
    )
    account.extra = {
        "cash": asset.cash,
        "frozen_cash": asset.frozen_cash,
        "market_value": asset.market_value,
        "total_asset": asset.total_asset,
    }
    self.gateway.on_account(account)
```

Effect:
- vn.py `available` now shows available cash correctly.
- `total_asset` and `market_value` are still preserved in `account.extra`.

## Regression Test
Added test:
- `F:\Quant\repos\vnpy\tests\test_qmt_account_mapping.py`

Run:

```powershell
C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe -m pytest F:\Quant\repos\vnpy\tests\test_qmt_account_mapping.py -q
```

Expected:
- `1 passed`

## Runtime Verification
### Direct xtquant check
```powershell
$env:QMTUD='F:\Quant\compat\qmt\sim\userdata_mini'
@'
import os, random, time
from xtquant.xttrader import XtQuantTrader
from xtquant.xttype import StockAccount

trader = XtQuantTrader(os.environ["QMTUD"], random.randint(100000, 999999))
trader.start()
time.sleep(1)
assert trader.connect() == 0
acc = StockAccount("8886662822")
assert trader.subscribe(acc) == 0
asset = trader.query_stock_asset(acc)
print(asset.cash, asset.frozen_cash, asset.market_value, asset.total_asset)
trader.stop()
'@ | C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe -
```

Observed reference result:
- `cash = 2595.98`
- `frozen_cash = 0.0`
- `market_value = 86179.0`
- `total_asset = 88820.58`

### vnpy_qmt event check
Expected account event:

```text
account_event=('8886662822', 2595.98, 2595.98, 0.0, {
  'cash': 2595.98,
  'frozen_cash': 0.0,
  'market_value': 86179.0,
  'total_asset': 88820.58
})
```

## Watchouts
- `connect() == -1` does not automatically mean MiniQMT is down. Check the path encoding first.
- `xtdata.connect(58610)` can succeed while trade access still fails if the wrong `userdata_mini` path is passed to `XtQuantTrader`.
- `vnpy_qmt` will print many contract-loading warnings while loading contracts. These are noisy but not fatal for stock-account connectivity.
- The retired `F:\Quant\wsl` compatibility alias should not be used for WSL on the final layout. The physical WSL root is `F:\WSL`.
- If `vnpy_qmt` is reinstalled or upgraded, the patched `td.py` may be overwritten. Reapply the patch or keep a local fixed fork.

## Reuse Rule
For future unfamiliar broker, QMT, vn.py, or quant-integration issues, check `F:\Quant\kb` first before starting a fresh investigation.
