// MCP runtime singletons: server and stdio transport
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export const server = new McpServer({
  name: "yandex-browser-control",
  version: "0.0.1",
});

export const transport = new StdioServerTransport();
