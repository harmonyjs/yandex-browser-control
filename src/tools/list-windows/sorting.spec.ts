import { describe, it, expect } from 'vitest';
import { sortWindows } from './sorting.js';
import type { WindowMeta } from '../../models/window-meta.js';

const sample: WindowMeta[] = [
  { windowId: 5, index: 2, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: false },
  { windowId: 2, index: 0, mode: 'incognito', bounds: [0,0,0,0], visible: false, minimized: true, zoomed: false },
  { windowId: 3, index: 1, mode: 'normal', bounds: [0,0,0,0], visible: true, minimized: false, zoomed: true },
];

describe('list-windows sorting', () => {
  it('sortWindows by windowId', () => {
    const out = sortWindows(sample, 'windowId');
    expect(out.map(w => w.windowId)).toEqual([2,3,5]);
  });

  it('sortWindows by index', () => {
    const out = sortWindows(sample, 'index');
    expect(out.map(w => w.index)).toEqual([0,1,2]);
  });

  it('sortWindows by mode normal<incognito (tie by windowId asc)', () => {
    const out = sortWindows(sample, 'mode');
    expect(out.map(w => w.windowId)).toEqual([3,5,2]);
  });

  it('sortWindows by minimized false before true (windowId fallback)', () => {
    const out = sortWindows(sample, 'minimized');
    expect(out.map(w => w.windowId)).toEqual([3,5,2]);
  });
});
