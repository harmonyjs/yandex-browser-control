import type { ToolContext, ToolMiddleware } from "./context.js";
import { logger } from "../../logger/index.js";

/**
 * Middleware that logs tool execution timing and completion.
 */
export function withLogging<T>(): ToolMiddleware<T> {
  return (ctx: ToolContext) => (next: () => Promise<T>) => async (): Promise<T> => {
    const start = Date.now();
    const { requestId } = ctx.extra;
    const { name } = ctx.mod;
    
    try {
      return await next();
    } finally {
      const durationMs = Date.now() - start;
      logger.info({ tool: name, requestId, durationMs }, "tool call finished");
    }
  };
}
