import { afterEach, describe, it, expect, vi } from "vitest";
import { faker } from "@faker-js/faker";
import {
  fakeCandles,
  fakeChainId,
  fakeEvent,
  fakeLendingHealth,
  fakeOrder,
  fakePortfolioPnl,
  fakeUser
} from "./fake.js";

describe("fakeChainId", () => {
  it("clamps unsupported input to a supported chain", () => {
    expect(fakeChainId(1)).toBe(1);
    expect(fakeChainId("137")).toBe(137);
    const fallback = fakeChainId(999999);
    expect([1, 10, 56, 137, 42161]).toContain(fallback);
  });
});

describe("fakeUser", () => {
  it("honors provided fields and produces a valid status", () => {
    const u = fakeUser({ id: "abc", email: "a@b.com", status: "blocked" });
    expect(u.id).toBe("abc");
    expect(u.email).toBe("a@b.com");
    expect(u.status).toBe("blocked");
    expect(typeof u.createdAt).toBe("string");
  });
});

describe("fakeOrder", () => {
  it("respects provided userId and itemsCount", () => {
    const o = fakeOrder({ userId: "u1", itemsCount: 3 });
    expect(o.userId).toBe("u1");
    expect(o.itemsCount).toBe(3);
    expect(o.total).toBeGreaterThan(0);
  });
});

describe("fakeCandles", () => {
  it("returns monotonically increasing timestamps within the limit", () => {
    const items = fakeCandles({ interval: "1m", startTs: 0, endTs: 600_000, limit: 5 });
    expect(items.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < items.length; i++) {
      expect(items[i]!.ts).toBeGreaterThan(items[i - 1]!.ts);
      expect(items[i]!.h).toBeGreaterThanOrEqual(items[i]!.l);
    }
  });
});

describe("fakeLendingHealth", () => {
  it("derives consistent ltv and a non-negative available borrow", () => {
    const h = fakeLendingHealth({ suppliedUsd: 1000, borrowedUsd: 500 });
    expect(h.ltvPct).toBeCloseTo(50, 1);
    expect(h.availableBorrowUsd).toBeGreaterThanOrEqual(0);
    expect(h.healthFactor).toBeGreaterThan(0);
  });
});

describe("fakePortfolioPnl", () => {
  it("does not throw for negative pnl (faker bound ordering)", () => {
    expect(() => fakePortfolioPnl({ pnlUsd: -100, startingValueUsd: 1000 })).not.toThrow();
    const p = fakePortfolioPnl({ pnlUsd: -100, startingValueUsd: 1000 });
    expect(p.pnlUsd).toBe(-100);
    expect(p.breakdown.length).toBeGreaterThan(0);
  });
});

describe("fakeEvent payload shapes", () => {
  it("gps is flat, btc/orders are wrapped", () => {
    const gps = fakeEvent("gps") as Record<string, unknown>;
    expect(gps).toHaveProperty("lat");
    expect(gps).toHaveProperty("lng");
    expect(gps).not.toHaveProperty("payload");

    const btc = fakeEvent("btc") as Record<string, unknown>;
    expect(btc).toHaveProperty("payload");
    expect(btc.payload).toMatchObject({ o: expect.any(Number), c: expect.any(Number) });

    const orders = fakeEvent("orders") as { payload: { meta: unknown } };
    expect(orders.payload).toHaveProperty("meta");
    // meta is an object (not a faker tuple) — matches README contract
    expect(orders.payload.meta).toMatchObject({
      a: expect.any(String),
      b: expect.any(String),
      c: expect.any(String)
    });
  });
});

describe("determinism with a seed", () => {
  afterEach(() => vi.useRealTimers());

  it("produces identical output for the same seed", () => {
    // Date helpers (faker.date.past) use the wall clock as their reference, so
    // reproducibility needs both a fixed seed AND a frozen clock.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-01T00:00:00Z"));
    faker.seed(42);
    const a = fakeUser();
    faker.seed(42);
    const b = fakeUser();
    expect(a).toEqual(b);
  });
});
