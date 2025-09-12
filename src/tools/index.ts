// Tools aggregator and registrar
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolModule } from "./types.js";
import { logger } from "../logger/index.js";
import { registerToolModule } from "./register-tool.js";

// Import individual tools' register functions and metadata
import { module as listTabs } from "./list-tabs/index.js";
import { module as listWindows } from "./list-windows/index.js";

const log = logger.child({ scope: "tools" });

export function registerTools(server: McpServer): void {
  const stats = { total: 0, registered: 0, failed: [] as Array<{ name: string; error: unknown }> };

  // Local registration helper with integrated logging and error handling
  const register = (module: ToolModule): void => {
    stats.total++;
    log.info({ tool: module.name, description: module.description }, "registering tool");
    
    try {
      registerToolModule(server, module);
      stats.registered++;
      log.info({ tool: module.name }, "tool registered");
    } catch (err) {
      stats.failed.push({ name: module.name, error: err });
      log.error({ tool: module.name, err }, "tool registration failed");
    }
  };

  // Register each tool imperatively - just add a line here for new tools
  register(listTabs);
  register(listWindows);
  // register(newTool); // future tools

  // Summary
  log.info({
    total: stats.total,
    registered: stats.registered,
    failed: stats.failed.length,
    failedTools: stats.failed.map((f) => f.name),
  }, "tools registration summary");

  if (stats.registered > 0) {
    server.sendToolListChanged();
  }
}
