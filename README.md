# Mock REST API + WebSocket (Node.js + TypeScript)

Service for testing API clients:

- REST API (Express) with Swagger UI (OpenAPI).
- Endpoints of all common types: GET/POST/PUT/PATCH/DELETE, query/path/header/cookie/body, upload.
- Responses contain randomly generated mock data.
- WebSocket server (`ws`) with `subscribe` by channel; one random event per subscribed channel is pushed each tick.

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
- Health probe: `http://localhost:3000/health`
- Metrics: `http://localhost:3000/api/metrics`

The OpenAPI document is generated from zod schemas (`src/schemas.ts`), which are
also the source of the TypeScript types and are contract-tested against the data
generators. Security headers (helmet) are on by default; rate limiting is
opt-in via `RATE_LIMIT_MAX`.

Requires Node.js >= 22.13.0.

## Configuration

Configuration is read from the environment (and a local `.env`) and validated at
startup via `zod` — invalid values fail fast. Copy `.env.example` to `.env` to
customize:

| Variable                | Default       | Description                                        |
| ----------------------- | ------------- | -------------------------------------------------- |
| `PORT`                  | `3000`        | HTTP/WS port                                       |
| `WS_TICK_MS`            | `1000`        | WebSocket push interval (ms, 50–60000)             |
| `WS_HEARTBEAT_MS`       | `30000`       | Ping interval for dead-connection detection (ms)   |
| `WS_MAX_PAYLOAD_BYTES`  | `65536`       | Reject inbound WS frames larger than this          |
| `WS_MAX_BUFFERED_BYTES` | `1048576`     | Backpressure: skip events when send buffer is full |
| `UPLOAD_MAX_BYTES`      | `5242880`     | Max accepted upload size (bytes)                   |
| `RATE_LIMIT_WINDOW_MS`  | `60000`       | Rate-limit window for `/api` (ms)                  |
| `RATE_LIMIT_MAX`        | `0`           | Max `/api` requests per window per IP (`0` = off)  |
| `LOG_LEVEL`             | `info`        | pino level (`fatal`…`trace`, `silent`)             |
| `NODE_ENV`              | `development` | `development` / `test` / `production`              |
| `FAKER_SEED`            | _(unset)_     | Seed faker for reproducible mock data              |

The server logs via `pino` and shuts down gracefully on `SIGTERM`/`SIGINT`.

## Tests

```bash
npm test          # run the Vitest suite once
npm run coverage  # with a coverage report
```

Covered: generator contracts, REST behavior (supertest), the WebSocket protocol,
and an OpenAPI ↔ routes parity check that fails if the spec drifts from the code.

## Docker

```bash
docker compose up --build
# then: curl http://localhost:3000/health
```

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

Once subscribed, the server pushes one `event` per subscribed channel on every
tick (`WS_TICK_MS`, default 1000ms). Per-channel cadence is constant and does not
depend on how many channels you're subscribed to.

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
      "meta": { "a": "x1y2z3a4", "b": "b1c2d3e4", "c": "c1d2e3f4" }
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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.
