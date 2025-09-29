import { describe, it, expect, test } from 'vitest';
import { handler as listWindowsHandler, type Args as ListWindowsArgs } from './index.js';
import { runToolHandler, getFirstTextBlock } from '../test-utils.js';

describe('list-windows integration', () => {
  test.skipIf(process.platform !== 'darwin')('platform check (skipped on non-darwin)', () => {
    expect(true).toBe(true);
  });
  it('[int] list_windows basic invocation returns text output', async () => {
    const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, {} as ListWindowsArgs);
    const body = getFirstTextBlock(res);
    expect(/Found \d+ window|No windows found/i.test(body) || body.startsWith('Found ')).toBe(true);
  }, 60_000);

  it('[int] list_windows orderBy=index sorts ascending', async () => {
    const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, { orderBy: 'index' } as ListWindowsArgs);
    const lines = getFirstTextBlock(res).split('\n').filter(l => l.startsWith('•'));
    const indices = lines.map(l => Number(l.match(/index=(\d+)/)?.[1])).filter(n => Number.isFinite(n));
    const sorted = indices.slice().sort((a,b)=>a-b);
    expect(indices).toEqual(sorted);
  }, 60_000);

    it('[int] list_windows mode filter (normal)', async () => {
    const res = await runToolHandler<ListWindowsArgs>(listWindowsHandler, { mode: 'normal' } as ListWindowsArgs);
    const body = getFirstTextBlock(res);
    const bulletLines = body.split('\n').filter(l => l.startsWith('•'));
    for (const line of bulletLines) {
      expect(/mode=normal/.test(line)).toBe(true);
    }
  }, 60_000);
});
