import { faker } from "@faker-js/faker";

export type UserStatus = "active" | "blocked" | "pending";

export function fakeUser(
  partial?: Partial<{
    id: string;
    email: string;
    name: string;
    status: UserStatus;
    createdAt: string;
  }>
) {
  const status: UserStatus = faker.helpers.arrayElement(["active", "blocked", "pending"]);
  return {
    id: partial?.id ?? faker.string.uuid(),
    email: partial?.email ?? faker.internet.email(),
    name: partial?.name ?? faker.person.fullName(),
    status: partial?.status ?? status,
    createdAt: partial?.createdAt ?? faker.date.past().toISOString()
  };
}

export function fakeOrder(
  partial?: Partial<{
    id: string;
    userId: string;
    total: number;
    currency: string;
    itemsCount: number;
    createdAt: string;
  }>
) {
  return {
    id: partial?.id ?? faker.string.uuid(),
    userId: partial?.userId ?? faker.string.uuid(),
    total: partial?.total ?? faker.number.float({ min: 5, max: 5000, fractionDigits: 2 }),
    currency: partial?.currency ?? faker.finance.currencyCode(),
    itemsCount: partial?.itemsCount ?? faker.number.int({ min: 1, max: 12 }),
    createdAt: partial?.createdAt ?? faker.date.recent({ days: 30 }).toISOString()
  };
}

export type ChainId = 1 | 10 | 56 | 137 | 42161;

export function fakeChainId(input?: unknown): ChainId {
  const n = Number(input);
  const supported: ChainId[] = [1, 10, 56, 137, 42161];
  if (supported.includes(n as ChainId)) return n as ChainId;
  return faker.helpers.arrayElement(supported);
}

function hexNoPrefix(len: number): string {
  return faker.string.hexadecimal({ length: len, casing: "lower" }).replace(/^0x/, "");
}

export function fakeAddress(): string {
  return `0x${hexNoPrefix(40)}`;
}

export function fakeTxHash(): string {
  return `0x${hexNoPrefix(64)}`;
}

export function fakeToken(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUrl: string;
  }>
) {
  const symbol =
    partial?.symbol ??
    faker.helpers.arrayElement(["WETH", "USDC", "USDT", "DAI", "WBTC", "LINK", "UNI", "AAVE"]);
  return {
    chainId: partial?.chainId ?? fakeChainId(),
    address: partial?.address ?? fakeAddress(),
    symbol,
    name: partial?.name ?? `${symbol} Token`,
    decimals: partial?.decimals ?? faker.helpers.arrayElement([6, 8, 18]),
    logoUrl: partial?.logoUrl ?? faker.image.url({ width: 128, height: 128 })
  };
}

export function fakeTokenPrice(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    symbol: string;
    priceUsd: number;
    change24hPct: number;
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const priceUsd =
    partial?.priceUsd ?? faker.number.float({ min: 0.01, max: 100000, fractionDigits: 6 });
  return {
    chainId: partial?.chainId ?? fakeChainId(),
    address: partial?.address ?? fakeAddress(),
    symbol: partial?.symbol ?? faker.finance.currencyCode(),
    priceUsd,
    change24hPct:
      partial?.change24hPct ?? faker.number.float({ min: -25, max: 25, fractionDigits: 2 }),
    ts
  };
}

export function fakeBalance(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    token: ReturnType<typeof fakeToken>;
    balance: string;
    balanceUsd: number;
  }>
) {
  const token = partial?.token ?? fakeToken({ chainId: partial?.chainId });
  const raw = faker.number.float({ min: 0, max: 10000, fractionDigits: 6 });
  return {
    chainId: partial?.chainId ?? token.chainId,
    address: partial?.address ?? fakeAddress(),
    token,
    balance: partial?.balance ?? raw.toFixed(6),
    balanceUsd:
      partial?.balanceUsd ?? faker.number.float({ min: 0, max: 500000, fractionDigits: 2 })
  };
}

