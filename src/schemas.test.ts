import { describe, it, expect } from "vitest";
import type { ZodType } from "zod";
import {
  fakeAllowance,
  fakeApproveTx,
  fakeBalance,
  fakeCandles,
  fakeDefiPositions,
  fakeEvent,
  fakeLendingHealth,
  fakeOrder,
  fakePool,
  fakePortfolioPnl,
  fakeSwapQuote,
  fakeToken,
  fakeTokenPrice,
  fakeUser
} from "./fake.js";
import {
  AllowanceSchema,
  ApproveTxSchema,
  BalanceSchema,
  CandleSchema,
  DefiPositionsSchema,
  LendingHealthSchema,
  OrderSchema,
  PoolSchema,
  PortfolioPnlSchema,
  SwapQuoteSchema,
  TokenPriceSchema,
  TokenSchema,
  UserSchema,
  WsEventSchema
} from "./schemas.js";

// Drift guard: every generator's output must satisfy the zod schema that the
// OpenAPI components are generated from. Run each many times to hit the random
// branches (e.g. negative PnL, nullable tx fields).
function expectSatisfies(schema: ZodType, value: unknown) {
  const r = schema.safeParse(value);
  if (!r.success) {
    throw new Error(`schema mismatch: ${JSON.stringify(r.error.issues, null, 2)}`);
  }
  expect(r.success).toBe(true);
}

const cases: Array<[string, ZodType, () => unknown]> = [
  ["User", UserSchema, () => fakeUser()],
  ["Order", OrderSchema, () => fakeOrder()],
  ["Token", TokenSchema, () => fakeToken()],
  ["TokenPrice", TokenPriceSchema, () => fakeTokenPrice()],
  ["Balance", BalanceSchema, () => fakeBalance()],
  ["SwapQuote", SwapQuoteSchema, () => fakeSwapQuote()],
  ["Pool", PoolSchema, () => fakePool()],
  ["Allowance", AllowanceSchema, () => fakeAllowance()],
  ["ApproveTx", ApproveTxSchema, () => fakeApproveTx()],
  ["DefiPositions", DefiPositionsSchema, () => fakeDefiPositions()],
  ["LendingHealth", LendingHealthSchema, () => fakeLendingHealth()],
  ["PortfolioPnl", PortfolioPnlSchema, () => fakePortfolioPnl()]
];

describe("generators satisfy their zod schemas", () => {
  it.each(cases)("fake%s output matches its schema", (_name, schema, gen) => {
    for (let i = 0; i < 30; i++) expectSatisfies(schema, gen());
  });

  it("fakeCandles output matches Candle[]", () => {
    const items = fakeCandles({ interval: "1m", startTs: 0, endTs: 600_000, limit: 5 });
    for (const c of items) expectSatisfies(CandleSchema, c);
  });

  it("fakeEvent output matches WsEvent for each channel", () => {
    for (const channel of ["gps", "btc", "orders", "anything"]) {
      for (let i = 0; i < 10; i++) expectSatisfies(WsEventSchema, fakeEvent(channel));
    }
  });
});
