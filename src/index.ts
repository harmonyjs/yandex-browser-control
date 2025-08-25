// Yandex Browser Control
// Minimal MCP server over stdio

import { server, transport } from "./mcp/server.js";
import { registerTools } from "./tools/index.js";
import { registerShutdown } from "./runtime/shutdown.js";
import { logger } from "./runtime/logger.js";
const log = logger.child({ scope: "main" });

async function main(): Promise<void> {
  // Register graceful shutdown and force-exit fallback
  registerShutdown({ server, transport });

  // Register all tools before connecting the transport
  registerTools(server);

  // Connect and serve over stdio. This call keeps the process alive
  // until the transport is closed by the client/host.
  await server.connect(transport);
}

main().catch((err: unknown) => {
  // Log errors to stderr via pino; never to stdout.
  log.error({ err }, "fatal error in main");
  process.exit(1);
});
