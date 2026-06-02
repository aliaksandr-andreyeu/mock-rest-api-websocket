# Mock REST API + WebSocket (Node.js + TypeScript)

Service for testing API clients:

- REST API (Express) with Swagger UI (OpenAPI).
- Endpoints of all common types: GET/POST/PUT/PATCH/DELETE, query/path/header/cookie/body, upload.
- Responses contain randomly generated mock data.
- WebSocket server (`ws`) with `subscribe` by channel and random data pushed to the channel.

## Run

```bash
npm i
npm run dev
```

Defaults:

- REST: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI YAML: `http://localhost:3000/openapi.yaml`
- WebSocket: `ws://localhost:3000/ws`

## Quick examples

### REST

```bash
curl "http://localhost:3000/api/ping"
curl "http://localhost:3000/api/users?limit=3"
curl "http://localhost:3000/api/users/123" -H "x-trace-id: test"
curl -X POST "http://localhost:3000/api/users" -H "Content-Type: application/json" -d '{"email":"a@b.com"}'
curl -X PATCH "http://localhost:3000/api/users/123" -H "Content-Type: application/json" -d '{"status":"active"}'
curl -X DELETE "http://localhost:3000/api/users/123"

# web3 / crypto / DeFi
curl "http://localhost:3000/api/web3/tokens?chainId=1&limit=5"
curl "http://localhost:3000/api/web3/prices?chainId=1"
curl "http://localhost:3000/api/web3/wallets/0x0000000000000000000000000000000000000000/balances?chainId=1&limit=3"
curl "http://localhost:3000/api/web3/defi/pools/0x0000000000000000000000000000000000000000?chainId=1"
curl -X POST "http://localhost:3000/api/web3/defi/swap/quote" -H "Content-Type: application/json" -d '{"chainId":1,"fromTokenAddress":"0x1111111111111111111111111111111111111111","toTokenAddress":"0x2222222222222222222222222222222222222222","amountIn":"1.0"}'
curl -X POST "http://localhost:3000/api/web3/tx/send" -H "Content-Type: application/json" -d '{"chainId":1,"from":"0x1111111111111111111111111111111111111111","to":"0x2222222222222222222222222222222222222222","value":"0","data":"0x"}'
curl "http://localhost:3000/api/web3/tx/0x$(python - <<'PY'\nprint('0'*64)\nPY\n)?chainId=1"

# approve / allowance
curl "http://localhost:3000/api/web3/allowance?chainId=1&owner=0x1111111111111111111111111111111111111111&spender=0x2222222222222222222222222222222222222222&tokenAddress=0x3333333333333333333333333333333333333333"
curl -X POST "http://localhost:3000/api/web3/approve" -H "Content-Type: application/json" -d '{"chainId":1,"owner":"0x1111111111111111111111111111111111111111","spender":"0x2222222222222222222222222222222222222222","tokenAddress":"0x3333333333333333333333333333333333333333","amount":"1000"}'

# positions / lending
curl "http://localhost:3000/api/web3/defi/positions?chainId=1&address=0x1111111111111111111111111111111111111111"
curl "http://localhost:3000/api/web3/defi/lending/health?chainId=1&address=0x1111111111111111111111111111111111111111&protocol=aave-v3"

# historical candles
curl "http://localhost:3000/api/web3/candles?chainId=1&baseToken=WETH&quoteToken=USD&interval=5m&limit=50"

# portfolio PnL
curl "http://localhost:3000/api/web3/portfolio/pnl?chainId=1&address=0x1111111111111111111111111111111111111111&period=7d"
```

### WebSocket

Subscribe message:

```json
{ "type": "subscribe", "channel": "orders" }
```

The `orders` channel returns random “order” events (to test realtime handling in your client).
Server message format:

```json
{
  "type": "event",
  "channel": "orders",
  "data": {
    "id": "uuid",
    "channel": "orders",
    "ts": 1716820000000,
    "payload": {
      "kind": "created|updated|deleted|heartbeat",
      "message": "text",
      "amount": 123.45,
      "ip": "1.2.3.4",
      "userAgent": "UA...",
      "meta": ["a", "b"]
    }
  }
}
```

Subscribe to BTC OHLC:

```json
{ "type": "subscribe", "channel": "btc" }
```

In `BTC` `event` messages, `data.payload` has the following shape:

```json
{ "o": 100000.12, "h": 101200.55, "l": 99500.01, "c": 100500.42, "ts": 1716820000000 }
```

Subscribe to GPS coordinates:

```json
{ "type": "subscribe", "channel": "gps" }
```

In `gps` `event` messages, `data` has the following shape:

```json
{ "lat": 37.421998, "lng": -122.084, "ts": 1716820000000 }
```

Unsubscribe:

```json
{ "type": "unsubscribe", "channel": "orders" }
{ "type": "unsubscribe", "channel": "btc" }
{ "type": "unsubscribe", "channel": "gps" }
```

When you unsubscribe, the server responds with:

- `type: "unsubscribed"`
- `channel`: the channel you just removed (e.g. `orders`, `BTC`, etc.)
- `channels`: the **current** list of remaining subscriptions

Use that to update your UI (e.g. remove the channel “chip” and re-render from `channels`).
