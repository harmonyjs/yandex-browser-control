import { z } from "zod";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";

/**
 * Raw tab snapshot as exposed by AppleScript dictionaries.
 * Unnormalized; Tools layer may add normalizedUrl/host if needed.
 */
export const tabRawSchema = z
	.object({
		windowId: nonNegativeIntSchema,
		tabId: nonNegativeIntSchema,
		title: z.string(),
		url: z.string(),
		loading: z.coerce.boolean(),
	})
	.strict();

export type TabRaw = z.infer<typeof tabRawSchema>;
