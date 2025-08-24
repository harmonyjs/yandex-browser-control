// Yandex Browser Control
// Minimal MCP server over stdio

import { server, transport } from "./mcp/server.js";
import { registerShutdown } from "./runtime/shutdown.js";

async function main(): Promise<void> {
  // Register graceful shutdown and force-exit fallback
  registerShutdown({ server, transport });

  // Connect and serve over stdio. This call keeps the process alive
  // until the transport is closed by the client/host.
  await server.connect(transport);
}

main().catch((err) => {
  // Print errors to stderr; never to stdout.
  console.error(err);
  process.exit(1);
});