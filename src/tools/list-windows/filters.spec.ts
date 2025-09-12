import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterWindows } from './filters.js';
import type { Args } from './index.js';
import type { WindowMeta } from '../../models/window-meta.js';

const sample: WindowMeta[] = [
  { windowId: 1, index: 0, mode: 'normal', bounds: [0,0,100,100], visible: true, minimized: false, zoomed: false },
  { windowId: 2, index: 1, mode: 'normal', bounds: [0,0,100,100], visible: false, minimized: true, zoomed: false },
  { windowId: 3, index: 2, mode: 'incognito', bounds: [0,0,100,100], visible: true, minimized: false, zoomed: true },
];

void test('[list-windows] filterWindows no criteria returns all', () => {
  const out = filterWindows(sample, {} as Partial<Args> as Args);
  assert.equal(out.length, 3);
});

void test('[list-windows] filterWindows windowId single', () => {
  const out = filterWindows(sample, { windowId: 2 } as Partial<Args> as Args);
  assert.deepEqual(out.map(w => w.windowId), [2]);
});

void test('[list-windows] filterWindows windowId array', () => {
  const out = filterWindows(sample, { windowId: [1,3] } as Partial<Args> as Args);
  assert.deepEqual(out.map(w => w.windowId).sort((a,b)=>a-b), [1,3]);
});

void test('[list-windows] filterWindows mode', () => {
  const out = filterWindows(sample, { mode: 'incognito' } as Partial<Args> as Args);
  assert.deepEqual(out.map(w => w.windowId), [3]);
});
