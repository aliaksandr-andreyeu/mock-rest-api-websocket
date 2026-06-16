import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { attachWebSocketServer } from "./ws.js";

let server: http.Server;
let close: () => Promise<void>;
let url: string;

beforeAll(async () => {
  server = http.createServer();
  const ws = attachWebSocketServer(server);
  close = ws.close;
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  url = `ws://localhost:${port}/ws`;
});

afterAll(async () => {
  await close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Open a socket and collect server messages until `predicate` is satisfied. */
function connect(): WebSocket {
  return new WebSocket(url);
}

function nextMessage(ws: WebSocket, match: (m: any) => boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out waiting for message")), 4000);
    function onMsg(raw: WebSocket.RawData) {
      const msg = JSON.parse(raw.toString());
      if (match(msg)) {
        clearTimeout(timer);
        ws.off("message", onMsg);
        resolve(msg);
      }
    }
    ws.on("message", onMsg);
  });
}

describe("WebSocket protocol", () => {
  it("sends a welcome on connect", async () => {
    const ws = connect();
    const welcome = await nextMessage(ws, (m) => m.type === "welcome");
    expect(welcome.clientId).toBeTruthy();
    expect(welcome.channels).toEqual([]);
    ws.close();
  });

  it("subscribe and unsubscribe update the channel list", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(JSON.stringify({ type: "subscribe", channel: "Orders" }));
    const sub = await nextMessage(ws, (m) => m.type === "subscribed");
    expect(sub.channel).toBe("orders"); // normalized to lowercase
    expect(sub.channels).toContain("orders");

    ws.send(JSON.stringify({ type: "unsubscribe", channel: "orders" }));
    const unsub = await nextMessage(ws, (m) => m.type === "unsubscribed");
    expect(unsub.channels).not.toContain("orders");
    ws.close();
  });

  it("responds to ping with pong", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(JSON.stringify({ type: "ping" }));
    const pong = await nextMessage(ws, (m) => m.type === "pong");
    expect(typeof pong.now).toBe("number");
    ws.close();
  });

  it("rejects invalid JSON and missing channel", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send("not json");
    const err = await nextMessage(ws, (m) => m.type === "error");
    expect(err.message).toBe("Invalid JSON");

    ws.send(JSON.stringify({ type: "subscribe", channel: "  " }));
    const err2 = await nextMessage(ws, (m) => m.type === "error");
    expect(err2.message).toBe("channel is required");
    ws.close();
  });

  it("rejects a well-formed JSON message of an unknown shape (zod)", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(JSON.stringify({ type: "bogus", foo: 1 }));
    const err = await nextMessage(ws, (m) => m.type === "error");
    expect(err.message).toBe("Invalid message");
    ws.close();
  });

  it("closes the socket when a frame exceeds maxPayload", async () => {
    // WS_MAX_PAYLOAD_BYTES is 1024 in the test env (vitest.config.ts).
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    // A client-side 'error' may also fire; swallow it so it doesn't bubble.
    ws.on("error", () => {});
    const closed = new Promise<number>((resolve) => ws.on("close", (code) => resolve(code)));
    ws.send("x".repeat(4096));
    const code = await closed;
    expect(code).toBe(1009); // message too big
  });

  it("pushes gps as flat and btc as wrapped events", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(JSON.stringify({ type: "subscribe", channel: "gps" }));
    const gps = await nextMessage(ws, (m) => m.type === "event" && m.channel === "gps");
    expect(gps.data).toHaveProperty("lat");
    expect(gps.data).not.toHaveProperty("payload");
    ws.send(JSON.stringify({ type: "unsubscribe", channel: "gps" }));

    ws.send(JSON.stringify({ type: "subscribe", channel: "btc" }));
    const btc = await nextMessage(ws, (m) => m.type === "event" && m.channel === "btc");
    expect(btc.data).toHaveProperty("payload");
    expect(btc.data.payload).toHaveProperty("o");
    ws.close();
  });

  it("emits an event for every subscribed channel each tick", async () => {
    const ws = connect();
    await nextMessage(ws, (m) => m.type === "welcome");
    ws.send(JSON.stringify({ type: "subscribe", channel: "gps" }));
    ws.send(JSON.stringify({ type: "subscribe", channel: "btc" }));

    // Collect event channels until both have been seen (or time out).
    const seen = new Set<string>();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("did not see both channels")), 4000);
      ws.on("message", (raw: WebSocket.RawData) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "event") seen.add(msg.channel);
        if (seen.has("gps") && seen.has("btc")) {
          clearTimeout(timer);
          resolve();
        }
      });
    });
    expect(seen).toContain("gps");
    expect(seen).toContain("btc");
    ws.close();
  });
});
