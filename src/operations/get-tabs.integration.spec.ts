import { describe, it, expect, test } from 'vitest';
import { isSuccess, getUserFriendlyMessage, isAppleScriptError, isTimeoutError } from "@avavilov/apple-script";
import { apple } from "../runtime/apple-runner.js";
import { getTabsOperation } from "./get-tabs.js";

// Error handling policy: ANY error is a test failure (no skips)
function formatRunError(error: unknown): string {
  const message = getUserFriendlyMessage(error);
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  if (isTimeoutError(cause)) return `Timeout executing get-tabs: ${message}`;
  if (isAppleScriptError(cause)) return `AppleScript error executing get-tabs: ${message}`;
  return `Unexpected error executing get-tabs: ${message}`;
}

// Run only on macOS because AppleScript is macOS-specific.
describe('get-tabs integration', () => {
  test.skipIf(process.platform !== 'darwin')('platform check (skipped on non-darwin)', () => {
    // Marker test to indicate skip reason in reports.
    expect(true).toBe(true);
  });
  it('[int] returns valid TabRaw[] shape', async () => {
    const result = await apple.run(getTabsOperation, {});
    if (!isSuccess(result)) {
      throw new Error(formatRunError(result.error));
    }
    const rows = result.data;
    for (const row of rows.slice(0, 3)) {
      expect(Number.isInteger(row.windowId) && row.windowId >= 0).toBe(true);
      expect(Number.isInteger(row.tabId) && row.tabId >= 0).toBe(true);
      expect(typeof row.title).toBe('string');
      expect(typeof row.url).toBe('string');
      expect(typeof row.loading).toBe('boolean');
    }
  }, 60_000);
});
