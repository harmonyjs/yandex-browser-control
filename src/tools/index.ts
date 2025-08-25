// Tools aggregator and registrar
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolModule } from "./types.js";
import { logger } from "../runtime/logger.js";
import { registerToolModule } from "./register-tool.js";

// Import individual tools' register functions and metadata
import { module as countWindowsAndTabs } from "./count-windows-and-tabs/index.js";

const log = logger.child({ scope: "tools" });

const tools: Array<ToolModule> = [
  countWindowsAndTabs,
  // next tools here...
];

export function registerTools(server: McpServer): void {
  const failed: Array<{ name: string; error: unknown }> = [];
  let registered = 0;

  for (const t of tools) {
    log.info({ tool: t.name, description: t.description }, "registering tool");
    try {
      registerToolModule(server, t);
      registered += 1;
      log.info({ tool: t.name }, "tool registered");
    } catch (err) {
      failed.push({ name: t.name, error: err });
      log.error({ tool: t.name, err }, "tool registration failed");
    }
  }

  const summary = {
    total: tools.length,
    registered,
    failed: failed.length,
    failedTools: failed.map((f) => f.name),
  };

  log.info(summary, "tools registration summary");

  if (registered > 0) {
    server.sendToolListChanged();
  }
}
