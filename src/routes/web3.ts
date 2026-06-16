import type { Express } from "express";
import { faker } from "@faker-js/faker";
import {
  fakeAllowance,
  fakeApproveTx,
  fakeBalance,
  fakeCandles,
  fakeChainId,
  fakeDefiPositions,
  fakeLendingHealth,
  fakePool,
  fakePortfolioPnl,
  fakeSwapQuote,
  fakeToken,
  fakeTokenPrice,
  fakeTxHash,
  type CandleInterval
} from "../fake.js";
import { clampInt, num, oneOf, str } from "../util/parse.js";

const CANDLE_INTERVALS: readonly CandleInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
const PNL_PERIODS = ["1d", "7d", "30d", "90d", "1y"] as const;

/** Registers the web3 / crypto / DeFi mock endpoints under /api/web3. */
export function registerWeb3Routes(app: Express): void {
  app.get("/api/web3/tokens", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const limit = clampInt(req.query.limit, 20, 1, 200);
    res.json({
      chainId,
      items: Array.from({ length: limit }, () => fakeToken({ chainId })),
      ts: Date.now()
    });
  });

  app.get("/api/web3/prices", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const addresses = str(req.query.addresses)
      ? str(req.query.addresses)!
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const items = (
      addresses.length ? addresses : Array.from({ length: 5 }, () => fakeToken({ chainId }).address)
    ).map((address) => fakeTokenPrice({ chainId, address }));
    res.json({ chainId, items, ts: Date.now() });
  });

  app.get("/api/web3/wallets/:address/balances", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const address = req.params.address;
    const limit = clampInt(req.query.limit, 10, 1, 200);
    res.json({
      chainId,
      address,
      items: Array.from({ length: limit }, () => fakeBalance({ chainId, address })),
      ts: Date.now()
    });
  });

  app.get("/api/web3/defi/pools/:poolAddress", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    res.json(fakePool({ chainId, address: req.params.poolAddress }));
  });

  app.post("/api/web3/defi/swap/quote", (req, res) => {
    const chainId = fakeChainId(req.body?.chainId);
    const fromToken = fakeToken({ chainId, address: str(req.body?.fromTokenAddress) });
    const toToken = fakeToken({ chainId, address: str(req.body?.toTokenAddress) });
    res.json(fakeSwapQuote({ chainId, fromToken, toToken, amountIn: str(req.body?.amountIn) }));
  });

  app.get("/api/web3/allowance", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const token = fakeToken({ chainId, address: str(req.query.tokenAddress) });
    res.json(
      fakeAllowance({
        chainId,
        owner: str(req.query.owner),
        spender: str(req.query.spender),
        token
      })
    );
  });

  app.post("/api/web3/approve", (req, res) => {
    const chainId = fakeChainId(req.body?.chainId);
    const token = fakeToken({ chainId, address: str(req.body?.tokenAddress) });
    res.json(
      fakeApproveTx({
        chainId,
        owner: str(req.body?.owner),
        spender: str(req.body?.spender),
        token,
        amount: str(req.body?.amount)
      })
    );
  });

  app.get("/api/web3/defi/positions", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    res.json(fakeDefiPositions({ chainId, address: str(req.query.address) }));
  });

  app.get("/api/web3/defi/lending/health", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    res.json(
      fakeLendingHealth({
        chainId,
        address: str(req.query.address),
        protocol: str(req.query.protocol)
      })
    );
  });

  app.get("/api/web3/candles", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const baseToken = str(req.query.baseToken);
    const quoteToken = str(req.query.quoteToken) ?? "USD";
    const interval = oneOf(req.query.interval, CANDLE_INTERVALS) ?? "1m";
    const endTs = num(req.query.endTs) ?? Date.now();
    const limit = clampInt(req.query.limit, 300, 1, 5000);
    const startTs = num(req.query.startTs) ?? endTs - 60_000 * limit;

    const basePriceUsd =
      baseToken?.toUpperCase() === "WETH"
        ? 3000
        : baseToken?.toUpperCase() === "WBTC"
          ? 100000
          : undefined;
    const items = fakeCandles({ basePriceUsd, interval, startTs, endTs, limit });
    res.json({ chainId, baseToken, quoteToken, interval, startTs, endTs, limit, items });
  });

  app.get("/api/web3/portfolio/pnl", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    res.json(
      fakePortfolioPnl({
        chainId,
        address: str(req.query.address),
        period: oneOf(req.query.period, PNL_PERIODS)
      })
    );
  });

  app.post("/api/web3/tx/send", (req, res) => {
    const chainId = fakeChainId(req.body?.chainId);
    res.status(201).json({
      chainId,
      hash: fakeTxHash(),
      from: str(req.body?.from),
      to: str(req.body?.to),
      value: str(req.body?.value) ?? "0",
      data: str(req.body?.data) ?? "0x",
      submittedAt: Date.now()
    });
  });

  app.get("/api/web3/tx/:hash", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const confirmations = faker.number.int({ min: 0, max: 50 });
    const status = faker.helpers.arrayElement(["pending", "confirmed", "failed"]);
    res.json({
      chainId,
      hash: req.params.hash,
      status,
      confirmations,
      blockNumber:
        status === "pending" ? null : faker.number.int({ min: 10_000_000, max: 30_000_000 }),
      gasUsed: status === "pending" ? null : faker.number.int({ min: 21_000, max: 1_500_000 }),
      effectiveGasPriceGwei:
        status === "pending" ? null : faker.number.float({ min: 0.1, max: 200, fractionDigits: 2 }),
      ts: Date.now()
    });
  });
}
