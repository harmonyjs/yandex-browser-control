import { describe, it, expect } from 'vitest';
import { formatWindowLine, formatList } from './formatters.js';
import type { WindowMeta } from '../../models/window-meta.js';

const row: WindowMeta = { windowId: 1, index: 0, mode: 'normal', bounds: [10,20,800,600], visible: true, minimized: false, zoomed: true };

describe('list-windows formatters', () => {
  it('formatList singular/plural header via list', () => {
    const single = formatList([{ windowId: 1, index: 0, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false }]);
    expect(single).toMatch(/^Found 1 window/);
    const plural = formatList([
      { windowId: 1, index: 0, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
      { windowId: 2, index: 1, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
    ]);
    expect(plural).toMatch(/^Found 2 windows/);
  });

  it('formatWindowLine contains fields', () => {
    const line = formatWindowLine(row);
    expect(line).toMatch(/windowId=1/);
    expect(line).toMatch(/mode=normal/);
    expect(line).toMatch(/bounds=\{10, 20, 800, 600\}/);
    expect(line).toMatch(/state=visible zoomed/);
  });

  it('formatList empty', () => {
    const out = formatList([]);
    expect(out).toMatch(/No windows found/);
  });

  it('formatList non-empty includes header and bullet', () => {
    const out = formatList([row]);
    expect(out).toMatch(/Found 1 window/);
    expect(out).toMatch(/• \[windowId=1]/);
  });
});
