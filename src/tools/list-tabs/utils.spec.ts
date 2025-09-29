/**
 * @fileoverview Unit tests for list-tabs utils.
 */
import { describe, it, expect } from 'vitest';
import { compare, safeHost, compileOptionalRegex } from './utils.js';

describe('list-tabs utils', () => {
  it('compare.stringCI case-insensitive equality and ordering', () => {
    expect(compare.stringCI('Apple', 'apple')).toBe(0);
    expect(compare.stringCI('a', 'b')).toBeLessThan(0);
  });

  it('compare.number numeric ordering', () => {
    expect(compare.number(1, 1)).toBe(0);
    expect(compare.number(1, 2)).toBeLessThan(0);
    expect(compare.number(3, 2)).toBeGreaterThan(0);
  });

  it('compare.boolean false before true', () => {
    expect(compare.boolean(false, false)).toBe(0);
    expect(compare.boolean(false, true)).toBeLessThan(0);
    expect(compare.boolean(true, false)).toBeGreaterThan(0);
  });

  it('safeHost extracts host from valid URL', () => {
    expect(safeHost('https://Example.COM/path')).toBe('example.com');
  });

  it('safeHost returns semantic placeholders for invalid / special URLs', () => {
    expect(safeHost('not a url')).toBe('(invalid)');
    expect(safeHost('')).toBe('(invalid)');
    expect(safeHost('   ')).toBe('(invalid)');
    expect(safeHost('file:///Users/test/readme.txt')).toBe('(file)');
    expect(safeHost('about:blank')).toBe('(about)');
    expect(safeHost('chrome://extensions/')).toBe('(internal)');
  });

  it('compileOptionalRegex returns undefined for empty or invalid input', () => {
    expect(compileOptionalRegex(undefined)).toBeUndefined();
    expect(compileOptionalRegex('')).toBeUndefined();
    expect(compileOptionalRegex('(')).toBeUndefined();
  });

  it('compileOptionalRegex compiles valid pattern (case-insensitive)', () => {
    const r = compileOptionalRegex('abc');
    expect(r instanceof RegExp).toBe(true);
    if (r instanceof RegExp) {
      expect(r.test('ABC')).toBe(true);
    }
  });
});
