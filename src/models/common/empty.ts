import { z } from "zod";

/**
 * Explicit empty object used by Operations that do not accept parameters.
 */
export const emptySchema = z.object({}).strict();

export type Empty = z.infer<typeof emptySchema>;
