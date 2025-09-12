import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as listWindowsHandler, type Args as ListWindowsArgsFull } from './index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolExtra } from '../types.js';

// Minimal ToolExtra stub
const extraStub = { signal: new AbortController().signal } as unknown as ToolExtra;

type ListWindowsArgs = Partial<ListWindowsArgsFull>;

async function runTool(args: ListWindowsArgs): Promise<CallToolResult> {
  const result = await listWindowsHandler(args as ListWindowsArgsFull, extraStub);
  if (result.isError === true) {
    const first = Array.isArray(result.content) ? result.content[0] : undefined;
    const rawMessage = first && first.type === 'text' ? first.text : 'Unknown tool error';
    assert.fail(rawMessage);
  }
  return result;
}

void test('[int] [list-windows] list_windows basic invocation returns text output', { timeout: 60_000 }, async () => {
  const res = await runTool({});
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem, 'text item present');
  const body: string = textItem?.text ?? '';
  assert.ok(/Found \d+ window|No windows found/i.test(body) || body.startsWith('Found '), 'contains summary line');
});

void test('[int] [list-windows] list_windows orderBy=index sorts ascending', { timeout: 60_000 }, async () => {
  const res = await runTool({ orderBy: 'index' });
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem);
  const lines = (textItem?.text ?? '').split('\n').filter(l => l.startsWith('•'));
  // Extract indices and ensure non-decreasing sequence
  const indices = lines.map(l => Number(l.match(/index=(\d+)/)?.[1])).filter(n => Number.isFinite(n));
  const sorted = indices.slice().sort((a,b)=>a-b);
  assert.deepEqual(indices, sorted, 'indices are in ascending order');
});

void test('[int] [list-windows] list_windows mode filter (normal)', { timeout: 60_000 }, async () => {
  const res = await runTool({ mode: 'normal' });
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem);
  const body = textItem.text;
  // All bullet lines should have mode=normal
  const bulletLines = body.split('\n').filter(l => l.startsWith('•'));
  for (const line of bulletLines) {
    assert.ok(/mode=normal/.test(line), 'line respects mode filter');
  }
});
