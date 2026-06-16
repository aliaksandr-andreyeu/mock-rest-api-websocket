import { z } from "zod";
import YAML from "yaml";
// Importing the schemas module registers every `.meta({ id })` schema in
// z.globalRegistry, from which we generate the OpenAPI component schemas below.
import "./schemas.js";

// ---- generated component schemas (single source of truth: src/schemas.ts) ----
const generated = z.toJSONSchema(z.globalRegistry, {
  target: "openapi-3.0",
  uri: (id) => `#/components/schemas/${id}`
});
// Drop JSON-Schema-only keys that aren't part of OpenAPI 3.0 component schemas.
const componentSchemas = Object.fromEntries(
  Object.entries(generated.schemas as Record<string, Record<string, unknown>>).map(([id, s]) => {
    const { $id: _id, $schema: _schema, ...rest } = s;
    return [id, rest];
  })
);

// ---- small builders ----
const ref = (id: string) => ({ $ref: `#/components/schemas/${id}` });
const objectSchema = { type: "object", additionalProperties: true } as const;

function jsonResponse(description: string, schema: unknown) {
  return { description, content: { "application/json": { schema } } };
}
function jsonBody(schema: unknown, required = true) {
  return { required, content: { "application/json": { schema } } };
}
function query(name: string, type: "string" | "integer", description?: string) {
  return { name, in: "query", required: false, schema: { type }, description };
}
function pathParam(name: string) {
  return { name, in: "path", required: true, schema: { type: "string" } };
}

