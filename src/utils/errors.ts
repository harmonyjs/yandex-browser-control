/**
 * Small error utilities reused across modules.
 */

/**
 * Create a standardized AbortError without relying on DOMException.
 *
 * Why: Node.js does not have DOMException by default. Using a plain Error with
 * the name set to "AbortError" provides predictable semantics and keeps
 * consumers' catch blocks simple (match by name).
 */
export function createAbortError(): Error {
  const err = new Error("Request aborted");
  err.name = "AbortError";
  return err;
}
