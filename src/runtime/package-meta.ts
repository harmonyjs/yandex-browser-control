import { createRequire } from "node:module";

export type PackageMeta = { name: string; version: string };

/**
 * Package metadata singleton.
 *
 * Side effects: reads ../../package.json at module load via Node's require.
 * Rationale: avoids JSON import attributes and keeps ESM compatibility.
 */
const require = createRequire(import.meta.url);
export const packageMeta = require("../../package.json") as PackageMeta;
