#!/usr/bin/env node
/**
 * version-up.mjs
 *
 * Bumps minor version in both package.json and manifest.json.
 * - Uses Node APIs, no git tag/commit.
 *
 * Behavior:
 * - Reads semver from package.json.version and manifest.json.version
 * - Supports bump types: patch (default), minor, major
 * - Writes back files with preserved JSON formatting (2 spaces)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const SCOPE = 'version-up';

function timeHHMMSS() {
  return new Date().toISOString().slice(11, 19);
}

function kv(extra) {
  if (!extra) return '';
  const parts = Object.entries(extra).map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

function log({ level, event, msg, extra }) {
  const emoji = level === 'error' ? '✖' : level === 'warn' ? '⚠' : level === 'debug' ? '🐛' : 'ℹ';
  const line = `[${timeHHMMSS()}] [${SCOPE}] ${emoji} ${event} — ${msg}${kv(extra)}`;
  // Allow console in tooling scripts (ESLint no-console only enforced for src/**)
  console.log(line);
}

function parseSemver(v) {
  const m = /^\s*(\d+)\.(\d+)\.(\d+)\s*$/.exec(v);
  if (!m) throw new Error(`Invalid semver: ${v}`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

function bump(v, kind = 'patch') {
  const s = parseSemver(v);
  if (kind === 'major') return `${s.major + 1}.0.0`;
  if (kind === 'minor') return `${s.major}.${s.minor + 1}.0`;
  return `${s.major}.${s.minor}.${s.patch + 1}`; // patch
}

function updateJson(filePath, fieldPath, updater) {
  const p = resolve(process.cwd(), filePath);
  const raw = readFileSync(p, 'utf8');
  const json = JSON.parse(raw);

  // Support only top-level field for simplicity (version)
  const current = json[fieldPath];
  const next = updater(current);
  json[fieldPath] = next;

  writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return { previous: current, next };
}

function main() {
  const kind = process.argv[2] || 'patch'; // patch | minor | major
  const allowed = new Set(['patch', 'minor', 'major']);
  if (!allowed.has(kind)) throw new Error(`Unknown bump kind: ${kind}`);

  log({ level: 'info', event: 'start', msg: 'Starting version bump', extra: { kind } });

  const pkgRes = updateJson('package.json', 'version', (v) => bump(v, kind));
  const manRes = updateJson('manifest.json', 'version', (v) => bump(v, kind));
  log({ level: 'info', event: 'bumped', msg: 'Version updated', extra: {
    package: { from: pkgRes.previous, to: pkgRes.next },
    manifest: { from: manRes.previous, to: manRes.next }
  }});
  log({ level: 'info', event: 'done', msg: 'Version bump completed' });
}

try {
  main();
} catch (err) {
  const error = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
  log({ level: 'error', event: 'fatal', msg: 'Version bump failed', extra: error });
  process.exit(1);
}
