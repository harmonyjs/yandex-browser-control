/**
 * @fileoverview Tool: list_tabs – filtered/grouped/sorted listing of tabs.
 */
import { defineTool, type ToolExtra } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { WindowMeta } from "../../models/window-meta.js";
import { z } from "zod";
import { groupKeySchema, orderBySchema } from "./schemas.js";
import { nonNegativeIntSchema } from "../../models/common/non-negative-int.js";
import { windowModeSchema } from "../../models/common/window-mode.js";
import { getTabsOperation } from "../../operations/get-tabs.js";
import { getWindowsOperation } from "../../operations/get-windows.js";
import { apple } from "../../runtime/apple-runner.js";
import { isSuccess, getUserFriendlyMessage } from "@avavilov/apple-script";
import { logger } from "../../logger/index.js";
import { safeHost } from "./utils.js";
import { acceptOptionalRegex } from "./validation.js";
import { formatOutput } from "./formatters.js";
import { groupTabs, sortGroups } from "./grouping.js";
import type { TabWithHost } from "./types.js";
import { applyFilters, needsWindowData } from "./filters.js";
import { LARGE_RESULT_THRESHOLD } from "../../utils/constants.js";

/** Tool name exposed to MCP hosts (snake_case per convention). */
export const name = "list_tabs" as const;
/** Human-readable description for registry/hosts. */
export const description = "List browser tabs with optional filtering, grouping and sorting" as const;

const log = logger.child({ tool: name });

// Raw shape kept explicitly (Record<string, unknown>) so we can both:
// 1) Provide strongly typed Zod validation locally.
// 2) Expose a schema-less shape to the registrar without unsafe double casts.
const inputShape = {
  pattern: z
    .string()
    .optional()
    .refine(acceptOptionalRegex, {
      message: "invalid regex pattern",
    }),
  groupBy: groupKeySchema.default("none"),
  windowId: z.union([nonNegativeIntSchema, z.array(nonNegativeIntSchema)]).optional(),
  mode: windowModeSchema.optional(),
  loading: z.boolean().optional(),
  hostFilter: z
    .string()
    .optional()
    .refine(acceptOptionalRegex, {
      message: "invalid hostFilter regex",
    }),
  orderBy: orderBySchema.optional(),
} satisfies Record<string, unknown>;

// Full Zod schema (private to this module). We avoid exposing the Zod object itself
// to decouple tool modules from the SDK's bundled Zod instance.
// Retained solely for static type inference (z.infer<typeof argsSchema>) – no runtime reads required.
const argsSchema = z.object(inputShape).strict();

/** Parsed input argument type for handler. */
type Input = z.infer<typeof argsSchema>;

/** Exported argument type for external consumers. */
export type Args = Input;

/**
 * Handler – implements filtered/grouped/sorted tab listing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- ToolModule interface requires extra parameter
export async function handler(args: Input, _extra: ToolExtra): Promise<CallToolResult> {
  // Validation is now handled automatically by withValidation middleware
  log.debug({ args }, "list_tabs called");

  // Step 1: Snapshot all tabs
  const tabsResult = await apple.run(getTabsOperation, {});
  if (!isSuccess(tabsResult)) {
    const message = getUserFriendlyMessage(tabsResult.error);
    log.error({ err: tabsResult.error }, "Failed to get tabs");
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to get tabs: ${message}` }],
    };
  }

  let tabs: TabWithHost[] = tabsResult.data.map((tab) => ({
    ...tab,
    host: safeHost(tab.url),
  }));

  // Step 2: Optional windows join
  const windowModeMap = await loadWindowsIfNeeded(args);
  if (windowModeMap instanceof Error) {
    return {
      isError: true,
      content: [{ type: "text", text: windowModeMap.message }],
    };
  }

  // Step 3: Apply filters (single source of truth in filters.ts)
  tabs = applyFilters(tabs, args, windowModeMap);

  // Step 4-6: Group, sort, and format
  const groups = groupTabs(tabs, args.groupBy, windowModeMap);
  const sortedGroups = sortGroups(groups, args.groupBy, args.orderBy);
  let output = formatOutput(sortedGroups, args.groupBy);
  const totalTabs = tabs.length;
  if (totalTabs > LARGE_RESULT_THRESHOLD) {
    output = `WARNING: Large result set (${totalTabs} tabs) – consider refining filters.\n\n` + output;
  }

  return {
    content: [{ type: "text", text: output }],
  };
}

/**
 * Load windows data if needed for mode filtering or grouping.
 */
async function loadWindowsIfNeeded(
  args: Input
): Promise<Map<number, WindowMeta> | undefined | Error> {
  if (!needsWindowData(args) && args.groupBy !== "mode") {
    return undefined;
  }

  const windowsResult = await apple.run(getWindowsOperation, {});
  if (!isSuccess(windowsResult)) {
    const message = getUserFriendlyMessage(windowsResult.error);
    log.error({ err: windowsResult.error }, "Failed to get windows");
    return new Error(`Failed to get windows: ${message}`);
  }

  return new Map(windowsResult.data.map((w) => [w.windowId, w]));
}

/** Tool module export consumed by tools registry. */
export const module = defineTool<Input>({
  name,
  description,
  argsSchema,
  handler,
});
