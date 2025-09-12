import type { ToolContext, ToolMiddleware } from "./context.js";
import { logger } from "../../logger/index.js";
import { createAbortError } from "../../utils/errors.js";

/**
 * Middleware that handles abort signals for tool execution.
 * Logs a warning on abort and ensures the event listener is removed.
 * Throws AbortError if already aborted.
 */
export function withAbort<T>(): ToolMiddleware<T> {
  return (ctx: ToolContext) => (next: () => Promise<T>) => async (): Promise<T> => {
    const { signal, requestId } = ctx.extra;
    const { name } = ctx.mod;

    const onAbort = (): void => {
      logger.warn({ tool: name, requestId }, "tool call aborted");
    };

    if (signal.aborted) {
      onAbort();
      throw createAbortError();
    }

    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await next();
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  };
}
