import type http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { faker } from "@faker-js/faker";
import { z } from "zod";
import { fakeEvent } from "./fake.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribe"), channel: z.string() }),
  z.object({ type: z.literal("unsubscribe"), channel: z.string() }),
  z.object({ type: z.literal("ping") })
]);

type ServerMessage =
  | { type: "welcome"; clientId: string; channels: string[] }
  | { type: "subscribed"; channel: string; channels: string[] }
  | { type: "unsubscribed"; channel: string; channels: string[] }
  | { type: "event"; channel: string; data: unknown }
  | { type: "pong"; now: number }
  | { type: "error"; message: string };

type ClientState = {
  id: string;
  channels: Set<string>;
  isAlive: boolean;
};

export function attachWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: config.WS_MAX_PAYLOAD_BYTES
  });

  const stateBySocket = new WeakMap<WebSocket, ClientState>();

  function normalizeChannel(input: string): string {
    return input.trim().toLowerCase();
  }

  function send(ws: WebSocket, msg: ServerMessage) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(msg));
  }

  function listChannels(ws: WebSocket): string[] {
    const st = stateBySocket.get(ws);
    return st ? Array.from(st.channels).sort() : [];
  }

  // Emit one event per subscribed channel each tick, so per-channel cadence is
  // constant and independent of how many channels a client is subscribed to.
  // `fakeEvent` is the single source of truth for per-channel payload shapes
  // (e.g. gps is intentionally flat, btc/orders are wrapped) — no special-casing here.
  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      const st = stateBySocket.get(ws);
      if (!st || st.channels.size === 0) continue;
      // Backpressure: skip clients that aren't draining their buffer fast enough.
      if (ws.bufferedAmount > config.WS_MAX_BUFFERED_BYTES) continue;
      for (const channel of st.channels) {
        send(ws, { type: "event", channel, data: fakeEvent(channel) });
      }
    }
  }, config.WS_TICK_MS);
  timer.unref();

  // Heartbeat: terminate sockets that didn't answer the previous ping.
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      const st = stateBySocket.get(ws);
      if (!st) continue;
      if (!st.isAlive) {
        ws.terminate();
        continue;
      }
      st.isAlive = false;
      ws.ping();
    }
  }, config.WS_HEARTBEAT_MS);
  heartbeat.unref();

  wss.on("connection", (ws) => {
    const clientId = faker.string.uuid();
    stateBySocket.set(ws, { id: clientId, channels: new Set<string>(), isAlive: true });
    send(ws, { type: "welcome", clientId, channels: [] });

    // Per-socket errors (e.g. an oversized frame → WS_ERR_UNSUPPORTED_MESSAGE_LENGTH)
    // must be handled, or they bubble up as an unhandled 'error' event.
    ws.on("error", (err) => logger.warn({ err, clientId }, "WebSocket connection error"));

    ws.on("pong", () => {
      const st = stateBySocket.get(ws);
      if (st) st.isAlive = true;
    });

    ws.on("message", (raw) => {
      let json: unknown;
      try {
        json = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      const parsed = messageSchema.safeParse(json);
      if (!parsed.success) {
        send(ws, { type: "error", message: "Invalid message" });
        return;
      }
      const msg = parsed.data;

      const st = stateBySocket.get(ws);
      if (!st) return;

      if (msg.type === "ping") {
        send(ws, { type: "pong", now: Date.now() });
        return;
      }

      const channel = normalizeChannel(msg.channel);
      if (!channel) {
        send(ws, { type: "error", message: "channel is required" });
        return;
      }

      if (msg.type === "subscribe") {
        st.channels.add(channel);
        send(ws, { type: "subscribed", channel, channels: listChannels(ws) });
        return;
      }

      // msg.type === "unsubscribe"
      st.channels.delete(channel);
      send(ws, { type: "unsubscribed", channel, channels: listChannels(ws) });
    });
  });

  wss.on("error", (err) => logger.error({ err }, "WebSocket server error"));

  function stopTimers() {
    clearInterval(timer);
    clearInterval(heartbeat);
  }
  wss.on("close", stopTimers);

  /** Live connection/subscription counts for the metrics endpoint. */
  function stats(): {
    connections: number;
    subscriptions: number;
    channels: Record<string, number>;
  } {
    let connections = 0;
    let subscriptions = 0;
    const channels: Record<string, number> = {};
    for (const ws of wss.clients) {
      const st = stateBySocket.get(ws);
      if (!st) continue;
      connections++;
      for (const ch of st.channels) {
        subscriptions++;
        channels[ch] = (channels[ch] ?? 0) + 1;
      }
    }
    return { connections, subscriptions, channels };
  }

  /** Stop timers and close all sockets + the server. */
  function close(): Promise<void> {
    stopTimers();
    for (const ws of wss.clients) ws.close(1001, "server shutting down");
    return new Promise((resolve) => wss.close(() => resolve()));
  }

  return { wss, close, stats };
}

export type WsStats = ReturnType<ReturnType<typeof attachWebSocketServer>["stats"]>;
