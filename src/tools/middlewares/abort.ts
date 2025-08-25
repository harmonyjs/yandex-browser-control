import type { Runner, Wrapper } from "../../utils/middleware/index.js";
import type { ToolExtra } from "../types.js";
import { logger } from "../../runtime/logger.js";
import { createAbortError } from "../../utils/errors.js";

/**
 * Wrap a handler with abort wiring. Logs a warning on abort and ensures
 * the event listener is removed. Throws AbortError if already aborted.
 */
export async function runWithAbort<T>(
  name: string,
  extra: ToolExtra,
  run: () => Promise<T>,
): Promise<T> {
  const { signal, requestId } = extra;

  const onAbort = (): void => {
    logger.warn({ tool: name, requestId }, "tool call aborted");
  };

  if (signal.aborted) {
    onAbort();
    throw createAbortError();
  }

  signal.addEventListener("abort", onAbort, { once: true });
  try {
    return await run();
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Curried wrapper form for middleware chaining.
 */
export function withAbort<T>(name: string, extra: ToolExtra): Wrapper<T> {
  return (next: Runner<T>): Runner<T> =>
    async (): Promise<T> =>
      runWithAbort(name, extra, next);
}
