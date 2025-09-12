/**
 * @fileoverview Minimal shared constants (time & tool semantics). Keep lean.
 */

/** Milliseconds per second. */
export const MILLIS_IN_SECOND = 1_000;

/**
 * Soft heuristic for large tab listing output; triggers a warning banner.
 * Chosen conservatively; elevate to configurable only if real-world feedback demands.
 */
export const LARGE_RESULT_THRESHOLD = 1_000;
