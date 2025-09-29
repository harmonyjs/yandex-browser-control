/**
 * @fileoverview Unit tests for list-tabs grouping module.
 */
import { describe, it, expect } from 'vitest';
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

describe('list-tabs grouping', () => {
  it('groupTabs by none collapses into single group', () => {
    const groups = groupTabs(tabs, 'none');
    expect(groups.size).toBe(1);
    expect(groups.get('all')?.length).toBe(tabs.length);
  });

  it('groupTabs by window', () => {
    const groups = groupTabs(tabs, 'window');
    expect(Array.from(groups.keys()).sort()).toEqual(['1','2','3']);
    expect(groups.get('2')?.length).toBe(2);
  });

  it('groupTabs by host uses semantic placeholder for invalid URL', () => {
    const groups = groupTabs(tabs, 'host');
    expect(groups.has('(invalid)')).toBe(true);
    const invalidGroup = groups.get('(invalid)');
    expect(invalidGroup?.length).toBe(1);
    expect(invalidGroup?.[0].tabId).toBe(4);
  });

  it('groupTabs by mode uses window map (missing => unknown)', () => {
    const windowMap = new Map<number, WindowMeta>([
      [1, { windowId:1, index:0, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
      [2, { windowId:2, index:1, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    ]);
    const groups = groupTabs(tabs, 'mode', windowMap);
    const keys = Array.from(groups.keys()).sort();
    expect(keys.sort()).toEqual(['incognito','normal','unknown'].sort());
    expect(groups.get('unknown')?.[0].tabId).toBe(4);
  });

  it('sortGroups for window orders numerically and sorts tabs via orderBy', () => {
    const groups = groupTabs(tabs, 'window');
    const sorted = sortGroups(groups, 'window', 'title');
    expect(sorted.map(([k]) => k)).toEqual(['1','2','3']);
    const win2 = sorted.find(([k]) => k === '2')?.[1];
    expect(win2?.map(t => t.title)).toEqual(['Beta','Zeta']);
  });

  it('sortGroups for mode respects normal < incognito ordering', () => {
    const windowMap = new Map<number, WindowMeta>([
      [1, { windowId:1, index:0, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
      [2, { windowId:2, index:1, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    ]);
    const groups = groupTabs(tabs, 'mode', windowMap);
    const ordered = sortGroups(groups, 'mode');
    expect(ordered.map(([k]) => k)).toEqual(['normal','incognito','unknown']);
  });

  it('sortGroups for host sorts case-insensitively', () => {
    const mixed: TabWithHost[] = [
      t({ host: 'B.com', url: 'https://B.com', title: 'B', tabId: 10 }),
      t({ host: 'a.com', url: 'https://a.com', title: 'A', tabId: 11 }),
    ];
    const groups = groupTabs(mixed, 'host');
    const ordered = sortGroups(groups, 'host');
    expect(ordered.map(([k]) => k.toLowerCase())).toEqual(['a.com','b.com']);
  });
});
