import { z } from "zod";

/**
 * Non-negative integer.
 * Coerces from strings (AppleScript often returns text).
 * Pure schema; no side effects.
 */
export const nonNegativeIntSchema = z.coerce.number().int().min(0);

export type NonNegativeInt = z.infer<typeof nonNegativeIntSchema>;
