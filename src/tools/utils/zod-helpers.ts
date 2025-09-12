/**
 * @fileoverview Helpers for working with Zod schemas in a type-safe way.
 */
import type { z } from "zod";

/**
 * Extracts the raw shape from a Zod object schema.
 * Returns undefined if the schema is not a ZodObject or doesn't have a shape property.
 * 
 * Used to derive a raw JSON-compatible shape for the SDK from our tool's Zod schema.
 */
export function extractZodShape(schema: z.ZodType<unknown> | undefined): Record<string, unknown> | undefined {
  if (!schema) return undefined;
  
  // Check if it's a ZodObject with a shape property
  if ('shape' in schema && typeof schema.shape === 'object' && schema.shape !== null) {
    return schema.shape as Record<string, unknown>;
  }
  
  return undefined;
}