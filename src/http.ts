import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import { faker } from "@faker-js/faker";
import {
  fakeAllowance,
  fakeApproveTx,
  fakeBalance,
  fakeCandles,
  fakeChainId,
  type CandleInterval,
  fakeDefiPositions,
  fakeLendingHealth,
  fakeOrder,
  fakePool,
  fakePortfolioPnl,
  fakeSwapQuote,
  fakeToken,
  fakeTokenPrice,
  fakeTxHash,
  fakeUser
} from "./fake.js";
import { openApiSpec, openApiYaml } from "./openapi.js";
import type { UserStatus } from "./fake.js";

export function createHttpApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") ?? faker.string.uuid();
    res.setHeader("x-request-id", requestId);
    (res.locals as { requestId?: string }).requestId = requestId;
    next();
  });

  app.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(openApiYaml());
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));

  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
  });

  app.post("/api/echo", (req, res) => {
    res.json({
      headers: req.headers,
      query: req.query,
      cookies: req.cookies,
      body: req.body
    });
  });

  app.get("/api/users", (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10) || 10, 1), 100);
    const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);

    const items = Array.from({ length: limit }, () => fakeUser());
    res.json({
      items,
      total: 1000,
      limit,
      offset
    });
  });

  app.post("/api/users", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email : undefined;
    const name = typeof req.body?.name === "string" ? req.body.name : undefined;
    res.status(201).json(fakeUser({ email, name }));
  });

  app.get("/api/users/:id", (req, res) => {
    const traceId = req.header("x-trace-id") ?? null;
    const session = (req.cookies?.session as string | undefined) ?? null;
    res.json({
      ...fakeUser({ id: req.params.id }),
      debug: { traceId, session }
    });
  });

  app.put("/api/users/:id", (req, res) => {
    res.json(fakeUser({ id: req.params.id }));
  });

  app.patch("/api/users/:id", (req, res) => {
    const status = typeof req.body?.status === "string" ? req.body.status : undefined;
    const allowed: readonly UserStatus[] = ["active", "blocked", "pending"];
    const parsedStatus =
      status && allowed.includes(status as UserStatus) ? (status as UserStatus) : undefined;
    res.json(fakeUser({ id: req.params.id, status: parsedStatus }));
  });

  app.delete("/api/users/:id", (_req, res) => {
    res.status(204).send();
  });

  app.get("/api/orders", (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10) || 10, 1), 100);
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    res.json(Array.from({ length: limit }, () => fakeOrder({ userId })));
  });

  app.post("/api/orders", (req, res) => {
    const userId = typeof req.body?.userId === "string" ? req.body.userId : undefined;
    const itemsCount = Number.isFinite(Number(req.body?.itemsCount))
      ? Number(req.body.itemsCount)
      : undefined;
    res.status(201).json(fakeOrder({ userId, itemsCount }));
  });

  // ---- web3 / crypto / DeFi mock endpoints ----
  app.get("/api/web3/tokens", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20) || 20, 1), 200);
    res.json({
      chainId,
      items: Array.from({ length: limit }, () => fakeToken({ chainId })),
      ts: Date.now()
    });
  });

  app.get("/api/web3/prices", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const addresses =
      typeof req.query.addresses === "string"
        ? req.query.addresses
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
    const limit = Math.min(Math.max(Number(req.query.limit ?? 10) || 10, 1), 200);
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
    const amountIn = typeof req.body?.amountIn === "string" ? req.body.amountIn : undefined;
    const fromTokenAddress =
      typeof req.body?.fromTokenAddress === "string" ? req.body.fromTokenAddress : undefined;
    const toTokenAddress =
      typeof req.body?.toTokenAddress === "string" ? req.body.toTokenAddress : undefined;

    const fromToken = fakeToken({ chainId, address: fromTokenAddress });
    const toToken = fakeToken({ chainId, address: toTokenAddress });
    res.json(fakeSwapQuote({ chainId, fromToken, toToken, amountIn }));
  });

  app.get("/api/web3/allowance", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const owner = typeof req.query.owner === "string" ? req.query.owner : undefined;
    const spender = typeof req.query.spender === "string" ? req.query.spender : undefined;
    const tokenAddress =
      typeof req.query.tokenAddress === "string" ? req.query.tokenAddress : undefined;
    const token = fakeToken({ chainId, address: tokenAddress });
    res.json(fakeAllowance({ chainId, owner, spender, token }));
  });

  app.post("/api/web3/approve", (req, res) => {
    const chainId = fakeChainId(req.body?.chainId);
    const owner = typeof req.body?.owner === "string" ? req.body.owner : undefined;
    const spender = typeof req.body?.spender === "string" ? req.body.spender : undefined;
    const tokenAddress =
      typeof req.body?.tokenAddress === "string" ? req.body.tokenAddress : undefined;
    const amount = typeof req.body?.amount === "string" ? req.body.amount : undefined;
    const token = fakeToken({ chainId, address: tokenAddress });
    res.json(fakeApproveTx({ chainId, owner, spender, token, amount }));
  });

  app.get("/api/web3/defi/positions", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const address = typeof req.query.address === "string" ? req.query.address : undefined;
    res.json(fakeDefiPositions({ chainId, address }));
  });

  app.get("/api/web3/defi/lending/health", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const address = typeof req.query.address === "string" ? req.query.address : undefined;
    const protocol = typeof req.query.protocol === "string" ? req.query.protocol : undefined;
    res.json(fakeLendingHealth({ chainId, address, protocol }));
  });

  app.get("/api/web3/candles", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const baseToken = typeof req.query.baseToken === "string" ? req.query.baseToken : undefined;
    const quoteToken = typeof req.query.quoteToken === "string" ? req.query.quoteToken : "USD";
    const interval = (
      typeof req.query.interval === "string" ? req.query.interval : "1m"
    ) as CandleInterval;
    const endTs = Number(req.query.endTs ?? Date.now()) || Date.now();
    const limit = Math.min(Math.max(Number(req.query.limit ?? 300) || 300, 1), 5000);
    const startTs = Number(req.query.startTs ?? endTs - 60_000 * limit) || endTs - 60_000 * limit;

    const basePriceUsd =
      baseToken?.toUpperCase() === "WETH"
        ? 3000
        : baseToken?.toUpperCase() === "WBTC"
          ? 100000
          : undefined;
    const candles = fakeCandles({ basePriceUsd, interval, startTs, endTs, limit });
    res.json({ chainId, baseToken, quoteToken, interval, startTs, endTs, limit, items: candles });
  });

  app.get("/api/web3/portfolio/pnl", (req, res) => {
    const chainId = fakeChainId(req.query.chainId);
    const address = typeof req.query.address === "string" ? req.query.address : undefined;
    const period = typeof req.query.period === "string" ? req.query.period : undefined;
    const allowedPeriods = ["1d", "7d", "30d", "90d", "1y"] as const;
    const parsedPeriod =
      period && (allowedPeriods as readonly string[]).includes(period)
        ? (period as (typeof allowedPeriods)[number])
        : undefined;
    res.json(fakePortfolioPnl({ chainId, address, period: parsedPeriod }));
  });

  app.post("/api/web3/tx/send", (req, res) => {
    const chainId = fakeChainId(req.body?.chainId);
    const from = typeof req.body?.from === "string" ? req.body.from : undefined;
    const to = typeof req.body?.to === "string" ? req.body.to : undefined;
    const value = typeof req.body?.value === "string" ? req.body.value : "0";
    const data = typeof req.body?.data === "string" ? req.body.data : "0x";
    res.status(201).json({
      chainId,
      hash: fakeTxHash(),
      from,
      to,
      value,
      data,
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

  const upload = multer({ storage: multer.memoryStorage() });
  app.post("/api/files/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      const requestId = (res.locals as { requestId?: string }).requestId;
      res.status(400).json({
        error: "BadRequest",
        message: "file is required",
        requestId
      });
      return;
    }
    res.json({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });

  app.get("/api/error", (_req, res) => {
    const requestId = (res.locals as { requestId?: string }).requestId;
    res.status(500).json({
      error: "InternalError",
      message: "Generated test error",
      requestId
    });
  });

  app.use((req, res) => {
    const requestId = (res.locals as { requestId?: string }).requestId;
    res.status(404).json({
      error: "NotFound",
      message: `No route for ${req.method} ${req.path}`,
      requestId
    });
  });

  return app;
}
