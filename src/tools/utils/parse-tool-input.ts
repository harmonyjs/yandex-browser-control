/**
 * @fileoverview Shared helper for runtime validation of tool inputs using Zod schemas.
 * 
 * This helper provides a consistent way to validate tool arguments at runtime,
 * returning either parsed data or a formatted error result for the MCP protocol.
 * 
 * Design rationale:
 * - Tools define their own Zod schemas to maintain type safety and validation rules
 * - This helper standardizes the validation/error handling pattern across tools
 * - Keeps validation logic DRY while maintaining tool independence
 * - Integration tests can still bypass validation by calling handlers directly
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Validates raw input arguments against a Zod schema and returns either
 * the parsed data or a properly formatted MCP error result.
 * 
 * @param rawArgs - The raw input arguments to validate
 * @param schema - The Zod schema to validate against
 * @returns Either { success: true, data: T } or { success: false, error: CallToolResult }
 * 
 * @example
 * ```typescript
 * const result = parseToolInput(rawArgs, myZodSchema);
 * if (!result.success) {
 *   return result.error; // Already formatted as CallToolResult
 * }
 * const args = result.data; // Fully typed and validated
 * ```
 */
export function parseToolInput<T>(
  rawArgs: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: CallToolResult } {
  const parsed = schema.safeParse(rawArgs);
  
  if (!parsed.success) {
    // Extract the most relevant error message
    const firstIssue = parsed.error.issues[0];
    const extracted = firstIssue?.message;
    const message = typeof extracted === "string" && extracted.length > 0 
      ? extracted 
      : "invalid arguments";
    
    return {
      success: false,
      error: {
        isError: true,
        content: [{ type: "text", text: message }],
      },
    };
  }
  
  return {
    success: true,
    data: parsed.data,
  };
}