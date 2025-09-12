/**
 * @fileoverview Centralized predicate helpers for Zod refinements in list-tabs.
 * Keeps index.ts lean and documents intent of validation rules.
 */
import { isValidRegex } from './utils.js';

/** Allow empty / undefined (treated as "not provided"), otherwise must compile. */
export function acceptOptionalRegex(v: string | undefined): boolean {
  return v === undefined || v === '' || isValidRegex(v);
}
