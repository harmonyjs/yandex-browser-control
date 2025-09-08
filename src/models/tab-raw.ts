import { z } from "zod";
import { schemas as as } from "@avavilov/apple-script";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";

/**
 * Raw tab snapshot as exposed by AppleScript dictionaries.
 * Unnormalized; Tools layer may add normalizedUrl/host if needed.
 */
export const tabRawSchema = as.record({
	windowId: nonNegativeIntSchema,
	tabId: nonNegativeIntSchema,
	title: z.string(),
	url: z.string(),
	loading: as.boolean,
});

export type TabRaw = z.infer<typeof tabRawSchema>;
