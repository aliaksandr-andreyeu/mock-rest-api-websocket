import http from "node:http";
import { createHttpApp } from "./http.js";
import { attachWebSocketServer } from "./ws.js";

const port = Number(process.env.PORT ?? 3000);

const app = createHttpApp();
const server = http.createServer(app);

attachWebSocketServer(server);

server.listen(port, () => {
  console.log(`REST: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
  console.log(`OpenAPI YAML: http://localhost:${port}/openapi.yaml`);
  console.log(`WebSocket: ws://localhost:${port}/ws`);
});
