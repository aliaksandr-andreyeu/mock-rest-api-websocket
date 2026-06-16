import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";
import { faker } from "@faker-js/faker";
import { openApiYaml, specWithServer } from "./openapi.js";
import { registerCoreRoutes } from "./routes/core.js";
import { registerWeb3Routes } from "./routes/web3.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import type { WsStats } from "./ws.js";

export interface HttpAppOptions {
  /** Live WebSocket stats for GET /api/metrics (zeros if omitted). */
  wsStats?: () => WsStats;
}

export function createHttpApp(opts: HttpAppOptions = {}) {
  const app = express();

  // Security headers. CSP is disabled so the bundled Swagger UI keeps working;
  // a public deployment serving only the API can re-enable it.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Assign a request id (honoring an inbound x-request-id) before logging so
  // both the access log and error responses can correlate on it.
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") ?? faker.string.uuid();
    res.setHeader("x-request-id", requestId);
    (res.locals as { requestId?: string }).requestId = requestId;
    next();
  });

  // Structured access logging — skipped under test to keep output clean.
  if (config.NODE_ENV !== "test") {
    app.use(
      pinoHttp({
        logger,
        genReqId: (_req, res) =>
          (res.locals as { requestId?: string }).requestId ?? faker.string.uuid(),
        // Keep access logs at info even for 5xx — application errors are logged
        // once, with a stack, by the error handler below (avoids double-logging).
        customLogLevel: (_req, _res, err) => (err ? "error" : "info")
      })
    );
  }

  // Point Swagger UI / the YAML at the actual runtime port.
  const baseUrl = `http://localhost:${config.PORT}`;
  app.get("/openapi.yaml", (_req, res) => {
    res.type("text/yaml").send(openApiYaml(baseUrl));
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specWithServer(baseUrl), { explorer: true }));

  // Optional rate limiting on the API surface (disabled by default; enable via
  // RATE_LIMIT_MAX>0 for public deployments).
  if (config.RATE_LIMIT_MAX > 0) {
    app.use(
      "/api",
      rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        limit: config.RATE_LIMIT_MAX,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(429).json({
            error: "TooManyRequests",
            message: "rate limit exceeded",
            requestId: (res.locals as { requestId?: string }).requestId
          });
        }
      })
    );
  }

  registerCoreRoutes(app, opts);
  registerWeb3Routes(app);

  app.use((req, res) => {
    res.status(404).json({
      error: "NotFound",
      message: `No route for ${req.method} ${req.path}`,
      requestId: (res.locals as { requestId?: string }).requestId
    });
  });

  // Centralized error handler: any thrown error / next(err) lands here in a
  // single shape. Express 5 forwards async rejections automatically.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const requestId = (res.locals as { requestId?: string }).requestId;
    logger.error({ err, requestId }, "Unhandled request error");
    if (res.headersSent) return;
    res.status(500).json({
      error: "InternalError",
      message: err instanceof Error ? err.message : "Internal Server Error",
      requestId
    });
  };
  app.use(errorHandler);

  return app;
}
