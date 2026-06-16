import http from "node:http";
import { faker } from "@faker-js/faker";
import { createHttpApp } from "./http.js";
import { attachWebSocketServer, type WsStats } from "./ws.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

if (config.FAKER_SEED !== undefined) {
  faker.seed(config.FAKER_SEED);
  logger.info({ seed: config.FAKER_SEED }, "faker seeded for reproducible output");
}

// The app is built before the WS server is attached, so route the metrics
// endpoint through a late-bound reference to the live WS stats.
const wsRef: { stats?: () => WsStats } = {};
const app = createHttpApp({
  wsStats: () => wsRef.stats?.() ?? { connections: 0, subscriptions: 0, channels: {} }
});
const server = http.createServer(app);
const ws = attachWebSocketServer(server);
wsRef.stats = ws.stats;

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.fatal({ port: config.PORT }, `port ${config.PORT} is already in use`);
  } else {
    logger.fatal({ err }, "server error");
  }
  process.exit(1);
});

server.listen(config.PORT, () => {
  const base = `http://localhost:${config.PORT}`;
  logger.info(
    { port: config.PORT },
    `REST: ${base} | Swagger UI: ${base}/docs | OpenAPI: ${base}/openapi.yaml | WS: ws://localhost:${config.PORT}/ws`
  );
});

let shuttingDown = false;
async function shutdown(reason: string, code = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ reason, code }, "shutting down");
  // Force-exit if a connection wedges the close.
  const force = setTimeout(() => {
    logger.error("forced shutdown after timeout");
    process.exit(code || 1);
  }, 10_000);
  force.unref();
  try {
    await ws.close();
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
    logger.info("shutdown complete");
    process.exit(code);
  } catch (err) {
    logger.error({ err }, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Last-resort handlers: log with structure, then shut down gracefully (code 1)
// instead of dying silently.
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  void shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandledRejection");
  void shutdown("unhandledRejection", 1);
});
