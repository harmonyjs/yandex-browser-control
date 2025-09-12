/**
 * @fileoverview Shared types for the list-tabs tool.
 */
import type { TabRaw } from "../../models/tab-raw.js";

/**
 * Enhanced tab type with computed host field for filtering/grouping.
 */
export type TabWithHost = TabRaw & { host: string };
