import { describe, it, expect } from "vitest";
import { createHttpApp } from "./http.js";
import { openApiSpec } from "./openapi.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

/** Express stores params as `:id`; OpenAPI uses `{id}`. Normalize to the latter. */
function toOpenApiPath(p: string): string {
  return p.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

type RouteLayer = { route?: { path?: unknown; methods?: Record<string, boolean> } };

/** Walk the Express 5 router stack and collect "METHOD path" operations. */
function registeredOps(app: ReturnType<typeof createHttpApp>): Set<string> {
  const router = (app as unknown as { router?: { stack: RouteLayer[] } }).router;
  const ops = new Set<string>();
  for (const layer of router?.stack ?? []) {
    const route = layer?.route;
    if (typeof route?.path !== "string") continue;
    // Only contract-relevant routes (skip /docs, /openapi.yaml, etc).
    if (!route.path.startsWith("/api/") && route.path !== "/health") continue;
    const path = toOpenApiPath(route.path);
    for (const method of HTTP_METHODS) {
      if (route.methods?.[method]) ops.add(`${method} ${path}`);
    }
  }
  return ops;
}

/** Collect "METHOD path" operations declared in the OpenAPI document. */
function specOps(): Set<string> {
  const ops = new Set<string>();
  for (const [path, item] of Object.entries(openApiSpec.paths)) {
    for (const method of HTTP_METHODS) {
      if (method in (item as Record<string, unknown>)) ops.add(`${method} ${path}`);
    }
  }
  return ops;
}

describe("OpenAPI ↔ routes parity (method-level)", () => {
  const routes = registeredOps(createHttpApp());
  const spec = specOps();

  it("finds a non-trivial number of operations", () => {
    expect(routes.size).toBeGreaterThan(20);
  });

  it("every registered operation is documented in OpenAPI", () => {
    const missing = [...routes].filter((op) => !spec.has(op));
    expect(missing, `operations missing from OpenAPI: ${missing.join(", ")}`).toEqual([]);
  });

  it("every OpenAPI operation maps to a registered route", () => {
    const orphan = [...spec].filter((op) => !routes.has(op));
    expect(orphan, `OpenAPI operations with no route: ${orphan.join(", ")}`).toEqual([]);
  });
});
