import { z } from "zod";

// Single source of truth for domain shapes. Types are inferred from these
// (see `src/types.ts`), the OpenAPI component schemas are generated from them
// (see `src/openapi.ts`), and generators are contract-tested against them
// (see `src/schemas.test.ts`). `.meta({ id })` registers each schema as an
// OpenAPI component (`#/components/schemas/<id>`).

// ---- enums / primitives ----
export const UserStatusSchema = z.enum(["active", "blocked", "pending"]).meta({ id: "UserStatus" });

export const ChainIdSchema = z
  .union([z.literal(1), z.literal(10), z.literal(56), z.literal(137), z.literal(42161)])
  .meta({ id: "ChainId" });

export const CandleIntervalSchema = z
  .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
  .meta({ id: "CandleInterval" });

export const PnlPeriodSchema = z.enum(["1d", "7d", "30d", "90d", "1y"]).meta({ id: "PnlPeriod" });

export const DefiPositionTypeSchema = z
  .enum(["lp", "lending", "staking"])
  .meta({ id: "DefiPositionType" });

// ---- core entities ----
export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    status: UserStatusSchema,
    createdAt: z.string()
  })
  .meta({ id: "User" });

export const OrderSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    total: z.number(),
    currency: z.string(),
    itemsCount: z.number(),
    createdAt: z.string()
  })
  .meta({ id: "Order" });

// ---- web3 entities ----
export const TokenSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    logoUrl: z.string()
  })
  .meta({ id: "Token" });

export const TokenPriceSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    symbol: z.string(),
    priceUsd: z.number(),
    change24hPct: z.number(),
    ts: z.number()
  })
  .meta({ id: "TokenPrice" });

export const BalanceSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    token: TokenSchema,
    balance: z.string(),
    balanceUsd: z.number()
  })
  .meta({ id: "Balance" });

export const TxSchema = z
  .object({
    to: z.string(),
    data: z.string(),
    value: z.string(),
    gasLimit: z.string()
  })
  .meta({ id: "Tx" });

export const SwapQuoteSchema = z
  .object({
    chainId: ChainIdSchema,
    fromToken: TokenSchema,
    toToken: TokenSchema,
    amountIn: z.string(),
    amountOut: z.string(),
    minAmountOut: z.string(),
    priceImpactPct: z.number(),
    feeUsd: z.number(),
    route: z.array(z.string()),
    tx: TxSchema,
    ts: z.number()
  })
  .meta({ id: "SwapQuote" });

export const PoolSchema = z
  .object({
    chainId: ChainIdSchema,
    protocol: z.string(),
    address: z.string(),
    token0: TokenSchema,
    token1: TokenSchema,
    feeTier: z.number(),
    tvlUsd: z.number(),
    apyPct: z.number(),
    volume24hUsd: z.number(),
    reserves: z.object({ token0: z.string(), token1: z.string() }),
    ts: z.number()
  })
  .meta({ id: "Pool" });

export const AllowanceSchema = z
  .object({
    chainId: ChainIdSchema,
    owner: z.string(),
    spender: z.string(),
    token: TokenSchema,
    allowance: z.string(),
    ts: z.number()
  })
  .meta({ id: "Allowance" });

export const ApproveTxSchema = z
  .object({
    chainId: ChainIdSchema,
    owner: z.string(),
    spender: z.string(),
    token: TokenSchema,
    amount: z.string(),
    tx: TxSchema,
    ts: z.number()
  })
  .meta({ id: "ApproveTx" });

export const DefiPositionSchema = z
  .object({
    protocol: z.string(),
    type: DefiPositionTypeSchema,
    market: z.string(),
    suppliedUsd: z.number(),
    borrowedUsd: z.number(),
    netUsd: z.number(),
    rewardsUsd: z.number(),
    apyPct: z.number()
  })
  .meta({ id: "DefiPosition" });

export const DefiPositionsSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    positions: z.array(DefiPositionSchema),
    ts: z.number()
  })
  .meta({ id: "DefiPositions" });

export const LendingHealthSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    protocol: z.string(),
    healthFactor: z.number(),
    liquidationThresholdPct: z.number(),
    ltvPct: z.number(),
    suppliedUsd: z.number(),
    borrowedUsd: z.number(),
    availableBorrowUsd: z.number(),
    ts: z.number()
  })
  .meta({ id: "LendingHealth" });

export const CandleSchema = z
  .object({
    o: z.number(),
    h: z.number(),
    l: z.number(),
    c: z.number(),
    ts: z.number()
  })
  .meta({ id: "Candle" });

export const PnlBreakdownEntrySchema = z
  .object({ source: z.string(), pnlUsd: z.number() })
  .meta({ id: "PnlBreakdownEntry" });

export const PortfolioPnlSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    currency: z.literal("USD"),
    period: PnlPeriodSchema,
    pnlUsd: z.number(),
    pnlPct: z.number(),
    realizedPnlUsd: z.number(),
    unrealizedPnlUsd: z.number(),
    feesUsd: z.number(),
    startingValueUsd: z.number(),
    endingValueUsd: z.number(),
    breakdown: z.array(PnlBreakdownEntrySchema),
    ts: z.number()
  })
  .meta({ id: "PortfolioPnl" });

