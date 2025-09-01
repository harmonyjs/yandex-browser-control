import type { ToolExtra, ToolModule } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createAppleRunner, operation } from "@avavilov/apple-script";
import { logger } from "../../runtime/logger.js";

// Tool metadata
export const name = "count_windows_and_tabs" as const;
export const description = `
    Count total number of open windows and tabs in Yandex Browser on macOS
` as const;

// No inputs for now
export type Input = Record<string, never>;

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

// Create a runner for Yandex Browser
const APP_ID = "ru.yandex.desktop.yandex-browser" as const;
const apple = createAppleRunner({
  appId: APP_ID,
  // Keep conservative defaults; library has its own sensible defaults too
  ensureAppReady: true,
  validateByDefault: true,
});

const log = logger.child({ tool: name });

// Handler implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handler(_extra: ToolExtra): Promise<CallToolResult> {
  const result = await apple.run(countOpenTabs, {});

  if (!result.ok) {
    const { message } = result.error;
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
export const module: ToolModule = {
  name,
  description,
  handler,
};
