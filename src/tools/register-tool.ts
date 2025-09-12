/**
 * @fileoverview Registers ToolModules against the MCP server using a unified (args, extra) handler shape.
 *
 * Key points:
 *  - Decouples local Zod schema instance: we extract raw shape (see extractZodShape) for the SDK.
 *  - Middleware chain (validation → abort → logging) applies uniformly; order defined here.
 *  - One controlled boundary cast only; runtime validation still enforced by the SDK.
 *
 * See tools/README.md for broader architecture rationale.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolExtra, ToolModule } from "./types.js";
import type { ToolContext } from "./middlewares/context.js";
import { withAbort } from "./middlewares/abort.js";
import { withLogging } from "./middlewares/logging.js";
import { withValidation } from "./middlewares/validation.js";
import { extractZodShape } from "./utils/zod-helpers.js";

// Execute tool through middleware stack.
function runThrough(ctx: ToolContext): Promise<CallToolResult> {
  // Leaf runner: invoke the tool handler
  const leaf = (): Promise<CallToolResult> => ctx.mod.handler(ctx.args, ctx.extra);
  
  // Ordered outer→inner: logging (finish timing), abort (early cancel), validation (argument parsing)
  const middlewares = [
    withLogging<CallToolResult>(),
    withAbort<CallToolResult>(),
    withValidation(),
  ];
  
  // Compose right-to-left
  const finalRunner = middlewares.reduceRight(
    (next, middleware) => middleware(ctx)(next),
    leaf
  );
  
  return finalRunner();
}
// Register a ToolModule on the server.
export function registerToolModule(server: McpServer, mod: ToolModule): void {
  // All tools now must provide argsSchema; derive raw shape for SDK schema bridging.
  const rawArgsShape = extractZodShape(mod.argsSchema);

  const metadata = {
    description: mod.description,
  rawArgsShape, // always present (may be empty object for no-arg tool)
    ...(mod.annotations && { annotations: mod.annotations }),
  };

  // Always (args, extra); no-arg tools receive {} from hosts.
  const handler = async (args: unknown, extra: ToolExtra): Promise<CallToolResult> => {
    const ctx: ToolContext = { mod, args, extra };
    return runThrough(ctx);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
  (server.registerTool as any)(mod.name, metadata, handler);
}
