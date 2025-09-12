/**
 * @fileoverview Tool: list_windows – filtered & sorted listing of browser windows.
 */
import { z } from "zod";
import { defineTool, type ToolExtra } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { orderBySchema } from "./schemas.js";
import { nonNegativeIntSchema } from "../../models/common/non-negative-int.js";
import { windowModeSchema } from "../../models/common/window-mode.js";
import { getWindowsOperation } from "../../operations/get-windows.js";
import { filterWindows } from "./filters.js";
import { sortWindows } from "./sorting.js";
import { formatList } from "./formatters.js";
import { apple } from "../../runtime/apple-runner.js";
import { isSuccess, getUserFriendlyMessage } from "@avavilov/apple-script";
import { logger } from "../../logger/index.js";

export const name = "list_windows" as const;
export const description = "List browser windows with optional filtering and sorting" as const;

const log = logger.child({ tool: name });

const argsSchema = z.object({
  windowId: z.union([nonNegativeIntSchema, z.array(nonNegativeIntSchema)]).optional(),
  mode: windowModeSchema.optional(),
  orderBy: orderBySchema.optional(),
}).strict();

export type Args = z.infer<typeof argsSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- extra reserved for future (abort signal etc.)
export async function handler(args: Args, _extra: ToolExtra): Promise<CallToolResult> {
  log.debug({ args }, "list_windows called");

  const windowsResult = await apple.run(getWindowsOperation, {});
  if (!isSuccess(windowsResult)) {
    const message = getUserFriendlyMessage(windowsResult.error);
    log.error({ err: windowsResult.error }, "Failed to get windows");
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to get windows: ${message}` }],
    };
  }

  const filtered = filterWindows(windowsResult.data, args);
  const sorted = sortWindows(filtered, args.orderBy);
  const output = formatList(sorted);
  return { content: [{ type: "text", text: output }] };
}

export const module = defineTool<Args>({
  name,
  description,
  argsSchema,
  handler,
});
