import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatWindowLine, formatList } from './formatters.js';
import type { WindowMeta } from '../../models/window-meta.js';

const row: WindowMeta = { windowId: 1, index: 0, mode: 'normal', bounds: [10,20,800,600], visible: true, minimized: false, zoomed: true };

void test('[list-windows] formatList singular/plural header via list', () => {
  const single = formatList([{ windowId: 1, index: 0, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false }]);
  assert.match(single, /^Found 1 window/);
  const plural = formatList([
    { windowId: 1, index: 0, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
    { windowId: 2, index: 1, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
  ]);
  assert.match(plural, /^Found 2 windows/);
});

void test('[list-windows] formatWindowLine contains fields', () => {
  const line = formatWindowLine(row);
  assert.match(line, /windowId=1/);
  assert.match(line, /mode=normal/);
  assert.match(line, /bounds=\{10, 20, 800, 600\}/);
  assert.match(line, /state=visible zoomed/);
});

void test('[list-windows] formatList empty', () => {
  const out = formatList([]);
  assert.match(out, /No windows found/);
});

void test('[list-windows] formatList non-empty includes header and bullet', () => {
  const out = formatList([row]);
  assert.match(out, /Found 1 window/);
  assert.match(out, /• \[windowId=1]/);
});
