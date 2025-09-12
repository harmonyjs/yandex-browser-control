/**
 * @fileoverview Unit tests for list-tabs formatters module.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatOutput } from './formatters.js';
import type { TabWithHost } from './types.js';

function tab(p: Partial<TabWithHost>): TabWithHost {
  return {
    windowId: 1,
    tabId: 1,
    title: 'Title',
    url: 'https://example.com',
    loading: false,
    host: 'example.com',
    ...p,
  };
}

void test('formatOutput empty groups message', () => {
  const out = formatOutput([], 'none');
  assert.match(out, /No tabs found/);
});

void test('formatOutput single group none does not show group headers', () => {
  const groups: Array<[string, TabWithHost[]]> = [['all', [tab({ title: 'A', url: 'https://a', tabId: 2 })]]];
  const out = formatOutput(groups, 'none');
  assert.match(out, /Found 1 tab/);
  assert.ok(!out.includes('##'));
});

void test('formatOutput host grouping includes group headers and counts', () => {
  const groups: Array<[string, TabWithHost[]]> = [
    ['a.com', [tab({ title: 'A', url: 'https://a.com', host: 'a.com', tabId: 1 })]],
    ['b.com', [tab({ title: 'B', url: 'https://b.com', host: 'b.com', tabId: 2 }), tab({ title: 'C', url: 'https://b.com/c', host: 'b.com', tabId: 3, loading: true })]],
  ];
  const out = formatOutput(groups, 'host');
  assert.match(out, /Found 3 tabs/);
  assert.match(out, /Grouped by: host \(2 groups\)/);
  assert.match(out, /## a.com \(1 tab\)/);
  assert.match(out, /## b.com \(2 tabs\)/);
  assert.match(out, /\[Loading\]/); // Loading indicator present
});

void test('formatOutput mode grouping capitalizes and adds "mode" suffix', () => {
  const groups: Array<[string, TabWithHost[]]> = [
    ['normal', [tab({ title: 'N', tabId: 10 })]],
    ['incognito', [tab({ title: 'I', tabId: 11 })]],
  ];
  const out = formatOutput(groups, 'mode');
  assert.match(out, /## Normal mode/);
  assert.match(out, /## Incognito mode/);
});