// ---- WebSocket event payloads ----
export const GpsEventSchema = z
  .object({ lat: z.number(), lng: z.number(), ts: z.number() })
  .meta({ id: "GpsEvent" });

export const BtcEventSchema = z
  .object({
    id: z.string(),
    channel: z.literal("btc"),
    ts: z.number(),
    payload: z.object({
      o: z.number(),
      h: z.number(),
      l: z.number(),
      c: z.number(),
      ts: z.number()
    })
  })
  .meta({ id: "BtcEvent" });

export const GenericEventSchema = z
  .object({
    id: z.string(),
    channel: z.string(),
    ts: z.number(),
    payload: z.object({
      kind: z.string(),
      message: z.string(),
      amount: z.number(),
      ip: z.string(),
      userAgent: z.string(),
      meta: z.object({ a: z.string(), b: z.string(), c: z.string() })
    })
  })
  .meta({ id: "GenericEvent" });

export const WsEventSchema = z
  .union([GpsEventSchema, BtcEventSchema, GenericEventSchema])
  .meta({ id: "WsEvent" });

// ---- response envelopes ----
export const HealthResponseSchema = z
  .object({ status: z.string(), uptime: z.number(), ts: z.number() })
  .meta({ id: "HealthResponse" });

export const PingResponseSchema = z
  .object({ ok: z.boolean(), now: z.string() })
  .meta({ id: "PingResponse" });

export const ErrorResponseSchema = z
  .object({ error: z.string(), message: z.string(), requestId: z.string().optional() })
  .meta({ id: "ErrorResponse" });

export const UploadResponseSchema = z
  .object({ filename: z.string(), mimetype: z.string(), size: z.number() })
  .meta({ id: "UploadResponse" });

export const UsersListSchema = z
  .object({
    items: z.array(UserSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number()
  })
  .meta({ id: "UsersList" });

export const UserWithDebugSchema = UserSchema.extend({
  debug: z.object({ traceId: z.string().nullable(), session: z.string().nullable() })
}).meta({ id: "UserWithDebug" });

export const TokensResponseSchema = z
  .object({ chainId: ChainIdSchema, items: z.array(TokenSchema), ts: z.number() })
  .meta({ id: "TokensResponse" });

export const PricesResponseSchema = z
  .object({ chainId: ChainIdSchema, items: z.array(TokenPriceSchema), ts: z.number() })
  .meta({ id: "PricesResponse" });

export const BalancesResponseSchema = z
  .object({
    chainId: ChainIdSchema,
    address: z.string(),
    items: z.array(BalanceSchema),
    ts: z.number()
  })
  .meta({ id: "BalancesResponse" });

export const CandlesResponseSchema = z
  .object({
    chainId: ChainIdSchema,
    baseToken: z.string().optional(),
    quoteToken: z.string(),
    interval: CandleIntervalSchema,
    startTs: z.number(),
    endTs: z.number(),
    limit: z.number(),
    items: z.array(CandleSchema)
  })
  .meta({ id: "CandlesResponse" });

export const TxSendResponseSchema = z
  .object({
    chainId: ChainIdSchema,
    hash: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
    value: z.string(),
    data: z.string(),
    submittedAt: z.number()
  })
  .meta({ id: "TxSendResponse" });

export const TxStatusResponseSchema = z
  .object({
    chainId: ChainIdSchema,
    hash: z.string(),
    status: z.enum(["pending", "confirmed", "failed"]),
    confirmations: z.number(),
    blockNumber: z.number().nullable(),
    gasUsed: z.number().nullable(),
    effectiveGasPriceGwei: z.number().nullable(),
    ts: z.number()
  })
  .meta({ id: "TxStatusResponse" });

export const MetricsResponseSchema = z
  .object({
    uptime: z.number(),
    ts: z.number(),
    memoryMb: z.number(),
    ws: z.object({
      connections: z.number(),
      subscriptions: z.number(),
      channels: z.record(z.string(), z.number())
    })
  })
  .meta({ id: "MetricsResponse" });

// ---- request bodies ----
export const CreateUserBodySchema = z
  .object({ email: z.string().optional(), name: z.string().optional() })
  .meta({ id: "CreateUserBody" });

export const CreateOrderBodySchema = z
  .object({ userId: z.string().optional(), itemsCount: z.number().optional() })
  .meta({ id: "CreateOrderBody" });

export const UpdateUserBodySchema = z
  .object({ status: UserStatusSchema.optional() })
  .meta({ id: "UpdateUserBody" });

export const SwapQuoteBodySchema = z
  .object({
    chainId: z.number().optional(),
    fromTokenAddress: z.string().optional(),
    toTokenAddress: z.string().optional(),
    amountIn: z.string().optional()
  })
  .meta({ id: "SwapQuoteBody" });

export const ApproveBodySchema = z
  .object({
    chainId: z.number().optional(),
    owner: z.string().optional(),
    spender: z.string().optional(),
    tokenAddress: z.string().optional(),
    amount: z.string().optional()
  })
  .meta({ id: "ApproveBody" });

export const TxSendBodySchema = z
  .object({
    chainId: z.number().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    value: z.string().optional(),
    data: z.string().optional()
  })
  .meta({ id: "TxSendBody" });
