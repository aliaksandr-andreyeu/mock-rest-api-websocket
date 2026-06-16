import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Keep the config module quiet and request logging off during tests.
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      WS_TICK_MS: "60",
      // Small limits so tests can exercise the guards cheaply.
      WS_MAX_PAYLOAD_BYTES: "1024",
      UPLOAD_MAX_BYTES: "2048"
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/openapi.ts", "src/index.ts"]
    }
  }
});
