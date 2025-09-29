import { describe, it, expect, test } from 'vitest';
import { isSuccess, getUserFriendlyMessage, isAppleScriptError, isTimeoutError } from "@avavilov/apple-script";
import { apple } from "../runtime/apple-runner.js";
import { getWindowsOperation } from "./get-windows.js";

// Error handling policy: ANY error is a test failure (no skips)
function formatRunError(error: unknown): string {
  const message = getUserFriendlyMessage(error);
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  if (isTimeoutError(cause)) return `Timeout executing get-windows: ${message}`;
  if (isAppleScriptError(cause)) return `AppleScript error executing get-windows: ${message}`;
  return `Unexpected error executing get-windows: ${message}`;
}

describe('get-windows integration', () => {
  test.skipIf(process.platform !== 'darwin')('platform check (skipped on non-darwin)', () => {
    expect(true).toBe(true);
  });
  it('[int] returns valid WindowMeta[] shape', async () => {
    const result = await apple.run(getWindowsOperation, {});
    if (!isSuccess(result)) {
      throw new Error(formatRunError(result.error));
    }
    const rows = result.data;
    for (const row of rows.slice(0, 3)) {
      expect(Number.isInteger(row.windowId) && row.windowId >= 0).toBe(true);
      expect(Number.isInteger(row.index) && row.index >= 0).toBe(true);
      expect(row.mode === 'normal' || row.mode === 'incognito').toBe(true);
      expect(Array.isArray(row.bounds) && row.bounds.length === 4).toBe(true);
      expect(typeof row.visible).toBe('boolean');
      expect(typeof row.minimized).toBe('boolean');
      expect(typeof row.zoomed).toBe('boolean');
    }
  }, 30_000);
});
