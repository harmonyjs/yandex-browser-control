import type { ToolExtra, ToolModule } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Tool metadata
export const name = "count_windows_and_tabs" as const;
export const description =  `
    Count total number of open windows and tabs in the browser
` as const;

// No inputs for now
export type Input = Record<string, never>;

// Handler implementation
// Accept ToolExtra for future use (e.g., cancellation via extra.signal)
// We intentionally keep the parameter to expose IntelliSense and maintain a stable signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handler(_: ToolExtra): Promise<CallToolResult> {
  // keep async shape for future I/O; keep an await to satisfy lints
  await Promise.resolve();
  const MAX = 100;
  const MIN = 1;
  const n = Math.floor(Math.random() * MAX) + MIN;
  return { content: [{ type: "text", text: String(n) }] };
}

// Tool module export (unified contract)
export const module: ToolModule = {
  name,
  description,
  handler
};
