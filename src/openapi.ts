import YAML from "yaml";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mock REST API + WebSocket",
    version: "0.1.0",
    description:
      "Mock service for testing API clients. REST endpoints of all common types and WebSocket pub/sub."
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "meta" },
    { name: "users" },
    { name: "orders" },
    { name: "files" },
    { name: "web3" },
    { name: "defi" },
    { name: "tx" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      apiKey: { type: "apiKey", in: "header", name: "x-api-key" }
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          requestId: { type: "string" }
        },
        required: ["error", "message", "requestId"]
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["active", "blocked", "pending"] },
          createdAt: { type: "string", format: "date-time" }
        },
        required: ["id", "email", "name", "status", "createdAt"]
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          total: { type: "number" },
          currency: { type: "string" },
          itemsCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" }
        },
        required: ["id", "userId", "total", "currency", "itemsCount", "createdAt"]
      },
      Token: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          symbol: { type: "string" },
          name: { type: "string" },
          decimals: { type: "integer" },
          logoUrl: { type: "string" }
        },
        required: ["chainId", "address", "symbol", "name", "decimals", "logoUrl"]
      },
      TokenPrice: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          symbol: { type: "string" },
          priceUsd: { type: "number" },
          change24hPct: { type: "number" },
          ts: { type: "integer" }
        },
        required: ["chainId", "address", "symbol", "priceUsd", "change24hPct", "ts"]
      },
      WalletBalance: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          token: { $ref: "#/components/schemas/Token" },
          balance: { type: "string" },
          balanceUsd: { type: "number" }
        },
        required: ["chainId", "address", "token", "balance", "balanceUsd"]
      },
      SwapQuote: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          fromToken: { $ref: "#/components/schemas/Token" },
          toToken: { $ref: "#/components/schemas/Token" },
          amountIn: { type: "string" },
          amountOut: { type: "string" },
          minAmountOut: { type: "string" },
          priceImpactPct: { type: "number" },
          feeUsd: { type: "number" },
          route: { type: "array", items: { type: "string" } },
          tx: {
            type: "object",
            properties: {
              to: { type: "string" },
              data: { type: "string" },
              value: { type: "string" },
              gasLimit: { type: "string" }
            },
            required: ["to", "data", "value", "gasLimit"]
          },
          ts: { type: "integer" }
        },
        required: [
          "chainId",
          "fromToken",
          "toToken",
          "amountIn",
          "amountOut",
          "minAmountOut",
          "priceImpactPct",
          "feeUsd",
          "route",
          "tx",
          "ts"
        ]
      },
      DefiPool: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          protocol: { type: "string" },
          address: { type: "string" },
          token0: { $ref: "#/components/schemas/Token" },
          token1: { $ref: "#/components/schemas/Token" },
          feeTier: { type: "integer" },
          tvlUsd: { type: "number" },
          apyPct: { type: "number" },
          volume24hUsd: { type: "number" },
          reserves: {
            type: "object",
            properties: { token0: { type: "string" }, token1: { type: "string" } },
            required: ["token0", "token1"]
          },
          ts: { type: "integer" }
        },
        required: [
          "chainId",
          "protocol",
          "address",
          "token0",
          "token1",
          "feeTier",
          "tvlUsd",
          "apyPct",
          "volume24hUsd",
          "reserves",
          "ts"
        ]
      },
      Allowance: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          owner: { type: "string" },
          spender: { type: "string" },
          token: { $ref: "#/components/schemas/Token" },
          allowance: { type: "string" },
          ts: { type: "integer" }
        },
        required: ["chainId", "owner", "spender", "token", "allowance", "ts"]
      },
      ApproveTx: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          owner: { type: "string" },
          spender: { type: "string" },
          token: { $ref: "#/components/schemas/Token" },
          amount: { type: "string" },
          tx: {
            type: "object",
            properties: {
              to: { type: "string" },
              data: { type: "string" },
              value: { type: "string" },
              gasLimit: { type: "string" }
            },
            required: ["to", "data", "value", "gasLimit"]
          },
          ts: { type: "integer" }
        },
        required: ["chainId", "owner", "spender", "token", "amount", "tx", "ts"]
      },
      DefiPositions: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          positions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                protocol: { type: "string" },
                type: { type: "string", enum: ["lp", "lending", "staking"] },
                market: { type: "string" },
                suppliedUsd: { type: "number" },
                borrowedUsd: { type: "number" },
                netUsd: { type: "number" },
                rewardsUsd: { type: "number" },
                apyPct: { type: "number" }
              },
              required: [
                "protocol",
                "type",
                "market",
                "suppliedUsd",
                "borrowedUsd",
                "netUsd",
                "rewardsUsd",
                "apyPct"
              ]
            }
          },
          ts: { type: "integer" }
        },
        required: ["chainId", "address", "positions", "ts"]
      },
      LendingHealth: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          protocol: { type: "string" },
          healthFactor: { type: "number" },
          liquidationThresholdPct: { type: "number" },
          ltvPct: { type: "number" },
          suppliedUsd: { type: "number" },
          borrowedUsd: { type: "number" },
          availableBorrowUsd: { type: "number" },
          ts: { type: "integer" }
        },
        required: [
          "chainId",
          "address",
          "protocol",
          "healthFactor",
          "liquidationThresholdPct",
          "ltvPct",
          "suppliedUsd",
          "borrowedUsd",
          "availableBorrowUsd",
          "ts"
        ]
      },
      Candle: {
        type: "object",
        properties: {
          o: { type: "number" },
          h: { type: "number" },
          l: { type: "number" },
          c: { type: "number" },
          ts: { type: "integer" }
        },
        required: ["o", "h", "l", "c", "ts"]
      },
      CandlesResponse: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          baseToken: { type: "string", nullable: true },
          quoteToken: { type: "string" },
          interval: { type: "string", enum: ["1m", "5m", "15m", "1h", "4h", "1d"] },
          startTs: { type: "integer" },
          endTs: { type: "integer" },
          limit: { type: "integer" },
          items: { type: "array", items: { $ref: "#/components/schemas/Candle" } }
        },
        required: [
          "chainId",
          "baseToken",
          "quoteToken",
          "interval",
          "startTs",
          "endTs",
          "limit",
          "items"
        ]
      },
      PortfolioPnl: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          address: { type: "string" },
          currency: { type: "string", enum: ["USD"] },
          period: { type: "string", enum: ["1d", "7d", "30d", "90d", "1y"] },
          pnlUsd: { type: "number" },
          pnlPct: { type: "number" },
          realizedPnlUsd: { type: "number" },
          unrealizedPnlUsd: { type: "number" },
          feesUsd: { type: "number" },
          startingValueUsd: { type: "number" },
          endingValueUsd: { type: "number" },
          breakdown: {
            type: "array",
            items: {
              type: "object",
              properties: { source: { type: "string" }, pnlUsd: { type: "number" } },
              required: ["source", "pnlUsd"]
            }
          },
          ts: { type: "integer" }
        },
        required: [
          "chainId",
          "address",
          "currency",
          "period",
          "pnlUsd",
          "pnlPct",
          "realizedPnlUsd",
          "unrealizedPnlUsd",
          "feesUsd",
          "startingValueUsd",
          "endingValueUsd",
          "breakdown",
          "ts"
        ]
      },
      TxSubmission: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          hash: { type: "string" },
          from: { type: "string", nullable: true },
          to: { type: "string", nullable: true },
          value: { type: "string" },
          data: { type: "string" },
          submittedAt: { type: "integer" }
        },
        required: ["chainId", "hash", "from", "to", "value", "data", "submittedAt"]
      },
      TxStatus: {
        type: "object",
        properties: {
          chainId: { type: "integer" },
          hash: { type: "string" },
          status: { type: "string", enum: ["pending", "confirmed", "failed"] },
          confirmations: { type: "integer" },
          blockNumber: { type: "integer", nullable: true },
          gasUsed: { type: "integer", nullable: true },
          effectiveGasPriceGwei: { type: "number", nullable: true },
          ts: { type: "integer" }
        },
        required: [
          "chainId",
          "hash",
          "status",
          "confirmations",
          "blockNumber",
          "gasUsed",
          "effectiveGasPriceGwei",
          "ts"
        ]
      }
    }
  },
  paths: {
    "/api/ping": {
      get: {
        tags: ["meta"],
        summary: "Healthcheck/ping",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean" }, now: { type: "string" } }
                }
              }
            }
          }
        }
      }
    },
    "/api/echo": {
      post: {
        tags: ["meta"],
        summary: "Echo request data",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object", additionalProperties: true } }
          }
        },
        responses: {
          "200": {
            description: "Echo",
            content: {
              "application/json": { schema: { type: "object", additionalProperties: true } }
            }
          }
        }
      }
    },
    "/api/users": {
      get: {
        tags: ["users"],
        summary: "List users (generated)",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }
          },
          { name: "offset", in: "query", schema: { type: "integer", default: 0, minimum: 0 } }
        ],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    total: { type: "integer" },
                    limit: { type: "integer" },
                    offset: { type: "integer" }
                  },
                  required: ["items", "total", "limit", "offset"]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["users"],
        summary: "Create user (generated response)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  name: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Created user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          }
        }
      }
    },
    "/api/users/{id}": {
      get: {
        tags: ["users"],
        summary: "Get user by id (path + headers + cookies demo)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "x-trace-id", in: "header", required: false, schema: { type: "string" } },
          { name: "session", in: "cookie", required: false, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "User",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          }
        }
      },
      put: {
        tags: ["users"],
        summary: "Replace user (generated response)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object", additionalProperties: true } }
          }
        },
        responses: {
          "200": {
            description: "Updated user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          }
        }
      },
      patch: {
        tags: ["users"],
        summary: "Patch user (generated response)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object", additionalProperties: true } }
          }
        },
        responses: {
          "200": {
            description: "Patched user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          }
        }
      },
      delete: {
        tags: ["users"],
        summary: "Delete user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "No content" }
        }
      }
    },
    "/api/orders": {
      get: {
        tags: ["orders"],
        summary: "List orders (generated)",
        parameters: [
          { name: "userId", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Orders list",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Order" } }
              }
            }
          }
        }
      },
      post: {
        tags: ["orders"],
        summary: "Create order (generated response)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { userId: { type: "string" }, itemsCount: { type: "integer" } }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Created order",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } }
          }
        }
      }
    },
    "/api/files/upload": {
      post: {
        tags: ["files"],
        summary: "Upload file (multipart/form-data)",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" }
                },
                required: ["file"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Upload result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    filename: { type: "string" },
                    mimetype: { type: "string" },
                    size: { type: "integer" }
                  },
                  required: ["filename", "mimetype", "size"]
                }
              }
            }
          }
        }
      }
    },
    "/api/web3/tokens": {
      get: {
        tags: ["web3"],
        summary: "List tokens (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, minimum: 1, maximum: 200 }
          }
        ],
        responses: {
          "200": {
            description: "Token list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    chainId: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/Token" } },
                    ts: { type: "integer" }
                  },
                  required: ["chainId", "items", "ts"]
                }
              }
            }
          }
        }
      }
    },
    "/api/web3/prices": {
      get: {
        tags: ["web3"],
        summary: "Token prices (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          {
            name: "addresses",
            in: "query",
            description: "Comma-separated token addresses",
            schema: { type: "string", example: "0x...,0x..." }
          }
        ],
        responses: {
          "200": {
            description: "Prices",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    chainId: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/TokenPrice" } },
                    ts: { type: "integer" }
                  },
                  required: ["chainId", "items", "ts"]
                }
              }
            }
          }
        }
      }
    },
    "/api/web3/wallets/{address}/balances": {
      get: {
        tags: ["web3"],
        summary: "Wallet balances (mock)",
        parameters: [
          { name: "address", in: "path", required: true, schema: { type: "string" } },
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 200 }
          }
        ],
        responses: {
          "200": {
            description: "Balances",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    chainId: { type: "integer" },
                    address: { type: "string" },
                    items: { type: "array", items: { $ref: "#/components/schemas/WalletBalance" } },
                    ts: { type: "integer" }
                  },
                  required: ["chainId", "address", "items", "ts"]
                }
              }
            }
          }
        }
      }
    },
    "/api/web3/defi/pools/{poolAddress}": {
      get: {
        tags: ["defi"],
        summary: "DeFi pool info (mock)",
        parameters: [
          { name: "poolAddress", in: "path", required: true, schema: { type: "string" } },
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } }
        ],
        responses: {
          "200": {
            description: "Pool",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DefiPool" } } }
          }
        }
      }
    },
    "/api/web3/defi/swap/quote": {
      post: {
        tags: ["defi"],
        summary: "Swap quote (mock)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  chainId: { type: "integer", example: 1 },
                  fromTokenAddress: { type: "string" },
                  toTokenAddress: { type: "string" },
                  amountIn: { type: "string", example: "1.0" }
                },
                required: ["chainId", "fromTokenAddress", "toTokenAddress", "amountIn"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Quote",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SwapQuote" } } }
          }
        }
      }
    },
    "/api/web3/allowance": {
      get: {
        tags: ["web3"],
        summary: "ERC20 allowance (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          { name: "owner", in: "query", required: true, schema: { type: "string" } },
          { name: "spender", in: "query", required: true, schema: { type: "string" } },
          { name: "tokenAddress", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Allowance",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Allowance" } } }
          }
        }
      }
    },
    "/api/web3/approve": {
      post: {
        tags: ["web3"],
        summary: "Build approve tx (mock)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  chainId: { type: "integer", example: 1 },
                  owner: { type: "string" },
                  spender: { type: "string" },
                  tokenAddress: { type: "string" },
                  amount: { type: "string", example: "1000" }
                },
                required: ["chainId", "owner", "spender", "tokenAddress", "amount"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Approve tx",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApproveTx" } } }
          }
        }
      }
    },
    "/api/web3/defi/positions": {
      get: {
        tags: ["defi"],
        summary: "DeFi positions (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          { name: "address", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Positions",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/DefiPositions" } }
            }
          }
        }
      }
    },
    "/api/web3/defi/lending/health": {
      get: {
        tags: ["defi"],
        summary: "Lending health factor (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          { name: "address", in: "query", required: true, schema: { type: "string" } },
          {
            name: "protocol",
            in: "query",
            required: false,
            schema: { type: "string", example: "aave-v3" }
          }
        ],
        responses: {
          "200": {
            description: "Health",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LendingHealth" } }
            }
          }
        }
      }
    },
    "/api/web3/candles": {
      get: {
        tags: ["web3"],
        summary: "Historical candles (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          {
            name: "baseToken",
            in: "query",
            required: false,
            schema: { type: "string", example: "WETH" }
          },
          {
            name: "quoteToken",
            in: "query",
            required: false,
            schema: { type: "string", example: "USD" }
          },
          {
            name: "interval",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1m", "5m", "15m", "1h", "4h", "1d"], default: "1m" }
          },
          { name: "startTs", in: "query", required: false, schema: { type: "integer" } },
          { name: "endTs", in: "query", required: false, schema: { type: "integer" } },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 300, minimum: 1, maximum: 5000 }
          }
        ],
        responses: {
          "200": {
            description: "Candles",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CandlesResponse" } }
            }
          }
        }
      }
    },
    "/api/web3/portfolio/pnl": {
      get: {
        tags: ["web3"],
        summary: "Portfolio PnL (mock)",
        parameters: [
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } },
          { name: "address", in: "query", required: true, schema: { type: "string" } },
          {
            name: "period",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["1d", "7d", "30d", "90d", "1y"], default: "7d" }
          }
        ],
        responses: {
          "200": {
            description: "PnL",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/PortfolioPnl" } }
            }
          }
        }
      }
    },
    "/api/web3/tx/send": {
      post: {
        tags: ["tx"],
        summary: "Send tx (mock submission)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  chainId: { type: "integer", example: 1 },
                  from: { type: "string" },
                  to: { type: "string" },
                  value: { type: "string", example: "0" },
                  data: { type: "string", example: "0x" }
                },
                required: ["chainId", "from", "to"]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Submitted",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/TxSubmission" } }
            }
          }
        }
      }
    },
    "/api/web3/tx/{hash}": {
      get: {
        tags: ["tx"],
        summary: "Tx status (mock)",
        parameters: [
          { name: "hash", in: "path", required: true, schema: { type: "string" } },
          { name: "chainId", in: "query", schema: { type: "integer", example: 1 } }
        ],
        responses: {
          "200": {
            description: "Tx status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TxStatus" } } }
          }
        }
      }
    }
  }
} as const;

export function openApiYaml(): string {
  return YAML.stringify(openApiSpec);
}
