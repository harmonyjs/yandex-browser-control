/**
 * @fileoverview Validation middleware for tool input arguments.
 * 
 * Automatically validates tool arguments against the Zod schema if provided.
 * If validation fails, returns a properly formatted MCP error result.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolContext, ToolMiddleware } from "./context.js";
import { parseToolInput } from "../utils/parse-tool-input.js";
import { logger } from "../../logger/index.js";

const log = logger.child({ middleware: "validation" });

/**
 * Middleware that validates tool arguments against the required argsSchema.
 *
 * - Always validates (argsSchema is mandatory)
 * - On success: replaces ctx.args with the parsed object
 * - On failure: returns a structured MCP error result and aborts the chain
 */
export function withValidation(): ToolMiddleware<CallToolResult> {
  return (ctx: ToolContext) => (next: () => Promise<CallToolResult>) => async (): Promise<CallToolResult> => {
    const { mod, args } = ctx;

    // All tools have argsSchema (enforced by types). Validate arguments.
    const validated = parseToolInput(args, mod.argsSchema);

    if (!validated.success) {
      log.debug({ tool: mod.name, error: validated.error }, "Validation failed");
      return validated.error;
    }

    ctx.args = validated.data;
    return next();
  };
}