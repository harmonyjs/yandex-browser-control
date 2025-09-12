/**
 * @fileoverview Shared plain-text header formatting utilities for tool outputs.
 * Minimal surface area intentionally – only extracted after 2 concrete usages (tabs, windows).
 */
import { LARGE_RESULT_THRESHOLD } from "../../utils/constants.js";

interface CountHeaderOptions {
  /** Total entity count. */
  count: number;
  /** Singular noun (e.g. "tab", "window"). */
  singular: string;
  /** Explicit plural noun; defaults to singular + 's'. */
  plural?: string;
  /** Threshold beyond which a large result warning is prepended. */
  largeResultThreshold?: number;
}

/**
 * Format a header like:
 *  Found 3 tabs
 * or with warning when count exceeds threshold:
 *  WARNING: Large result set (123 tabs) – consider refining filters.
 *  \nFound 123 tabs
 */
export function formatCountHeader(opts: CountHeaderOptions): string {
  const { count, singular } = opts;
  const plural = opts.plural ?? `${singular}s`;
  const threshold = opts.largeResultThreshold ?? LARGE_RESULT_THRESHOLD;
  const noun = count === 1 ? singular : plural;
  let header = `Found ${count} ${noun}`;
  if (count > threshold) {
    header = `WARNING: Large result set (${count} ${plural}) – consider refining filters.\n\n` + header;
  }
  return header;
}
