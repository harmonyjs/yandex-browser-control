import type { z } from "zod";
import { schemas as as } from "@avavilov/apple-script";
import { nonNegativeIntSchema } from "./common/non-negative-int.js";
import { windowModeSchema } from "./common/window-mode.js";

/**
 * Raw window metadata for the Operations layer.
 */
export const windowMetaSchema = as
	.record({
		windowId: nonNegativeIntSchema,
		index: nonNegativeIntSchema,
		mode: windowModeSchema,
		bounds: as.bounds,
		visible: as.boolean,
		minimized: as.boolean,
		zoomed: as.boolean,
	});

export type WindowMeta = z.infer<typeof windowMetaSchema>;
