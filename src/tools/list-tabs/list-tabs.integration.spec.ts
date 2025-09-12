import test from 'node:test';
import assert from 'node:assert/strict';
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

void test('[int] [list-tabs] list_tabs basic invocation returns text output', { timeout: 60_000 }, async () => {
  const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'none' }));
  const body = getFirstTextBlock(res);
  assert.ok(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found '), 'contains summary line');
});

void test('[int] [list-tabs] list_tabs grouping by host (orderBy=title) produces bullet list', { timeout: 30_000 }, async () => {
  const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'host', orderBy: 'title' }));
  const body = getFirstTextBlock(res);
  assert.ok(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found '));
  assert.ok(/• /.test(body), 'contains at least one bullet line');
});

void test('[int] [list-tabs] list_tabs grouping by mode loads windows metadata', { timeout: 30_000 }, async () => {
  const res = await runToolHandler(listTabsHandler, normalize({ groupBy: 'mode' }));
  const body = getFirstTextBlock(res);
  // Mode grouping headings look like "## Normal mode" etc OR summary mentioning groups
  const hasModeHeading = /## .* mode/i.test(body);
  const hasSummary = /Grouped by: mode/.test(body);
  assert.ok(hasModeHeading || hasSummary, 'contains mode grouping indications');
});

void test('[int] [list-tabs] list_tabs invalid regex pattern returns error', async () => {
  // Since we moved validation to middleware, we need to test it differently.
  // Import the module to access argsSchema for direct validation testing.
  const { module: listTabsModule } = await import('./index.js');
  
  const invalidArgs = { pattern: '(', groupBy: 'none' };
  const result = listTabsModule.argsSchema.safeParse(invalidArgs);
  
  assert.equal(result.success, false, 'expected validation to fail');
  if (!result.success) {
    const error = result.error.issues[0];
    assert.equal(error?.message, 'invalid regex pattern');
  }
});

void test('[int] [list-tabs] list_tabs invalid hostFilter regex returns error', async () => {
  // Test hostFilter validation at schema level
  const { module: listTabsModule } = await import('./index.js');
  
  const invalidArgs = { hostFilter: '(', groupBy: 'none' };
  const result = listTabsModule.argsSchema.safeParse(invalidArgs);
  
  assert.equal(result.success, false, 'expected validation to fail');
  if (!result.success) {
    const error = result.error.issues[0];
    assert.equal(error?.message, 'invalid hostFilter regex');
  }
});
