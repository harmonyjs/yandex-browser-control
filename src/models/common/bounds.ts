import { z } from "zod";

/**
 * Window rectangle: [x, y, width, height].
 * Integers; coerced from strings for AppleScript compatibility.
 */
export const boundsSchema = z.tuple([
	z.coerce.number().int(), // x
	z.coerce.number().int(), // y
	z.coerce.number().int(), // width
	z.coerce.number().int(), // height
]);

export type Bounds = z.infer<typeof boundsSchema>;
