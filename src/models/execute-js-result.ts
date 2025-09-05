import { z } from "zod";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";

/**
 * Result of executing JavaScript in a tab context.
 * 'result' is intentionally untyped at this layer.
 */
export const executeJsResultSchema = z
	.object({
		tabId: nonNegativeIntSchema,
		ok: z.coerce.boolean(),
		result: z.unknown().optional(),
		error: z.string().optional(),
	})
	.strict();

export type ExecuteJsResult = z.infer<typeof executeJsResultSchema>;
