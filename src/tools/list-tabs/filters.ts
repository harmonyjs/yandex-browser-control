/**
 * @fileoverview Tab filtering primitives for list_tabs (pure functions).
 *
 * Order rationale (applyFilters): windowId → loading → pattern → hostFilter → mode
 *  - Cheap, highly selective predicates first (windowId, loading) shrink dataset early.
 *  - Regex evaluations deferred until necessary to reduce worst‑case passes.
 *  - Mode last because it may depend on an optional window metadata join.
 */

import type { WindowMeta } from "../../models/window-meta.js";
import type { WindowMode } from "../../models/common/window-mode.js";
import type { TabWithHost } from "./types.js";
import { compileOptionalRegex } from "./utils.js";

export interface FilterOptions {
  /** RegExp pattern to match against tab URL or title */
  pattern?: string;
  /** Single window ID or array of window IDs to include */
  windowId?: number | number[];
  /** Filter by loading state (true = only loading, false = only loaded) */
  loading?: boolean;
  /** RegExp pattern to match against normalized host */
  hostFilter?: string;
  /** Window mode filter (requires window data) */
  mode?: WindowMode;
}

function filterByWindowId(tabs: TabWithHost[], windowId: number | number[]): TabWithHost[] {
  const allowedIds = Array.isArray(windowId) ? new Set(windowId) : new Set([windowId]);
  return tabs.filter((tab) => allowedIds.has(tab.windowId));
}

function filterByLoading(tabs: TabWithHost[], loading: boolean): TabWithHost[] {
  return tabs.filter((tab) => tab.loading === loading);
}

function filterByPattern(tabs: TabWithHost[], pattern: string): TabWithHost[] {
  const regex = compileOptionalRegex(pattern);
  if (!regex) return tabs;
  return tabs.filter((tab) => regex.test(tab.url) || regex.test(tab.title));
}

function filterByHost(tabs: TabWithHost[], hostFilter: string): TabWithHost[] {
  const hostRegex = compileOptionalRegex(hostFilter);
  if (!hostRegex) return tabs;
  return tabs.filter((tab) => hostRegex.test(tab.host));
}

function filterByMode(
  tabs: TabWithHost[],
  mode: WindowMode,
  windowModeMap?: Map<number, WindowMeta>
): TabWithHost[] {
  if (!windowModeMap) return tabs;
  return tabs.filter((tab) => windowModeMap.get(tab.windowId)?.mode === mode);
}

export function applyFilters(
  tabs: TabWithHost[],
  options: FilterOptions,
  windowModeMap?: Map<number, WindowMeta>
): TabWithHost[] {
  let filtered = tabs;

  if (options.windowId !== undefined) {
    filtered = filterByWindowId(filtered, options.windowId);
  }

  if (options.loading !== undefined) {
    filtered = filterByLoading(filtered, options.loading);
  }

  if (options.pattern !== undefined && options.pattern !== "") {
    filtered = filterByPattern(filtered, options.pattern);
  }

  if (options.hostFilter !== undefined && options.hostFilter !== "") {
    filtered = filterByHost(filtered, options.hostFilter);
  }

  if (options.mode !== undefined) {
    filtered = filterByMode(filtered, options.mode, windowModeMap);
  }

  return filtered;
}

export function needsWindowData(options: FilterOptions): boolean {
  return options.mode !== undefined;
}