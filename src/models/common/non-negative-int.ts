import { z } from "zod";
import { schemas as as } from "@avavilov/apple-script";

/**
 * Non-negative integer.
 * Coerces from strings (AppleScript often returns text).
 * Pure schema; no side effects.
 */
export const nonNegativeIntSchema = as.number.pipe(z.number().int().nonnegative());

export type NonNegativeInt = z.infer<typeof nonNegativeIntSchema>;
