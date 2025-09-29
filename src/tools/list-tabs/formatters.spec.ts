/**
 * @fileoverview Unit tests for list-tabs formatters module.
 */
import { describe, it, expect } from 'vitest';
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

describe('list-tabs formatters', () => {
  it('formatOutput empty groups message', () => {
    const out = formatOutput([], 'none');
    expect(out).toMatch(/No tabs found/);
  });

  it('formatOutput single group none does not show group headers', () => {
    const groups: Array<[string, TabWithHost[]]> = [['all', [tab({ title: 'A', url: 'https://a', tabId: 2 })]]];
    const out = formatOutput(groups, 'none');
    expect(out).toMatch(/Found 1 tab/);
    expect(out.includes('##')).toBe(false);
  });

  it('formatOutput host grouping includes group headers and counts', () => {
    const groups: Array<[string, TabWithHost[]]> = [
      ['a.com', [tab({ title: 'A', url: 'https://a.com', host: 'a.com', tabId: 1 })]],
      ['b.com', [tab({ title: 'B', url: 'https://b.com', host: 'b.com', tabId: 2 }), tab({ title: 'C', url: 'https://b.com/c', host: 'b.com', tabId: 3, loading: true })]],
    ];
    const out = formatOutput(groups, 'host');
    expect(out).toMatch(/Found 3 tabs/);
    expect(out).toMatch(/Grouped by: host \(2 groups\)/);
    expect(out).toMatch(/## a.com \(1 tab\)/);
    expect(out).toMatch(/## b.com \(2 tabs\)/);
    expect(out).toMatch(/\[Loading\]/);
  });

  it('formatOutput mode grouping capitalizes and adds "mode" suffix', () => {
    const groups: Array<[string, TabWithHost[]]> = [
      ['normal', [tab({ title: 'N', tabId: 10 })]],
      ['incognito', [tab({ title: 'I', tabId: 11 })]],
    ];
    const out = formatOutput(groups, 'mode');
    expect(out).toMatch(/## Normal mode/);
    expect(out).toMatch(/## Incognito mode/);
  });
});