const paths = {
  "/health": {
    get: {
      tags: ["meta"],
      summary: "Liveness/health probe",
      responses: { "200": jsonResponse("Service is up", ref("HealthResponse")) }
    }
  },
  "/api/metrics": {
    get: {
      tags: ["meta"],
      summary: "Runtime metrics (WebSocket + process)",
      responses: { "200": jsonResponse("Metrics snapshot", ref("MetricsResponse")) }
    }
  },
  "/api/ping": {
    get: {
      tags: ["meta"],
      summary: "Healthcheck/ping",
      responses: { "200": jsonResponse("OK", ref("PingResponse")) }
    }
  },
  "/api/error": {
    get: {
      tags: ["meta"],
      summary: "Force a 500 error (for client error-handling tests)",
      responses: { "500": jsonResponse("Generated internal error", ref("ErrorResponse")) }
    }
  },
  "/api/echo": {
    post: {
      tags: ["meta"],
      summary: "Echo request data",
      requestBody: jsonBody(objectSchema),
      responses: { "200": jsonResponse("Echo", objectSchema) }
    }
  },
  "/api/users": {
    get: {
      tags: ["users"],
      summary: "List users (generated)",
      parameters: [query("limit", "integer"), query("offset", "integer")],
      responses: { "200": jsonResponse("Users page", ref("UsersList")) }
    },
    post: {
      tags: ["users"],
      summary: "Create user (generated)",
      requestBody: jsonBody(ref("CreateUserBody"), false),
      responses: { "201": jsonResponse("Created user", ref("User")) }
    }
  },
  "/api/users/{id}": {
    get: {
      tags: ["users"],
      summary: "Get user by id (with debug echo of trace/session)",
      parameters: [pathParam("id")],
      responses: { "200": jsonResponse("User", ref("UserWithDebug")) }
    },
    put: {
      tags: ["users"],
      summary: "Replace user (generated)",
      parameters: [pathParam("id")],
      responses: { "200": jsonResponse("User", ref("User")) }
    },
    patch: {
      tags: ["users"],
      summary: "Update user status (generated)",
      parameters: [pathParam("id")],
      requestBody: jsonBody(ref("UpdateUserBody"), false),
      responses: { "200": jsonResponse("User", ref("User")) }
    },
    delete: {
      tags: ["users"],
      summary: "Delete user",
      parameters: [pathParam("id")],
      responses: { "204": { description: "Deleted" } }
    }
  },
  "/api/orders": {
    get: {
      tags: ["orders"],
      summary: "List orders (generated)",
      parameters: [query("limit", "integer"), query("userId", "string")],
      responses: {
        "200": jsonResponse("Orders", { type: "array", items: ref("Order") })
      }
    },
    post: {
      tags: ["orders"],
      summary: "Create order (generated)",
      requestBody: jsonBody(ref("CreateOrderBody"), false),
      responses: { "201": jsonResponse("Created order", ref("Order")) }
    }
  },
  "/api/files/upload": {
    post: {
      tags: ["files"],
      summary: "Upload a file (multipart/form-data)",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: { file: { type: "string", format: "binary" } }
            }
          }
        }
      },
      responses: {
        "200": jsonResponse("File metadata", ref("UploadResponse")),
        "400": jsonResponse("Missing/invalid file", ref("ErrorResponse")),
        "413": jsonResponse("File too large", ref("ErrorResponse"))
      }
    }
  },
  "/api/web3/tokens": {
    get: {
      tags: ["web3"],
      summary: "List tokens",
      parameters: [query("chainId", "integer"), query("limit", "integer")],
      responses: { "200": jsonResponse("Tokens", ref("TokensResponse")) }
    }
  },
  "/api/web3/prices": {
    get: {
      tags: ["web3"],
      summary: "Token prices",
      parameters: [query("chainId", "integer"), query("addresses", "string", "comma-separated")],
      responses: { "200": jsonResponse("Prices", ref("PricesResponse")) }
    }
  },
  "/api/web3/wallets/{address}/balances": {
    get: {
      tags: ["web3"],
      summary: "Wallet token balances",
      parameters: [pathParam("address"), query("chainId", "integer"), query("limit", "integer")],
      responses: { "200": jsonResponse("Balances", ref("BalancesResponse")) }
    }
  },
  "/api/web3/defi/pools/{poolAddress}": {
    get: {
      tags: ["web3"],
      summary: "DeFi pool by address",
      parameters: [pathParam("poolAddress"), query("chainId", "integer")],
      responses: { "200": jsonResponse("Pool", ref("Pool")) }
    }
  },
  "/api/web3/defi/swap/quote": {
    post: {
      tags: ["web3"],
      summary: "Swap quote",
      requestBody: jsonBody(ref("SwapQuoteBody"), false),
      responses: { "200": jsonResponse("Quote", ref("SwapQuote")) }
    }
  },
  "/api/web3/allowance": {
    get: {
      tags: ["web3"],
      summary: "ERC-20 allowance",
      parameters: [
        query("chainId", "integer"),
        query("owner", "string"),
        query("spender", "string"),
        query("tokenAddress", "string")
      ],
      responses: { "200": jsonResponse("Allowance", ref("Allowance")) }
    }
  },
  "/api/web3/approve": {
    post: {
      tags: ["web3"],
      summary: "Build an approve tx",
      requestBody: jsonBody(ref("ApproveBody"), false),
      responses: { "200": jsonResponse("Approve tx", ref("ApproveTx")) }
    }
  },
  "/api/web3/defi/positions": {
    get: {
      tags: ["web3"],
      summary: "DeFi positions",
      parameters: [query("chainId", "integer"), query("address", "string")],
      responses: { "200": jsonResponse("Positions", ref("DefiPositions")) }
    }
  },
  "/api/web3/defi/lending/health": {
    get: {
      tags: ["web3"],
      summary: "Lending health factor",
      parameters: [
        query("chainId", "integer"),
        query("address", "string"),
        query("protocol", "string")
      ],
      responses: { "200": jsonResponse("Lending health", ref("LendingHealth")) }
    }
  },
  "/api/web3/candles": {
    get: {
      tags: ["web3"],
      summary: "Historical OHLC candles",
      parameters: [
        query("chainId", "integer"),
        query("baseToken", "string"),
        query("quoteToken", "string"),
        query("interval", "string"),
        query("startTs", "integer"),
        query("endTs", "integer"),
        query("limit", "integer")
      ],
      responses: { "200": jsonResponse("Candles", ref("CandlesResponse")) }
    }
  },
  "/api/web3/portfolio/pnl": {
    get: {
      tags: ["web3"],
      summary: "Portfolio PnL",
      parameters: [
        query("chainId", "integer"),
        query("address", "string"),
        query("period", "string")
      ],
      responses: { "200": jsonResponse("PnL", ref("PortfolioPnl")) }
    }
  },
  "/api/web3/tx/send": {
    post: {
      tags: ["web3"],
      summary: "Submit a transaction",
      requestBody: jsonBody(ref("TxSendBody"), false),
      responses: { "201": jsonResponse("Submitted", ref("TxSendResponse")) }
    }
  },
  "/api/web3/tx/{hash}": {
    get: {
      tags: ["web3"],
      summary: "Transaction status",
      parameters: [pathParam("hash"), query("chainId", "integer")],
      responses: { "200": jsonResponse("Tx status", ref("TxStatusResponse")) }
    }
  }
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mock REST API + WebSocket",
    version: "0.3.0",
    description:
      "Mock service for testing API clients. REST endpoints of all common types and WebSocket pub/sub."
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "meta" },
    { name: "users" },
    { name: "orders" },
    { name: "files" },
    { name: "web3" }
  ],
  paths,
  components: { schemas: componentSchemas }
};

/** The spec with its `servers` URL overridden (e.g. to the runtime port). */
export function specWithServer(url: string) {
  return { ...openApiSpec, servers: [{ url }] };
}

export function openApiYaml(url?: string): string {
  return YAML.stringify(url ? specWithServer(url) : openApiSpec);
}
