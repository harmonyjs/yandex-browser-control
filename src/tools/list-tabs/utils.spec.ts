/**
 * @fileoverview Unit tests for list-tabs utils.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare, safeHost, compileOptionalRegex } from './utils.js';

void test('compare.stringCI case-insensitive equality and ordering', () => {
  assert.equal(compare.stringCI('Apple', 'apple'), 0);
  assert.ok(compare.stringCI('a', 'b') < 0);
});

void test('compare.number numeric ordering', () => {
  assert.equal(compare.number(1, 1), 0);
  assert.ok(compare.number(1, 2) < 0);
  assert.ok(compare.number(3, 2) > 0);
});

void test('compare.boolean false before true', () => {
  assert.equal(compare.boolean(false, false), 0);
  assert.ok(compare.boolean(false, true) < 0);
  assert.ok(compare.boolean(true, false) > 0);
});

void test('safeHost extracts host from valid URL', () => {
  assert.equal(safeHost('https://Example.COM/path'), 'example.com');
});

void test('safeHost returns semantic placeholders for invalid / special URLs', () => {
  assert.equal(safeHost('not a url'), '(invalid)');
  assert.equal(safeHost(''), '(invalid)');
  assert.equal(safeHost('   '), '(invalid)');
  assert.equal(safeHost('file:///Users/test/readme.txt'), '(file)');
  assert.equal(safeHost('about:blank'), '(about)');
  assert.equal(safeHost('chrome://extensions/'), '(internal)');
});

void test('compileOptionalRegex returns undefined for empty or invalid input', () => {
  assert.equal(compileOptionalRegex(undefined), undefined);
  assert.equal(compileOptionalRegex(''), undefined);
  assert.equal(compileOptionalRegex('('), undefined);
});

void test('compileOptionalRegex compiles valid pattern (case-insensitive)', () => {
  const r = compileOptionalRegex('abc');
  assert.ok(r instanceof RegExp);
  if (r instanceof RegExp) {
    assert.ok(r.test('ABC'));
  }
});
