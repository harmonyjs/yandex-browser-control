// MCP runtime singletons: server and stdio transport
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "../runtime/logger.js";
import { packageMeta as pkg } from "../runtime/package-meta.js";

const log = logger.child({ scope: "server" });

export const server = new McpServer({
  name: pkg.name,
  version: pkg.version,
});

log.debug({ name: pkg.name, version: pkg.version }, "MCP server initialized");

export const transport = new StdioServerTransport();
