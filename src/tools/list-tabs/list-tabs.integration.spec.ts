import test from 'node:test';
import assert from 'node:assert/strict';
import { handler as listTabsHandler } from './index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolExtra } from '../types.js';

// Minimal ToolExtra stub
const extraStub = { signal: new AbortController().signal } as unknown as ToolExtra;

interface ListTabsArgs {
  pattern?: string;
  groupBy?: 'none' | 'window' | 'host' | 'mode';
  windowId?: number | number[];
  mode?: 'normal' | 'incognito';
  loading?: boolean;
  hostFilter?: string;
  orderBy?: 'title' | 'url' | 'host' | 'windowId' | 'tabId' | 'loading' | 'mode';
}

async function runTool(args: ListTabsArgs): Promise<CallToolResult> {
  const normalizedArgs: Required<Pick<ListTabsArgs,'groupBy'>> & Omit<ListTabsArgs,'groupBy'> = { groupBy: 'none', ...args };
  const result = await listTabsHandler(normalizedArgs as {
    groupBy: 'none' | 'window' | 'host' | 'mode';
    pattern?: string; windowId?: number | number[]; mode?: 'normal' | 'incognito'; loading?: boolean; hostFilter?: string; orderBy?: 'title' | 'url' | 'host' | 'windowId' | 'tabId' | 'loading' | 'mode';
  }, extraStub);
  if (result.isError === true) {
    const first = Array.isArray(result.content) ? result.content[0] : undefined;
    const rawMessage = first && first.type === 'text' ? first.text : 'Unknown tool error';
    assert.fail(rawMessage);
  }
  return result;
}

void test('[int] list_tabs basic invocation returns text output', { timeout: 60_000 }, async () => {
  const res = await runTool({});
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem, 'text item present');
  const body: string = textItem?.text ?? '';
  assert.ok(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found '), 'contains summary line');
});

void test('[int] list_tabs grouping by host (orderBy=title) produces bullet list', { timeout: 30_000 }, async () => {
  const res = await runTool({ groupBy: 'host', orderBy: 'title' });
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem, 'text item present');
  const body: string = textItem?.text ?? '';
  assert.ok(/Found \d+ tab|No tabs found/i.test(body) || body.startsWith('Found '));
  assert.ok(/• /.test(body), 'contains at least one bullet line');
});

void test('[int] list_tabs grouping by mode loads windows metadata', { timeout: 30_000 }, async () => {
  const res = await runTool({ groupBy: 'mode' });
  const textItem = res.content.find((c): c is { type: 'text'; text: string } => c.type === 'text');
  assert.ok(textItem, 'text item present');
  const body: string = textItem?.text ?? '';
  // Mode grouping headings look like "## Normal mode" etc OR summary mentioning groups
  const hasModeHeading = /## .* mode/i.test(body);
  const hasSummary = /Grouped by: mode/.test(body);
  assert.ok(hasModeHeading || hasSummary, 'contains mode grouping indications');
});

void test('[int] list_tabs invalid regex pattern returns error', async () => {
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

void test('[int] list_tabs invalid hostFilter regex returns error', async () => {
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
