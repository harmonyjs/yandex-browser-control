import { describe, it, expect, test } from 'vitest';
import { handler as listTabsHandler } from './index.js';
import { runToolHandler, getFirstTextBlock } from '../test-utils.js';

// Mirror public Args shape (subset) – groupBy optional here but we normalize before call.
interface ListTabsArgs {
  pattern?: string;
  groupBy?: 'none' | 'window' | 'host' | 'mode';
  windowId?: number | number[];
  mode?: 'normal' | 'incognito';
  loading?: boolean;
  hostFilter?: string;
  orderBy?: 'title' | 'url' | 'host' | 'windowId' | 'tabId' | 'loading' | 'mode';
}

type NormalizedArgs = Omit<ListTabsArgs, 'groupBy'> & { groupBy: 'none' | 'window' | 'host' | 'mode' };

function normalize(args: ListTabsArgs): NormalizedArgs {
  return { groupBy: 'none', ...args } as NormalizedArgs;
}

describe('list-tabs integration', () => {
  test.skipIf(process.platform !== 'darwin')('platform check (skipped on non-darwin)', () => {
    expect(true).toBe(true);
  });
  it('[int] list_tabs basic invocation returns text output', async () => {
    const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'none' }));
    const body = getFirstTextBlock(res);
    expect(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found ')).toBe(true);
  }, 60_000);

  it('[int] list_tabs grouping by host (orderBy=title) produces bullet list', async () => {
    const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'host', orderBy: 'title' }));
    const body = getFirstTextBlock(res);
    expect(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found ')).toBe(true);
    expect(/• /.test(body)).toBe(true);
  }, 30_000);

  it('[int] list_tabs grouping by mode loads windows metadata', async () => {
    const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'mode' }));
    const body = getFirstTextBlock(res);
    const hasModeHeading = /## .* mode/i.test(body);
    const hasSummary = /Grouped by: mode/.test(body);
    expect(hasModeHeading || hasSummary).toBe(true);
  }, 30_000);

  it('[int] list_tabs invalid regex pattern returns error', async () => {
    const { module: listTabsModule } = await import('./index.js');
    const invalidArgs = { pattern: '(', groupBy: 'none' };
    const result = listTabsModule.argsSchema.safeParse(invalidArgs);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues[0];
      expect(error?.message).toBe('invalid regex pattern');
    }
  });

  it('[int] list_tabs invalid hostFilter regex returns error', async () => {
    const { module: listTabsModule } = await import('./index.js');
    const invalidArgs = { hostFilter: '(', groupBy: 'none' };
    const result = listTabsModule.argsSchema.safeParse(invalidArgs);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues[0];
      expect(error?.message).toBe('invalid hostFilter regex');
    }
  });
});
