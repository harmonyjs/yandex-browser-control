import { z } from "zod";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";
import { boundsSchema } from "./common/bounds.js";
import { windowModeSchema } from "./common/window-mode.js";

/**
 * Raw window metadata for the Operations layer.
 */
export const windowMetaSchema = z
	.object({
		windowId: nonNegativeIntSchema,
		index: nonNegativeIntSchema,
		mode: windowModeSchema,
		bounds: boundsSchema,
		visible: z.coerce.boolean(),
		minimized: z.coerce.boolean(),
		zoomed: z.coerce.boolean(),
	})
	.strict();

export type WindowMeta = z.infer<typeof windowMetaSchema>;
