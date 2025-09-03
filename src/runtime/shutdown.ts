// Graceful shutdown orchestration for MCP server over stdio
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger, flushLogs } from "../logger/index.js";
const log = logger.child({ scope: "shutdown" });

export type ShutdownOptions = {
  server: McpServer;
  transport: StdioServerTransport;
  forceExitMs?: number; // default 10s
};

const DEFAULT_FORCE_EXIT_MS = 10_000;

// Side effects: registers process signal listeners; logs only to stderr.
export function registerShutdown({
  server,
  transport,
  forceExitMs = DEFAULT_FORCE_EXIT_MS,
}: ShutdownOptions): () => void {
  let isShuttingDown = false;
  let forceExitTimer: NodeJS.Timeout | undefined;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    // stderr only (via pino destination policy) to avoid corrupting MCP stdout
    log.warn({ signal }, "received signal, shutting down...");

    forceExitTimer = setTimeout(() => {
      log.error({ forceExitMs }, "force-exiting after timeout");
      process.exit(1);
    }, forceExitMs);
    forceExitTimer.unref();

    try {
      await server.close();
      await transport.close();
      await flushLogs();
    } catch (err) {
      log.error({ err }, "error during shutdown");
    } finally {
      if (forceExitTimer !== undefined) clearTimeout(forceExitTimer);
      process.exit(0);
    }
  };

  const onSigint = (): void => {
    void shutdown("SIGINT");
  };
  const onSigterm = (): void => {
    void shutdown("SIGTERM");
  };

  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);

  // Return teardown to allow tests or embedders to remove listeners
  return () => {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    if (forceExitTimer) clearTimeout(forceExitTimer);
  };
}
