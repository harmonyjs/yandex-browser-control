// MCP runtime singletons: server and stdio transport
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "../runtime/logger.js";
const log = logger.child({ scope: "server" });

export const server = new McpServer({
  name: "yandex-browser-control",
  version: "0.0.1",
});

log.debug({ name: "yandex-browser-control", version: "0.0.1" }, "MCP server initialized");

export const transport = new StdioServerTransport();
