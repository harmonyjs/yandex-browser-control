import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortWindows } from './sorting.js';
import type { WindowMeta } from '../../models/window-meta.js';

const sample: WindowMeta[] = [
  { windowId: 5, index: 2, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
  { windowId: 2, index: 0, mode: 'incognito', bounds: [0,0,0,0], visible: false, minimized: true, zoomed: false },
  { windowId: 3, index: 1, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: true },
];

void test('[list-windows] sortWindows by windowId', () => {
  const out = sortWindows(sample, 'windowId');
  assert.deepEqual(out.map(w => w.windowId), [2,3,5]);
});

void test('[list-windows] sortWindows by index', () => {
  const out = sortWindows(sample, 'index');
  assert.deepEqual(out.map(w => w.index), [0,1,2]);
});

void test('[list-windows] sortWindows by mode normal<incognito (tie by windowId asc)', () => {
  const out = sortWindows(sample, 'mode');
  // normal first (windowId 3,5) sorted by windowId fallback, then incognito (2)
  assert.deepEqual(out.map(w => w.windowId), [3,5,2]);
});

void test('[list-windows] sortWindows by minimized false before true (windowId fallback)', () => {
  const out = sortWindows(sample, 'minimized');
  // windows 5 & 3 (false) ordered by windowId asc, then 2 (true)
  assert.deepEqual(out.map(w => w.windowId), [3,5,2]);
});