export function fakeSwapQuote(
  partial?: Partial<{
    chainId: ChainId;
    fromToken: ReturnType<typeof fakeToken>;
    toToken: ReturnType<typeof fakeToken>;
    amountIn: string;
    amountOut: string;
    minAmountOut: string;
    priceImpactPct: number;
    feeUsd: number;
    route: string[];
    tx: { to: string; data: string; value: string; gasLimit: string };
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const fromToken =
    partial?.fromToken ??
    fakeToken({ chainId, symbol: faker.helpers.arrayElement(["WETH", "USDC", "WBTC", "DAI"]) });
  const toToken =
    partial?.toToken ??
    fakeToken({
      chainId,
      symbol: faker.helpers.arrayElement(["USDC", "WETH", "WBTC", "USDT", "DAI"])
    });
  const amountIn =
    partial?.amountIn ?? faker.number.float({ min: 0.001, max: 5, fractionDigits: 6 }).toString();
  const amountOut =
    partial?.amountOut ??
    faker.number.float({ min: 0.5, max: 50000, fractionDigits: 6 }).toString();
  const minAmountOut =
    partial?.minAmountOut ??
    faker.number
      .float({ min: Number(amountOut) * 0.97, max: Number(amountOut) * 0.999, fractionDigits: 6 })
      .toString();
  const route =
    partial?.route ??
    ([
      fromToken.symbol,
      faker.helpers.arrayElement(["USDC", "WETH", "DAI", "USDT"]),
      toToken.symbol
    ].filter(Boolean) as string[]);

  return {
    chainId,
    fromToken,
    toToken,
    amountIn,
    amountOut,
    minAmountOut,
    priceImpactPct:
      partial?.priceImpactPct ?? faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
    feeUsd: partial?.feeUsd ?? faker.number.float({ min: 0.01, max: 50, fractionDigits: 2 }),
    route,
    tx: partial?.tx ?? {
      to: fakeAddress(),
      data: `0x${hexNoPrefix(256)}`,
      value: "0",
      gasLimit: faker.number.int({ min: 80_000, max: 350_000 }).toString()
    },
    ts
  };
}

export function fakePool(
  partial?: Partial<{
    chainId: ChainId;
    protocol: string;
    address: string;
    token0: ReturnType<typeof fakeToken>;
    token1: ReturnType<typeof fakeToken>;
    feeTier: number;
    tvlUsd: number;
    apyPct: number;
    volume24hUsd: number;
    reserves: { token0: string; token1: string };
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const token0 =
    partial?.token0 ??
    fakeToken({ chainId, symbol: faker.helpers.arrayElement(["WETH", "WBTC", "USDC"]) });
  const token1 =
    partial?.token1 ??
    fakeToken({ chainId, symbol: faker.helpers.arrayElement(["USDC", "USDT", "DAI"]) });
  return {
    chainId,
    protocol:
      partial?.protocol ??
      faker.helpers.arrayElement(["uniswap-v3", "aave-v3", "curve", "balancer", "sushiswap"]),
    address: partial?.address ?? fakeAddress(),
    token0,
    token1,
    feeTier: partial?.feeTier ?? faker.helpers.arrayElement([100, 500, 3000, 10000]),
    tvlUsd:
      partial?.tvlUsd ?? faker.number.float({ min: 50_000, max: 5_000_000_000, fractionDigits: 2 }),
    apyPct: partial?.apyPct ?? faker.number.float({ min: 0, max: 120, fractionDigits: 2 }),
    volume24hUsd:
      partial?.volume24hUsd ??
      faker.number.float({ min: 0, max: 2_000_000_000, fractionDigits: 2 }),
    reserves: partial?.reserves ?? {
      token0: faker.number.float({ min: 1, max: 10000, fractionDigits: 6 }).toString(),
      token1: faker.number.float({ min: 1, max: 50_000_000, fractionDigits: 2 }).toString()
    },
    ts
  };
}

export function fakeAllowance(
  partial?: Partial<{
    chainId: ChainId;
    owner: string;
    spender: string;
    token: ReturnType<typeof fakeToken>;
    allowance: string;
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const owner = partial?.owner ?? fakeAddress();
  const spender = partial?.spender ?? fakeAddress();
  const token = partial?.token ?? fakeToken({ chainId });
  return {
    chainId,
    owner,
    spender,
    token,
    allowance:
      partial?.allowance ??
      faker.number.float({ min: 0, max: 100000, fractionDigits: 6 }).toString(),
    ts
  };
}

export function fakeApproveTx(
  partial?: Partial<{
    chainId: ChainId;
    owner: string;
    spender: string;
    token: ReturnType<typeof fakeToken>;
    amount: string;
    tx: { to: string; data: string; value: string; gasLimit: string };
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const owner = partial?.owner ?? fakeAddress();
  const spender = partial?.spender ?? fakeAddress();
  const token = partial?.token ?? fakeToken({ chainId });
  const amount =
    partial?.amount ?? faker.number.float({ min: 0, max: 100000, fractionDigits: 6 }).toString();
  return {
    chainId,
    owner,
    spender,
    token,
    amount,
    tx: partial?.tx ?? {
      to: token.address,
      data: `0x${hexNoPrefix(200)}`,
      value: "0",
      gasLimit: faker.number.int({ min: 45_000, max: 150_000 }).toString()
    },
    ts
  };
}

export function fakeDefiPositions(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    positions: Array<{
      protocol: string;
      type: "lp" | "lending" | "staking";
      market: string;
      suppliedUsd: number;
      borrowedUsd: number;
      netUsd: number;
      rewardsUsd: number;
      apyPct: number;
    }>;
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const address = partial?.address ?? fakeAddress();
  const positions =
    partial?.positions ??
    Array.from({ length: faker.number.int({ min: 1, max: 8 }) }, () => {
      const suppliedUsd = faker.number.float({ min: 0, max: 250_000, fractionDigits: 2 });
      const borrowedUsd = faker.number.float({
        min: 0,
        max: suppliedUsd * 0.85,
        fractionDigits: 2
      });
      const netUsd = suppliedUsd - borrowedUsd;
      return {
        protocol: faker.helpers.arrayElement([
          "uniswap-v3",
          "aave-v3",
          "compound-v3",
          "curve",
          "lido"
        ]),
        type: faker.helpers.arrayElement(["lp", "lending", "staking"] as const),
        market: faker.helpers.arrayElement([
          "WETH/USDC",
          "WBTC/USDT",
          "DAI",
          "USDC",
          "stETH",
          "ARB",
          "OP"
        ]),
        suppliedUsd,
        borrowedUsd,
        netUsd: Number(netUsd.toFixed(2)),
        rewardsUsd: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
        apyPct: faker.number.float({ min: -20, max: 200, fractionDigits: 2 })
      };
    });
  return { chainId, address, positions, ts };
}

export function fakeLendingHealth(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    protocol: string;
    healthFactor: number;
    liquidationThresholdPct: number;
    ltvPct: number;
    suppliedUsd: number;
    borrowedUsd: number;
    availableBorrowUsd: number;
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const address = partial?.address ?? fakeAddress();
  const suppliedUsd =
    partial?.suppliedUsd ?? faker.number.float({ min: 0, max: 500_000, fractionDigits: 2 });
  const borrowedUsd =
    partial?.borrowedUsd ??
    faker.number.float({ min: 0, max: suppliedUsd * 0.9, fractionDigits: 2 });
  const ltvPct =
    partial?.ltvPct ??
    (suppliedUsd === 0 ? 0 : Number(((borrowedUsd / suppliedUsd) * 100).toFixed(2)));
  const liquidationThresholdPct =
    partial?.liquidationThresholdPct ??
    faker.number.float({ min: Math.max(ltvPct, 50), max: 95, fractionDigits: 2 });
  const healthFactor =
    partial?.healthFactor ??
    (borrowedUsd === 0
      ? 99
      : Number((((liquidationThresholdPct / 100) * suppliedUsd) / borrowedUsd).toFixed(4)));
  const availableBorrowUsd =
    partial?.availableBorrowUsd ??
    Math.max(0, suppliedUsd * (liquidationThresholdPct / 100) - borrowedUsd);

  return {
    chainId,
    address,
    protocol: partial?.protocol ?? faker.helpers.arrayElement(["aave-v3", "compound-v3", "spark"]),
    healthFactor,
    liquidationThresholdPct,
    ltvPct,
    suppliedUsd: Number(suppliedUsd.toFixed(2)),
    borrowedUsd: Number(borrowedUsd.toFixed(2)),
    availableBorrowUsd: Number(availableBorrowUsd.toFixed(2)),
    ts
  };
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export function fakeCandles(params: {
  basePriceUsd?: number;
  interval: CandleInterval;
  startTs: number;
  endTs: number;
  limit: number;
}) {
  const stepMs =
    params.interval === "1m"
      ? 60_000
      : params.interval === "5m"
        ? 5 * 60_000
        : params.interval === "15m"
          ? 15 * 60_000
          : params.interval === "1h"
            ? 60 * 60_000
            : params.interval === "4h"
              ? 4 * 60 * 60_000
              : 24 * 60 * 60_000;

  const limit = Math.max(1, Math.min(params.limit, 5000));
  const end = params.endTs;
  const start = Math.max(params.startTs, end - stepMs * limit);

  const out: Array<{ o: number; h: number; l: number; c: number; ts: number }> = [];
  let price = params.basePriceUsd ?? faker.number.float({ min: 0.5, max: 5000, fractionDigits: 6 });
  for (let ts = start; ts <= end && out.length < limit; ts += stepMs) {
    const o = price;
    const drift = faker.number.float({ min: -0.02, max: 0.02, fractionDigits: 6 }); // +/-2%
    const c = o * (1 + drift);
    const wick = faker.number.float({ min: 0, max: 0.01, fractionDigits: 6 }); // up to 1%
    const h = Math.max(o, c) * (1 + wick);
    const l = Math.min(o, c) * (1 - wick);
    out.push({
      o: Number(o.toFixed(6)),
      h: Number(h.toFixed(6)),
      l: Number(l.toFixed(6)),
      c: Number(c.toFixed(6)),
      ts
    });
    price = c;
  }
  return out;
}

export function fakePortfolioPnl(
  partial?: Partial<{
    chainId: ChainId;
    address: string;
    currency: "USD";
    period: "1d" | "7d" | "30d" | "90d" | "1y";
    pnlUsd: number;
    pnlPct: number;
    realizedPnlUsd: number;
    unrealizedPnlUsd: number;
    feesUsd: number;
    startingValueUsd: number;
    endingValueUsd: number;
    breakdown: Array<{ source: string; pnlUsd: number }>;
    ts: number;
  }>
) {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const address = partial?.address ?? fakeAddress();
  const startingValueUsd =
    partial?.startingValueUsd ?? faker.number.float({ min: 10, max: 2_000_000, fractionDigits: 2 });
  const pnlUsd =
    partial?.pnlUsd ??
    faker.number.float({
      min: -startingValueUsd * 0.5,
      max: startingValueUsd * 0.5,
      fractionDigits: 2
    });
  const endingValueUsd = partial?.endingValueUsd ?? Number((startingValueUsd + pnlUsd).toFixed(2));
  const feesUsd = partial?.feesUsd ?? faker.number.float({ min: 0, max: 2000, fractionDigits: 2 });
  const realizedPnlUsd =
    partial?.realizedPnlUsd ??
    faker.number.float({
      min: pnlUsd - Math.abs(pnlUsd) * 0.5,
      max: pnlUsd + Math.abs(pnlUsd) * 0.5,
      fractionDigits: 2
    });
  const unrealizedPnlUsd =
    partial?.unrealizedPnlUsd ?? Number((pnlUsd - realizedPnlUsd).toFixed(2));
  const pnlPct =
    partial?.pnlPct ??
    (startingValueUsd === 0 ? 0 : Number(((pnlUsd / startingValueUsd) * 100).toFixed(2)));
  const breakdown = partial?.breakdown ?? [
    {
      source: "price",
      pnlUsd: faker.number.float({ min: pnlUsd * 0.6, max: pnlUsd * 1.2, fractionDigits: 2 })
    },
    { source: "rewards", pnlUsd: faker.number.float({ min: -500, max: 5000, fractionDigits: 2 }) },
    { source: "fees", pnlUsd: Number((-feesUsd).toFixed(2)) }
  ];

  return {
    chainId,
    address,
    currency: "USD" as const,
    period:
      partial?.period ?? faker.helpers.arrayElement(["1d", "7d", "30d", "90d", "1y"] as const),
    pnlUsd: Number(pnlUsd.toFixed(2)),
    pnlPct,
    realizedPnlUsd: Number(realizedPnlUsd.toFixed(2)),
    unrealizedPnlUsd,
    feesUsd: Number(feesUsd.toFixed(2)),
    startingValueUsd: Number(startingValueUsd.toFixed(2)),
    endingValueUsd,
    breakdown,
    ts
  };
}

export function fakeEvent(channel: string) {
  const ts = Date.now();
  if (channel.toLowerCase() === "btc") {
    const base = faker.number.float({ min: 20000, max: 120000, fractionDigits: 2 });
    const delta = faker.number.float({ min: 0.01, max: 0.05, fractionDigits: 4 }); // up to ~5%

    const o = base;
    const c = Number(
      (base * faker.number.float({ min: 1 - delta, max: 1 + delta, fractionDigits: 6 })).toFixed(2)
    );
    const high = Math.max(o, c) * faker.number.float({ min: 1, max: 1 + delta, fractionDigits: 6 });
    const low = Math.min(o, c) * faker.number.float({ min: 1 - delta, max: 1, fractionDigits: 6 });

    const h = Number(high.toFixed(2));
    const l = Number(low.toFixed(2));

    return {
      id: faker.string.uuid(),
      channel: "btc",
      ts,
      payload: { o, h, l, c, ts }
    };
  }

  if (channel.toLowerCase() === "gps") {
    const lat = faker.number.float({ min: -85, max: 85, fractionDigits: 6 });
    const lng = faker.number.float({ min: -180, max: 180, fractionDigits: 6 });
    // For gps we want a simplified shape: { lat, lng, ts }
    return { lat, lng, ts };
  }

  return {
    id: faker.string.uuid(),
    channel,
    ts,
    payload: {
      kind: faker.helpers.arrayElement(["created", "updated", "deleted", "heartbeat"]),
      message: faker.lorem.sentence(),
      amount: faker.number.float({ min: 1, max: 9999, fractionDigits: 2 }),
      ip: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      meta: faker.helpers.objectEntry({
        a: faker.string.alphanumeric(8),
        b: faker.string.alphanumeric(8),
        c: faker.string.alphanumeric(8)
      })
    }
  };
}
