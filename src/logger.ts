import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.LOG_LEVEL,
  // Keep test output quiet and deterministic; pretty-print is left to the
  // caller (e.g. piping through `pino-pretty` in dev) to avoid a hard dep.
  base: undefined
});
