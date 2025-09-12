import { defineTool } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { operation, isSuccess, getUserFriendlyMessage } from "@avavilov/apple-script";
import { logger } from "../../logger/index.js";
import { apple } from "../../runtime/apple-runner.js";

// Tool metadata
export const name = "count_windows_and_tabs" as const;
export const description = `
    Count total number of open windows and tabs in Yandex Browser on macOS
` as const;

// Input schema (empty for no-argument tool)
const argsSchema = z.object({});

/** Exported argument type for external consumers. */
export type Args = z.infer<typeof argsSchema>;

const log = logger.child({ tool: name });

// AppleScript operation: count all tabs across all windows
const countOpenTabs = operation.scalar({
  name: "countOpenTabs",
  input: z.object({}),
  // Parse the scalar string result into an integer and validate
  output: z
    .string()
    .transform((s) => {
      const n = parseInt(String(s), 10);
      if (!Number.isFinite(n)) throw new Error(`Not a number: ${s}`);
      return n;
    })
    .pipe(z.number().int().nonnegative()),
  script: () => `
    set totalTabs to 0
    try
      set winCount to (count of windows)
    on error
      set winCount to 0
    end try
    if winCount > 0 then
      repeat with w in windows
        try
          set totalTabs to totalTabs + (count of tabs of w)
        on error
          -- Some window types might not have tabs; ignore and continue
        end try
      end repeat
    end if
    return (totalTabs as text)
  `,
});

export async function handler(): Promise<CallToolResult> {
  const result = await apple.run(countOpenTabs, {});

  if (!isSuccess(result)) {
    const message = getUserFriendlyMessage(result.error);
    log.error({ err: result.error }, "countOpenTabs failed");
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Failed to count tabs: ${message}`,
        },
      ],
    };
  }

  return { content: [{ type: "text", text: String(result.data) }] };
}

// Tool module export (unified contract)
export const module = defineTool({
  name,
  description,
  argsSchema,
  // Ignore args; middleware always supplies an object
  handler: async (): Promise<CallToolResult> => handler(),
});
