import type { Runner, Wrapper } from "../../utils/middleware/index.js";
import type { ToolExtra } from "../types.js";
import { logger } from "../../logger/index.js";

/**
 * Wrap a handler with timing and final info logging.
 * Note: kept to 3 parameters to satisfy max-params rule.
 */
export async function runWithLogging<T>(
  name: string,
  extra: ToolExtra,
  run: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  const { requestId } = extra;
  try {
    return await run();
  } finally {
    const durationMs = Date.now() - start;
    logger.info({ tool: name, requestId, durationMs }, "tool call finished");
  }
}

/**
 * Curried wrapper form for middleware chaining.
 */
export function withLogging<T>(name: string, extra: ToolExtra): Wrapper<T> {
  return (next: Runner<T>): Runner<T> =>
    async (): Promise<T> =>
      runWithLogging(name, extra, next);
}
