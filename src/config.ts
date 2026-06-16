import "dotenv/config";
import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const schema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  WS_TICK_MS: z.coerce.number().int().min(50).max(60_000).default(1000),
  // Server-initiated ping interval for dead-connection detection.
  WS_HEARTBEAT_MS: z.coerce.number().int().min(1000).max(300_000).default(30_000),
  // Reject inbound WS frames larger than this (bytes).
  WS_MAX_PAYLOAD_BYTES: z.coerce.number().int().min(256).max(10_485_760).default(65_536),
  // Skip pushing events to a socket whose send buffer exceeds this (bytes) — backpressure.
  WS_MAX_BUFFERED_BYTES: z.coerce.number().int().min(1024).default(1_048_576),
  // Max accepted upload size (bytes).
  UPLOAD_MAX_BYTES: z.coerce.number().int().min(1024).default(5_242_880),
  // Rate limiting on /api routes. Window in ms; max requests per window per IP.
  // Set RATE_LIMIT_MAX=0 to disable (useful for tests / load runs).
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Optional deterministic seed for faker — makes demos/tests reproducible.
  FAKER_SEED: z.coerce.number().int().optional()
});

export type Config = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast with a readable message instead of surfacing undefined behavior.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const config: Config = parsed.data;
