import type http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { faker } from "@faker-js/faker";
import { fakeEvent } from "./fake.js";

type SubscribeMessage =
  | { type: "subscribe"; channel: string }
  | { type: "unsubscribe"; channel: string }
  | { type: "ping" };

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
};

export function attachWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  const stateBySocket = new WeakMap<WebSocket, ClientState>();

  function normalizeChannel(input: string): string {
    const s = input.trim();
    if (!s) return "";
    return s.toLowerCase();
  }

  function send(ws: WebSocket, msg: ServerMessage) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(msg));
  }

  function listChannels(ws: WebSocket): string[] {
    const st = stateBySocket.get(ws);
    return st ? Array.from(st.channels).sort() : [];
  }

  const tickMs = Number(process.env.WS_TICK_MS ?? 1000);
  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      const st = stateBySocket.get(ws);
      if (!st || st.channels.size === 0) continue;
      const channel = faker.helpers.arrayElement(Array.from(st.channels));
      if (channel === "gps") {
        // For gps we always send a simplified shape: { lat, lng, ts }
        const ts = Date.now();
        const lat = faker.number.float({ min: -85, max: 85, fractionDigits: 6 });
        const lng = faker.number.float({ min: -180, max: 180, fractionDigits: 6 });
        send(ws, { type: "event", channel, data: { lat, lng, ts } });
      } else {
        send(ws, { type: "event", channel, data: fakeEvent(channel) });
      }
    }
  }, tickMs);

  wss.on("connection", (ws) => {
    const clientId = faker.string.uuid();
    stateBySocket.set(ws, { id: clientId, channels: new Set<string>() });
    send(ws, { type: "welcome", clientId, channels: [] });

    ws.on("message", (raw) => {
      let msg: SubscribeMessage;
      try {
        msg = JSON.parse(raw.toString()) as SubscribeMessage;
      } catch {
        send(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      const st = stateBySocket.get(ws);
      if (!st) return;

      if (msg.type === "ping") {
        send(ws, { type: "pong", now: Date.now() });
        return;
      }

      const channelRaw = "channel" in msg && typeof msg.channel === "string" ? msg.channel : "";
      const channel = normalizeChannel(channelRaw);
      if (!channel) {
        send(ws, { type: "error", message: "channel is required" });
        return;
      }

      if (msg.type === "subscribe") {
        st.channels.add(channel);
        send(ws, { type: "subscribed", channel, channels: listChannels(ws) });
        return;
      }

      if (msg.type === "unsubscribe") {
        st.channels.delete(channel);
        send(ws, { type: "unsubscribed", channel, channels: listChannels(ws) });
        return;
      }

      send(ws, { type: "error", message: "Unknown message type" });
    });
  });

  wss.on("close", () => clearInterval(timer));

  return wss;
}
