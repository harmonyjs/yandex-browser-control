/**
 * @fileoverview Unit tests for list-tabs filters module.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
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

void test('[list-tabs] applyFilters with no options returns original list', () => {
  const result = applyFilters(sampleTabs, {});
  assert.equal(result.length, sampleTabs.length);
});

void test('[list-tabs] filter by single windowId', () => {
  const result = applyFilters(sampleTabs, { windowId: 2 });
  assert.deepEqual(result.map(t => t.tabId), [3]);
});

void test('[list-tabs] filter by multiple windowIds', () => {
  const result = applyFilters(sampleTabs, { windowId: [1, 3] });
  assert.deepEqual(result.map(t => t.tabId).sort((a,b)=>a-b), [1,2,4]);
});

void test('[list-tabs] filter by loading true', () => {
  const result = applyFilters(sampleTabs, { loading: true });
  assert.deepEqual(result.map(t => t.tabId), [2]);
});

void test('[list-tabs] filter by loading false', () => {
  const result = applyFilters(sampleTabs, { loading: false });
  assert.deepEqual(result.map(t => t.tabId).sort((a,b)=>a-b), [1,3,4]);
});

void test('[list-tabs] filter by pattern matches title or url (case-insensitive)', () => {
  const result = applyFilters(sampleTabs, { pattern: 'docs' });
  assert.deepEqual(result.map(t => t.tabId), [2]);
  const resultTitle = applyFilters(sampleTabs, { pattern: 'search engine' });
  assert.deepEqual(resultTitle.map(t => t.tabId), [3]);
});

void test('[list-tabs] filter by hostFilter matches host', () => {
  const result = applyFilters(sampleTabs, { hostFilter: 'search' });
  assert.deepEqual(result.map(t => t.tabId), [3]);
});

void test('[list-tabs] pattern empty string ignored', () => {
  const result = applyFilters(sampleTabs, { pattern: '' });
  assert.equal(result.length, sampleTabs.length);
});

void test('[list-tabs] hostFilter empty string ignored', () => {
  const result = applyFilters(sampleTabs, { hostFilter: '' });
  assert.equal(result.length, sampleTabs.length);
});

void test('[list-tabs] invalid regex pattern silently ignored', () => {
  const result = applyFilters(sampleTabs, { pattern: '(' });
  assert.equal(result.length, sampleTabs.length);
});

void test('[list-tabs] mode filter applies only when windowModeMap provided', () => {
  const windowMap = new Map<number, WindowMeta>([
    [1, { windowId:1, index:0, mode:'normal', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
    [2, { windowId:2, index:1, mode:'incognito', bounds:[0,0,0,0], visible:true, minimized:false, zoomed:false }],
  ]);
  const resultNormal = applyFilters(sampleTabs, { mode: 'normal' }, windowMap);
  assert.equal(resultNormal.every(t => t.windowId === 1), true);
  const resultIncognito = applyFilters(sampleTabs, { mode: 'incognito' }, windowMap);
  assert.deepEqual(resultIncognito.map(t => t.windowId), [2]);
});

void test('[list-tabs] mode filter ignored when map missing', () => {
  const result = applyFilters(sampleTabs, { mode: 'normal' });
  assert.equal(result.length, sampleTabs.length);
});

void test('[list-tabs] combined filters applied sequentially', () => {
  const opts: FilterOptions = { windowId: [1,2], loading: false, hostFilter: 'example', pattern: 'home' };
  const result = applyFilters(sampleTabs, opts);
  // Start with windowId [1,2] -> tabs 1,2,3
  // loading false -> 1,3
  // hostFilter example -> 1
  // pattern home -> 1
  assert.deepEqual(result.map(t => t.tabId), [1]);
});

void test('[list-tabs] needsWindowData only true when mode specified', () => {
  assert.equal(needsWindowData({}), false);
  assert.equal(needsWindowData({ windowId: 1 }), false);
  assert.equal(needsWindowData({ mode: 'normal' }), true);
});
