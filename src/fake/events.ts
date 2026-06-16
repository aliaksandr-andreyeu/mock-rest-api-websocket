import { faker } from "@faker-js/faker";
import type { WsEvent } from "../types.js";

/**
 * Per-channel WebSocket payloads. `gps` is intentionally a flat shape; `btc`
 * and everything else are wrapped (`{ id, channel, ts, payload }`) so clients
 * can exercise both styles.
 */
export function fakeEvent(channel: string): WsEvent {
  const ts = Date.now();
  const lc = channel.toLowerCase();

  if (lc === "btc") {
    const base = faker.number.float({ min: 20000, max: 120000, fractionDigits: 2 });
    const delta = faker.number.float({ min: 0.01, max: 0.05, fractionDigits: 4 }); // up to ~5%

    const o = base;
    const c = Number(
      (base * faker.number.float({ min: 1 - delta, max: 1 + delta, fractionDigits: 6 })).toFixed(2)
    );
    const high = Math.max(o, c) * faker.number.float({ min: 1, max: 1 + delta, fractionDigits: 6 });
    const low = Math.min(o, c) * faker.number.float({ min: 1 - delta, max: 1, fractionDigits: 6 });

    return {
      id: faker.string.uuid(),
      channel: "btc",
      ts,
      payload: { o, h: Number(high.toFixed(2)), l: Number(low.toFixed(2)), c, ts }
    };
  }

  if (lc === "gps") {
    const lat = faker.number.float({ min: -85, max: 85, fractionDigits: 6 });
    const lng = faker.number.float({ min: -180, max: 180, fractionDigits: 6 });
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
      meta: {
        a: faker.string.alphanumeric(8),
        b: faker.string.alphanumeric(8),
        c: faker.string.alphanumeric(8)
      }
    }
  };
}
