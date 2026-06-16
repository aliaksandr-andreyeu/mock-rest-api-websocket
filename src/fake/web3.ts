import { faker } from "@faker-js/faker";
import type {
  Allowance,
  ApproveTx,
  Balance,
  Candle,
  CandleInterval,
  ChainId,
  DefiPositions,
  LendingHealth,
  Pool,
  PortfolioPnl,
  SwapQuote,
  Token,
  TokenPrice
} from "../types.js";

const CHAIN_IDS: readonly ChainId[] = [1, 10, 56, 137, 42161];

export function fakeChainId(input?: unknown): ChainId {
  const n = Number(input);
  if (CHAIN_IDS.includes(n as ChainId)) return n as ChainId;
  return faker.helpers.arrayElement(CHAIN_IDS);
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

export function fakeToken(partial?: Partial<Token>): Token {
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

export function fakeTokenPrice(partial?: Partial<TokenPrice>): TokenPrice {
  return {
    chainId: partial?.chainId ?? fakeChainId(),
    address: partial?.address ?? fakeAddress(),
    symbol: partial?.symbol ?? faker.finance.currencyCode(),
    priceUsd:
      partial?.priceUsd ?? faker.number.float({ min: 0.01, max: 100000, fractionDigits: 6 }),
    change24hPct:
      partial?.change24hPct ?? faker.number.float({ min: -25, max: 25, fractionDigits: 2 }),
    ts: partial?.ts ?? Date.now()
  };
}

export function fakeBalance(partial?: Partial<Balance> & { chainId?: ChainId }): Balance {
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

export function fakeSwapQuote(partial?: Partial<SwapQuote>): SwapQuote {
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
  const route = partial?.route ?? [
    fromToken.symbol,
    faker.helpers.arrayElement(["USDC", "WETH", "DAI", "USDT"]),
    toToken.symbol
  ];

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

export function fakePool(partial?: Partial<Pool>): Pool {
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

export function fakeAllowance(partial?: Partial<Allowance>): Allowance {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  return {
    chainId,
    owner: partial?.owner ?? fakeAddress(),
    spender: partial?.spender ?? fakeAddress(),
    token: partial?.token ?? fakeToken({ chainId }),
    allowance:
      partial?.allowance ??
      faker.number.float({ min: 0, max: 100000, fractionDigits: 6 }).toString(),
    ts
  };
}

export function fakeApproveTx(partial?: Partial<ApproveTx>): ApproveTx {
  const ts = partial?.ts ?? Date.now();
  const chainId = partial?.chainId ?? fakeChainId();
  const token = partial?.token ?? fakeToken({ chainId });
  return {
    chainId,
    owner: partial?.owner ?? fakeAddress(),
    spender: partial?.spender ?? fakeAddress(),
    token,
    amount:
      partial?.amount ?? faker.number.float({ min: 0, max: 100000, fractionDigits: 6 }).toString(),
    tx: partial?.tx ?? {
      to: token.address,
      data: `0x${hexNoPrefix(200)}`,
      value: "0",
      gasLimit: faker.number.int({ min: 45_000, max: 150_000 }).toString()
    },
    ts
  };
}

export function fakeDefiPositions(partial?: Partial<DefiPositions>): DefiPositions {
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

export function fakeLendingHealth(partial?: Partial<LendingHealth>): LendingHealth {
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

export function fakeCandles(params: {
  basePriceUsd?: number;
  interval: CandleInterval;
  startTs: number;
  endTs: number;
  limit: number;
}): Candle[] {
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

  const out: Candle[] = [];
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

export function fakePortfolioPnl(partial?: Partial<PortfolioPnl>): PortfolioPnl {
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
      // pnlUsd may be negative, so order the bounds explicitly.
      pnlUsd: faker.number.float({
        min: Math.min(pnlUsd * 0.6, pnlUsd * 1.2),
        max: Math.max(pnlUsd * 0.6, pnlUsd * 1.2),
        fractionDigits: 2
      })
    },
    { source: "rewards", pnlUsd: faker.number.float({ min: -500, max: 5000, fractionDigits: 2 }) },
    { source: "fees", pnlUsd: Number((-feesUsd).toFixed(2)) }
  ];

  return {
    chainId,
    address,
    currency: "USD",
    period: partial?.period ?? faker.helpers.arrayElement(["1d", "7d", "30d", "90d", "1y"]),
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
