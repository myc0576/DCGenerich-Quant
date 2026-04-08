---
id: wf-thinktrader-one-click-liquidation
type: playbook
title: ThinkTrader One-Click Liquidation
aliases:
  - thinktrader clear all
  - qmt one click liquidation
  - 一键清仓
markets:
  - equities
stage: live
algo_family: execution
status: active
confidence: high
updated_at: 2026-03-23
source_refs:
  - type: official
    title: ThinkTrader 快速开始
    url: https://dict.thinktrader.net/nativeApi/start_now.html
  - type: official
    title: ThinkTrader XtQuantTrader
    url: https://dict.thinktrader.net/nativeApi/xttrader.html
  - type: official
    title: ThinkTrader 常见问题
    url: https://dict.thinktrader.net/nativeApi/question_function.html?id=TB5IbM
agent_actions:
  - summarize
  - checklist
  - execute
---
# ThinkTrader One-Click Liquidation

## Purpose
Execute and verify a full-stock liquidation workflow for a logged-in ThinkTrader or MiniQMT stock account through `XtQuantTrader`.

## Preconditions
- `XtMiniQmt` is running and the target account is already logged in.
- The correct `userdata_mini` path is known.
- Use an environment variable for the `userdata_mini` path if the install path contains Chinese characters. Directly embedding the path inside inline Python can break encoding and cause `connect() == -1`.
- For simulation trading, prefer `xtconstant.FIX_PRICE`. Do not assume market-price order types are available.

## Inputs
- account id
- `userdata_mini` path
- strategy name
- order remark

## Tested Reference
- Date: `2026-03-23`
- Account: `40676250`
- Environment: `D:\国金QMT交易端模拟\userdata_mini`
- Result: liquidation completed after one cancel-and-retry cycle

## Workflow
1. Initialize and connect:

```python
import os, random
from xtquant.xttrader import XtQuantTrader, XtQuantTraderCallback
from xtquant.xttype import StockAccount

path = os.environ["QMT_USERDATA"]
account_id = "40676250"
session_id = random.randint(100000, 999999)

trader = XtQuantTrader(path, session_id)
trader.register_callback(XtQuantTraderCallback())
trader.start()
assert trader.connect() == 0

acc = StockAccount(account_id, "STOCK")
assert trader.subscribe(acc) == 0
```

2. Query current positions and keep only rows where `can_use_volume > 0`.
3. Submit one sell order per holding with:
   - `order_type = xtconstant.STOCK_SELL`
   - `price_type = xtconstant.FIX_PRICE`
   - `price = round(last_price, 2)` for the first wave
4. Wait briefly, then query:
   - `query_stock_orders(acc)`
   - `query_stock_trades(acc)`
   - `query_stock_positions(acc)`
5. Interpret order states:
   - `50`: reported, not yet fully filled
   - `54`: canceled
   - `56`: fully filled
6. If any liquidation orders stay at `50`, cancel them first. Pending sell orders can drive `can_use_volume` to `0`, so re-query positions after cancel before retrying.
7. Retry the remaining positions with a more aggressive sell price such as `round(last_price * 0.99, 2)`.
8. Finish only when `query_stock_positions(acc)` returns no remaining stock positions.

## Minimal Liquidation Loop
```python
from xtquant import xtconstant

positions = trader.query_stock_positions(acc) or []
targets = [p for p in positions if p.can_use_volume > 0]

for p in targets:
    trader.order_stock(
        acc,
        p.stock_code,
        xtconstant.STOCK_SELL,
        int(p.can_use_volume),
        xtconstant.FIX_PRICE,
        round(float(p.last_price), 2),
        "codex_clear_all_test",
        "codex_clear_all_run",
    )
```

## Verification Checklist
- `connect()` returns `0`
- `subscribe()` returns `0`
- orders are returned with valid positive `order_id`
- every liquidation order is either filled or explicitly canceled and retried
- `query_stock_trades()` shows executed sells for every original holding
- final `query_stock_positions()` is empty

## Observed Execution Evidence
- First wave sold `601988.SH` and `001965.SZ` immediately.
- First wave left `600000.SH`, `600919.SH`, `601288.SH`, `601328.SH`, and `601658.SH` in status `50`.
- After canceling those five orders and retrying at `last_price * 0.99`, all five completed with status `56`.
- Final verification returned `remaining_positions = []`.

## Watchouts
- `connect() == -1` is not enough to conclude the client is down. Confirm the path encoding, active login state, `session_id`, and whether `up_queue_xtquant` exists under `userdata_mini`.
- Inline Python launched from PowerShell can corrupt non-ASCII paths. Passing the path through `os.environ` avoided this issue in the tested run.
- A successful `order_id` only proves the order was accepted. It does not prove liquidation completed.
- If you re-run the workflow, change `order_remark` so order and trade audits stay attributable to one run.
