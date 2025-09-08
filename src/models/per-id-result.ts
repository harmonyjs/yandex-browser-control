import { z } from "zod";
import { schemas as as } from "@avavilov/apple-script";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";

/**
 * Result item for batch Operations that act on ids.
 * Enables partial success accounting and safe retries.
 */
export const perIdResultSchema = z
	.object({
		id: nonNegativeIntSchema,
		ok: as.boolean,
		error: z.string().optional(),
	})
	.strict();

export type PerIdResult = z.infer<typeof perIdResultSchema>;
