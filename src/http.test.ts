import http from "node:http";
import { afterAll, beforeAll, describe, it, expect } from "vitest";
import request from "supertest";
import { createHttpApp } from "./http.js";

// Bind one server for the whole file instead of letting supertest spin up a
// fresh ephemeral listener per request (that pattern flakes under load).
let server: http.Server;

beforeAll(async () => {
  server = http.createServer(createHttpApp());
  await new Promise<void>((resolve) => server.listen(0, resolve));
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("core REST endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await request(server).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("GET /api/ping sets a request id header", async () => {
    const res = await request(server).get("/api/ping");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("sets security headers (helmet)", async () => {
    const res = await request(server).get("/api/ping");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("GET /api/metrics returns process + ws stats", async () => {
    const res = await request(server).get("/api/metrics");
    expect(res.status).toBe(200);
    expect(typeof res.body.uptime).toBe("number");
    expect(typeof res.body.memoryMb).toBe("number");
    expect(res.body.ws).toMatchObject({
      connections: expect.any(Number),
      subscriptions: expect.any(Number),
      channels: expect.any(Object)
    });
  });

  it("honors an inbound x-request-id", async () => {
    const res = await request(server).get("/api/ping").set("x-request-id", "fixed-id");
    expect(res.headers["x-request-id"]).toBe("fixed-id");
  });

  it("GET /api/users clamps the limit", async () => {
    const res = await request(server).get("/api/users?limit=9999");
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
    expect(res.body.items).toHaveLength(100);
  });

  it("GET /api/users floors a negative offset to 0", async () => {
    const res = await request(server).get("/api/users?offset=-5");
    expect(res.body.offset).toBe(0);
  });

  it("POST /api/users echoes provided email and returns 201", async () => {
    const res = await request(server).post("/api/users").send({ email: "x@y.com" });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("x@y.com");
  });

  it("PATCH /api/users/:id keeps a valid status and drops an invalid one", async () => {
    const ok = await request(server).patch("/api/users/1").send({ status: "active" });
    expect(ok.body.status).toBe("active");
    const bad = await request(server).patch("/api/users/1").send({ status: "nope" });
    expect(["active", "blocked", "pending"]).toContain(bad.body.status);
  });

  it("DELETE /api/users/:id returns 204", async () => {
    const res = await request(server).delete("/api/users/1");
    expect(res.status).toBe(204);
  });

  it("POST /api/files/upload without a file returns 400", async () => {
    const res = await request(server).post("/api/files/upload");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequest");
    expect(res.body.requestId).toBeTruthy();
  });

  it("POST /api/files/upload with a file returns metadata", async () => {
    const res = await request(server)
      .post("/api/files/upload")
      .attach("file", Buffer.from("hello"), "hello.txt");
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe("hello.txt");
    expect(res.body.size).toBe(5);
  });

  it("POST /api/files/upload over the size limit returns 413", async () => {
    // UPLOAD_MAX_BYTES is 2048 in the test env (vitest.config.ts).
    const res = await request(server)
      .post("/api/files/upload")
      .attach("file", Buffer.alloc(4096, 0x61), "big.bin");
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("PayloadTooLarge");
  });

  it("GET /api/error returns a 500 envelope", async () => {
    const res = await request(server).get("/api/error");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("InternalError");
  });

  it("unknown route returns a 404 envelope", async () => {
    const res = await request(server).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NotFound");
    expect(res.body.message).toContain("/nope");
  });
});

describe("web3 endpoints", () => {
  it("GET /api/web3/tokens clamps and returns items", async () => {
    const res = await request(server).get("/api/web3/tokens?chainId=1&limit=3");
    expect(res.status).toBe(200);
    expect(res.body.chainId).toBe(1);
    expect(res.body.items).toHaveLength(3);
  });

  it("POST /api/web3/defi/swap/quote returns a quote", async () => {
    const res = await request(server)
      .post("/api/web3/defi/swap/quote")
      .send({ chainId: 1, amountIn: "1.0" });
    expect(res.status).toBe(200);
    expect(res.body.amountIn).toBe("1.0");
    expect(Array.isArray(res.body.route)).toBe(true);
  });

  it("GET /api/web3/candles respects interval and limit", async () => {
    const res = await request(server).get("/api/web3/candles?baseToken=WETH&interval=5m&limit=10");
    expect(res.status).toBe(200);
    expect(res.body.interval).toBe("5m");
    expect(res.body.items.length).toBeLessThanOrEqual(10);
  });

  const addr = "0x1111111111111111111111111111111111111111";

  it.each([
    ["GET", "/api/web3/prices?chainId=1", 200],
    ["GET", `/api/web3/wallets/${addr}/balances?chainId=1&limit=2`, 200],
    ["GET", `/api/web3/defi/pools/${addr}?chainId=1`, 200],
    [
      "GET",
      `/api/web3/allowance?chainId=1&owner=${addr}&spender=${addr}&tokenAddress=${addr}`,
      200
    ],
    ["GET", `/api/web3/defi/positions?chainId=1&address=${addr}`, 200],
    ["GET", `/api/web3/defi/lending/health?chainId=1&address=${addr}&protocol=aave-v3`, 200],
    ["GET", `/api/web3/portfolio/pnl?chainId=1&address=${addr}&period=7d`, 200],
    ["GET", "/api/web3/tx/0xabc?chainId=1", 200]
  ])("%s %s -> %i", async (method, path, status) => {
    const res = await request(server)[method.toLowerCase() as "get"](path);
    expect(res.status).toBe(status);
  });

  it("POST /api/web3/approve and /api/web3/tx/send return 2xx", async () => {
    const approve = await request(server)
      .post("/api/web3/approve")
      .send({ chainId: 1, owner: addr, spender: addr, tokenAddress: addr, amount: "100" });
    expect(approve.status).toBe(200);

    const send = await request(server)
      .post("/api/web3/tx/send")
      .send({ chainId: 1, from: addr, to: addr, value: "0", data: "0x" });
    expect(send.status).toBe(201);
    expect(send.body.hash).toMatch(/^0x/);
  });
});

describe("more core endpoints", () => {
  it("GET /api/users/:id includes debug from header and cookie", async () => {
    const res = await request(server)
      .get("/api/users/42")
      .set("x-trace-id", "trace-1")
      .set("Cookie", "session=sess-1");
    expect(res.body.id).toBe("42");
    expect(res.body.debug).toEqual({ traceId: "trace-1", session: "sess-1" });
  });

  it("PUT /api/users/:id echoes the id", async () => {
    const res = await request(server).put("/api/users/99").send({ name: "x" });
    expect(res.body.id).toBe("99");
  });

  it("GET /api/orders honors userId and limit", async () => {
    const res = await request(server).get("/api/orders?userId=u9&limit=2");
    expect(res.body).toHaveLength(2);
    expect(res.body[0].userId).toBe("u9");
  });

  it("POST /api/echo reflects body and query", async () => {
    const res = await request(server).post("/api/echo?q=1").send({ hello: "world" });
    expect(res.body.body).toEqual({ hello: "world" });
    expect(res.body.query).toEqual({ q: "1" });
  });
});
