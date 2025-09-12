/**
 * @fileoverview Shared test utilities for tool integration tests.
 * Centralizes common patterns: ToolExtra stub, running handlers, extracting text content.
 * Pure utilities – no side effects beyond creating abort controllers per call.
 */
import assert from 'node:assert/strict';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolExtra } from './types.js';

/** Create a minimal ToolExtra stub suitable for invoking a tool handler in tests. */
export function createToolExtraStub(): ToolExtra {
  // We currently only rely on an AbortSignal; can extend later if middleware evolves.
  return { signal: new AbortController().signal } as unknown as ToolExtra;
}

/** Extract only text items from tool result content. */
export function extractTextItems(result: CallToolResult): string[] {
  const { content } = result;
  if (!Array.isArray(content)) return [];
  const out: string[] = [];
  for (const item of content) {
    if (
      item !== null &&
      item !== undefined &&
      typeof item === 'object' &&
      'type' in item &&
      (item as { type?: unknown }).type === 'text' &&
      'text' in item &&
      typeof (item as { text?: unknown }).text === 'string'
    ) {
      out.push((item as { text: string }).text);
    }
  }
  return out;
}

/** Convenience: return the first text block or empty string. */
export function getFirstTextBlock(result: CallToolResult): string {
  return extractTextItems(result)[0] ?? '';
}

/**
 * Run a tool handler (list_tabs, list_windows, etc.) with unified error handling.
 * Fails the test immediately if tool reported isError=true.
 */
export async function runToolHandler<Args>(
  handler: (args: Args, extra: ToolExtra) => Promise<CallToolResult>,
  args: Args,
  extra: ToolExtra = createToolExtraStub()
): Promise<CallToolResult> {
  const res = await handler(args, extra);
  if (res.isError === true) {
    const firstText = getFirstTextBlock(res);
    assert.fail(firstText === '' ? 'Unknown tool error' : firstText);
  }
  return res;
}
