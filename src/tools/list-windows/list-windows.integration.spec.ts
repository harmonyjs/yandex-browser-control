import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as listWindowsHandler, type Args as ListWindowsArgs } from './index.js';
import { runToolHandler, getFirstTextBlock } from '../test-utils.js';

void test('[int] [list-windows] list_windows basic invocation returns text output', { timeout: 60_000 }, async () => {
  const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, {} as ListWindowsArgs);
  const body = getFirstTextBlock(res);
  assert.ok(/Found \d+ window|No windows found/i.test(body) || body.startsWith('Found '), 'contains summary line');
});

void test('[int] [list-windows] list_windows orderBy=index sorts ascending', { timeout: 60_000 }, async () => {
  const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, { orderBy: 'index' } as ListWindowsArgs);
  const lines = getFirstTextBlock(res).split('\n').filter(l => l.startsWith('•'));
  // Extract indices and ensure non-decreasing sequence
  const indices = lines.map(l => Number(l.match(/index=(\d+)/)?.[1])).filter(n => Number.isFinite(n));
  const sorted = indices.slice().sort((a,b)=>a-b);
  assert.deepEqual(indices, sorted, 'indices are in ascending order');
});

void test('[int] [list-windows] list_windows mode filter (normal)', { timeout: 60_000 }, async () => {
  const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, { mode: 'normal' } as ListWindowsArgs);
  const body = getFirstTextBlock(res);
  // All bullet lines should have mode=normal
  const bulletLines = body.split('\n').filter(l => l.startsWith('•'));
  for (const line of bulletLines) {
    assert.ok(/mode=normal/.test(line), 'line respects mode filter');
  }
});
