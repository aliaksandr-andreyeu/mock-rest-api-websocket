import type { Express, Response } from "express";
import multer from "multer";
import { fakeOrder, fakeUser } from "../fake.js";
import type { UserStatus } from "../fake.js";
import { clampInt, num, oneOf, str } from "../util/parse.js";
import { config } from "../config.js";
import type { HttpAppOptions } from "../http.js";

function requestId(res: Response): string | undefined {
  return (res.locals as { requestId?: string }).requestId;
}

const USER_STATUSES: readonly UserStatus[] = ["active", "blocked", "pending"];

const EMPTY_WS_STATS = { connections: 0, subscriptions: 0, channels: {} };

/** Registers the base (non-web3) REST endpoints. */
export function registerCoreRoutes(app: Express, opts: HttpAppOptions = {}): void {
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), ts: Date.now() });
  });

  app.get("/api/metrics", (_req, res) => {
    const ws = opts.wsStats ? opts.wsStats() : EMPTY_WS_STATS;
    res.json({
      uptime: process.uptime(),
      ts: Date.now(),
      memoryMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      ws
    });
  });

  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
  });

  app.post("/api/echo", (req, res) => {
    res.json({
      headers: req.headers,
      query: req.query,
      cookies: req.cookies,
      body: req.body
    });
  });

  app.get("/api/users", (req, res) => {
    const limit = clampInt(req.query.limit, 10, 1, 100);
    const offset = clampInt(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    const items = Array.from({ length: limit }, () => fakeUser());
    res.json({ items, total: 1000, limit, offset });
  });

  app.post("/api/users", (req, res) => {
    res.status(201).json(fakeUser({ email: str(req.body?.email), name: str(req.body?.name) }));
  });

  app.get("/api/users/:id", (req, res) => {
    const traceId = req.header("x-trace-id") ?? null;
    const session = str(req.cookies?.session) ?? null;
    res.json({ ...fakeUser({ id: req.params.id }), debug: { traceId, session } });
  });

  app.put("/api/users/:id", (req, res) => {
    res.json(fakeUser({ id: req.params.id }));
  });

  app.patch("/api/users/:id", (req, res) => {
    const status = oneOf(req.body?.status, USER_STATUSES);
    res.json(fakeUser({ id: req.params.id, status }));
  });

  app.delete("/api/users/:id", (_req, res) => {
    res.status(204).send();
  });

  app.get("/api/orders", (req, res) => {
    const limit = clampInt(req.query.limit, 10, 1, 100);
    const userId = str(req.query.userId);
    res.json(Array.from({ length: limit }, () => fakeOrder({ userId })));
  });

  app.post("/api/orders", (req, res) => {
    res
      .status(201)
      .json(fakeOrder({ userId: str(req.body?.userId), itemsCount: num(req.body?.itemsCount) }));
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.UPLOAD_MAX_BYTES, files: 1 }
  });
  app.post("/api/files/upload", (req, res) => {
    // Wrap multer so its errors become 4xx envelopes instead of a generic 500.
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const tooLarge = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
        res.status(tooLarge ? 413 : 400).json({
          error: tooLarge ? "PayloadTooLarge" : "BadRequest",
          message: err instanceof Error ? err.message : "Upload failed",
          requestId: requestId(res)
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({
          error: "BadRequest",
          message: "file is required",
          requestId: requestId(res)
        });
        return;
      }
      res.json({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    });
  });

  app.get("/api/error", (_req, res) => {
    res.status(500).json({
      error: "InternalError",
      message: "Generated test error",
      requestId: requestId(res)
    });
  });
}
