import { z } from "zod";

/**
 * Browser window mode for the Operations layer.
 */
export const windowModeSchema = z.enum(["normal", "incognito"]);

export type WindowMode = z.infer<typeof windowModeSchema>;
