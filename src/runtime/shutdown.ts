// Graceful shutdown orchestration for MCP server over stdio
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export type ShutdownOptions = {
  server: McpServer;
  transport: StdioServerTransport;
  forceExitMs?: number; // default 10s
};

const DEFAULT_FORCE_EXIT_MS = 10_000;

// Side effects: registers process signal listeners; logs only to stderr.
export function registerShutdown({ server, transport, forceExitMs = DEFAULT_FORCE_EXIT_MS }: ShutdownOptions): () => void {
  let isShuttingDown = false;
  let forceExitTimer: NodeJS.Timeout | undefined;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    // stderr only to avoid corrupting MCP stdout
    console.error(`[mcp] received ${signal}, shutting down...`);

    forceExitTimer = setTimeout(() => {
      console.error(`[mcp] force-exiting after ${forceExitMs}ms`);
      process.exit(1);
    }, forceExitMs);
    forceExitTimer.unref();

    try {
      await server.close();
      await transport.close();
    } catch (err) {
      console.error(`[mcp] error during shutdown:`, err);
    } finally {
      if (forceExitTimer !== undefined) clearTimeout(forceExitTimer);
      process.exit(0);
    }
  };

  const onSigint = (): void => { void shutdown("SIGINT"); };
  const onSigterm = (): void => { void shutdown("SIGTERM"); };

  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);

  // Return teardown to allow tests or embedders to remove listeners
  return () => {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    if (forceExitTimer) clearTimeout(forceExitTimer);
  };
}
