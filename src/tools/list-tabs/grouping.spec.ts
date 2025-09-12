/**
 * @fileoverview Unit tests for list-tabs grouping module.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupTabs, sortGroups } from './grouping.js';
import type { TabWithHost } from './types.js';
import type { WindowMeta } from '../../models/window-meta.js';

function t(partial: Partial<TabWithHost>): TabWithHost {
  return {
    windowId: 1,
    tabId: 1,
    title: 'A',
    url: 'https://a.test',
    loading: false,
    host: 'a.test',
    ...partial,
  };
}

const tabs: TabWithHost[] = [
  t({ tabId: 1, windowId: 2, title: 'Zeta', url: 'https://z.com', host: 'z.com' }),
  t({ tabId: 2, windowId: 1, title: 'Alpha', url: 'https://a.com', host: 'a.com' }),
  t({ tabId: 3, windowId: 2, title: 'Beta', url: 'https://b.com', host: 'b.com', loading: true }),
  // Invalid URL now uses semantic placeholder produced by safeHost
  t({ tabId: 4, windowId: 3, title: 'Gamma', url: 'invalid', host: '(invalid)' }),
];

void test('[list-tabs] groupTabs by none collapses into single group', () => {
  const groups = groupTabs(tabs, 'none');
  assert.equal(groups.size, 1);
  assert.deepEqual(groups.get('all')?.length, tabs.length);
});

void test('[list-tabs] groupTabs by window', () => {
  const groups = groupTabs(tabs, 'window');
  assert.deepEqual(Array.from(groups.keys()).sort(), ['1','2','3']);
  assert.equal(groups.get('2')?.length, 2);
});

void test('[list-tabs] groupTabs by host uses semantic placeholder for invalid URL', () => {
  const groups = groupTabs(tabs, 'host');
  assert.ok(groups.has('(invalid)'));
  const invalidGroup = groups.get('(invalid)');
  assert.equal(invalidGroup?.length, 1);
  assert.equal(invalidGroup?.[0].tabId, 4);
});

void test('[list-tabs] groupTabs by mode uses window map (missing => unknown)', () => {
  const windowMap = new Map<number, WindowMeta>([
    [1, { windowId:1, index:0, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    [2, { windowId:2, index:1, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
  ]);
  const groups = groupTabs(tabs, 'mode', windowMap);
  // Expect normal, incognito, unknown (windowId 3 not in map)
  const keys = Array.from(groups.keys()).sort();
  assert.deepEqual(keys.sort(), ['incognito','normal','unknown'].sort());
  assert.equal(groups.get('unknown')?.[0].tabId, 4);
});

void test('[list-tabs] sortGroups for window orders numerically and sorts tabs via orderBy', () => {
  const groups = groupTabs(tabs, 'window');
  const sorted = sortGroups(groups, 'window', 'title');
  // Windows should be 1,2,3
  assert.deepEqual(sorted.map(([k]) => k), ['1','2','3']);
  // Window 2 group tabs sorted by title: Beta, Zeta
  const win2 = sorted.find(([k]) => k === '2')?.[1];
  assert.deepEqual(win2?.map(t => t.title), ['Beta','Zeta']);
});

void test('[list-tabs] sortGroups for mode respects normal < incognito ordering', () => {
  const windowMap = new Map<number, WindowMeta>([
    [1, { windowId:1, index:0, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    [2, { windowId:2, index:1, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
  ]);
  const groups = groupTabs(tabs, 'mode', windowMap);
  const ordered = sortGroups(groups, 'mode');
  // Expect normal first then incognito then unknown
  assert.deepEqual(ordered.map(([k]) => k), ['normal','incognito','unknown']);
});

void test('[list-tabs] sortGroups for host sorts case-insensitively', () => {
  const mixed: TabWithHost[] = [
    t({ host: 'B.com', url: 'https://B.com', title: 'B', tabId: 10 }),
    t({ host: 'a.com', url: 'https://a.com', title: 'A', tabId: 11 }),
  ];
  const groups = groupTabs(mixed, 'host');
  const ordered = sortGroups(groups, 'host');
  // Ordered keys, when lowercased, should be alphabetical
  assert.deepEqual(ordered.map(([k]) => k.toLowerCase()), ['a.com','b.com']);
});
