// Small request-parsing helpers shared across routes. They centralize the
// repetitive `typeof x === "string"` / clamp logic that used to be inlined in
// every handler, keeping the route bodies focused on the mock response shape.

/** Return the value only if it is a non-empty string, else undefined. */
export function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Parse `v` as an integer and clamp it to `[min, max]`. Falls back to `def`
 * when the value is missing or not a finite number.
 */
export function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = Number(v);
  const base = Number.isFinite(n) ? n : def;
  return Math.min(Math.max(Math.trunc(base), min), max);
}

/** Parse `v` as a finite number, else undefined. */
export function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Return `v` only when it is a string present in `allowed`, else undefined. */
export function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}
