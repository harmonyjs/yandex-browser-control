/**
 * @fileoverview Unit tests for list-tabs filters module.
 */
import { describe, it, expect } from 'vitest';
import { applyFilters, needsWindowData, type FilterOptions } from './filters.js';
import type { TabWithHost } from './types.js';
import type { WindowMeta } from '../../models/window-meta.js';

function tab(partial: Partial<TabWithHost>): TabWithHost {
  return {
    windowId: 1,
    tabId: 1,
    title: 'Title',
    url: 'https://example.com',
    loading: false,
    host: 'example.com',
    ...partial,
  };
}

const sampleTabs: TabWithHost[] = [
  tab({ tabId: 1, windowId: 1, title: 'Home', url: 'https://example.com', host: 'example.com', loading: false }),
  tab({ tabId: 2, windowId: 1, title: 'Docs', url: 'https://example.com/docs', host: 'example.com', loading: true }),
  tab({ tabId: 3, windowId: 2, title: 'Search Engine', url: 'https://search.test?q=abc', host: 'search.test', loading: false }),
  tab({ tabId: 4, windowId: 3, title: 'Local File', url: 'file:///Users/test/readme.txt', host: '' }),
];

describe('list-tabs filters', () => {
  it('applyFilters with no options returns original list', () => {
    const result = applyFilters(sampleTabs, {});
    expect(result.length).toBe(sampleTabs.length);
  });

  it('filter by single windowId', () => {
    const result = applyFilters(sampleTabs, { windowId: 2 });
    expect(result.map(t => t.tabId)).toEqual([3]);
  });

  it('filter by multiple windowIds', () => {
    const result = applyFilters(sampleTabs, { windowId: [1, 3] });
    expect(result.map(t => t.tabId).sort((a,b)=>a-b)).toEqual([1,2,4]);
  });

  it('filter by loading true', () => {
    const result = applyFilters(sampleTabs, { loading: true });
    expect(result.map(t => t.tabId)).toEqual([2]);
  });

  it('filter by loading false', () => {
    const result = applyFilters(sampleTabs, { loading: false });
    expect(result.map(t => t.tabId).sort((a,b)=>a-b)).toEqual([1,3,4]);
  });

  it('filter by pattern matches title or url (case-insensitive)', () => {
    const result = applyFilters(sampleTabs, { pattern: 'docs' });
    expect(result.map(t => t.tabId)).toEqual([2]);
    const resultTitle = applyFilters(sampleTabs, { pattern: 'search engine' });
    expect(resultTitle.map(t => t.tabId)).toEqual([3]);
  });

  it('filter by hostFilter matches host', () => {
    const result = applyFilters(sampleTabs, { hostFilter: 'search' });
    expect(result.map(t => t.tabId)).toEqual([3]);
  });

  it('pattern empty string ignored', () => {
    const result = applyFilters(sampleTabs, { pattern: '' });
    expect(result.length).toBe(sampleTabs.length);
  });

  it('hostFilter empty string ignored', () => {
    const result = applyFilters(sampleTabs, { hostFilter: '' });
    expect(result.length).toBe(sampleTabs.length);
  });

  it('invalid regex pattern silently ignored', () => {
    const result = applyFilters(sampleTabs, { pattern: '(' });
    expect(result.length).toBe(sampleTabs.length);
  });

  it('mode filter applies only when windowModeMap provided', () => {
    const windowMap = new Map<number, WindowMeta>([
      [1, { windowId:1, index:0, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
      [2, { windowId:2, index:1, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    ]);
    const resultNormal = applyFilters(sampleTabs, { mode: 'normal' }, windowMap);
    expect(resultNormal.every(t => t.windowId === 1)).toBe(true);
    const resultIncognito = applyFilters(sampleTabs, { mode: 'incognito' }, windowMap);
    expect(resultIncognito.map(t => t.windowId)).toEqual([2]);
  });

  it('mode filter ignored when map missing', () => {
    const result = applyFilters(sampleTabs, { mode: 'normal' });
    expect(result.length).toBe(sampleTabs.length);
  });

  it('combined filters applied sequentially', () => {
    const opts: FilterOptions = { windowId: [1,2], loading: false, hostFilter: 'example', pattern: 'home' };
    const result = applyFilters(sampleTabs, opts);
    expect(result.map(t => t.tabId)).toEqual([1]);
  });

  it('needsWindowData only true when mode specified', () => {
    expect(needsWindowData({})).toBe(false);
    expect(needsWindowData({ windowId: 1 })).toBe(false);
    expect(needsWindowData({ mode: 'normal' })).toBe(true);
  });
});
