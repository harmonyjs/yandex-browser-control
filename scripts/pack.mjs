#!/usr/bin/env node
/**
 * Production pack script (isolated).
 *
 * Flow:
 * 1) Build in-place (uses current dev env): `npm run build`.
 * 2) Create isolated temp dir `.pack-tmp` and copy minimal set: manifest.json, package.json, package-lock.json (if any), and dist/.
 * 3) Inside `.pack-tmp`, install prod-only deps: `npm ci --omit=dev` (or `npm i --omit=dev` if no lockfile).
 * 4) Run `npx @anthropic-ai/dxt pack . <output .dxt>` from the temp dir, where output is auto-named as `<name>-<version>.dxt`.
 * 5) Cleanup `.pack-tmp`.
 *
 * Requires:
 * - npx available; uses `npx -y @anthropic-ai/dxt pack`.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(process.cwd());
const artifactsDir = join(root, 'artifacts', 'dxt');
const tmpDir = join(root, '.pack-tmp');

const SCOPE = 'pack';

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

function run(cmd, args, options = {}) {
  const startedAt = Date.now();
  log({ level: 'info', event: 'cmd.start', msg: `${cmd} ${args.join(' ')}`, extra: { cwd: options.cwd || root } });
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...options });
  if (res.status !== 0) {
    const durationMs = Date.now() - startedAt;
    log({ level: 'error', event: 'cmd.fail', msg: `Command failed: ${cmd} ${args.join(' ')}`, extra: { code: res.status, durationMs } });
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
  const durationMs = Date.now() - startedAt;
  log({ level: 'info', event: 'cmd.ok', msg: `Command finished: ${cmd}`, extra: { durationMs } });
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function sanitizeName(name) {
  // Replace any character not [a-z0-9-.] with '-'; fold spaces and special chars
  return String(name)
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
}

function readJSONSafe(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveOutputFile(cwd) {
  // Prefer manifest.json for DXT metadata, fallback to package.json
  const manifest = readJSONSafe(join(cwd, 'manifest.json'));
  const pkg = readJSONSafe(join(cwd, 'package.json'));
  const rawName = (manifest && (manifest.name || manifest.id)) || (pkg && pkg.name);
  const version = (manifest && manifest.version) || (pkg && pkg.version);
  if (!rawName || !version) {
    throw new Error('Cannot determine extension name/version from manifest.json or package.json');
  }
  const name = sanitizeName(rawName);
  const filename = `${name}-${version}.dxt`;
  return { filename, outputFile: join(artifactsDir, filename), name, version };
}

function packageWithDXT(cwd) {
  // Use npx to avoid requiring global install and write output directly to artifacts dir.
  // Clean artifacts dir before packing to avoid stale files.
  log({ level: 'info', event: 'artifacts.clean', msg: 'Cleaning artifacts directory', extra: { artifactsDir } });
  if (existsSync(artifactsDir)) {
    rmSync(artifactsDir, { recursive: true, force: true });
  }
  ensureDir(artifactsDir);
  // DXT CLI usage: dxt pack <directory> [outputFile]
  // We pack from the temp directory (cwd) and emit into artifactsDir as a single .dxt file.
  const { outputFile, filename, name, version } = resolveOutputFile(cwd);
  log({ level: 'info', event: 'pack.start', msg: 'Running dxt pack', extra: { cwd, source: '.', outputFile, name, version } });
  run('npx', ['-y', '@anthropic-ai/dxt', 'pack', '.', outputFile], { cwd });
  log({ level: 'info', event: 'pack.done', msg: 'DXT package created', extra: { outputFile, filename } });
}

function main() {
  log({ level: 'info', event: 'build.start', msg: 'Starting production build' });
  // 1) Build (assumes TypeScript build outputs to dist/)
  run('npm', ['run', 'build'], { cwd: root });
  log({ level: 'info', event: 'build.done', msg: 'Build completed' });

  // 2) Prepare isolated temp directory with minimal content
  log({ level: 'info', event: 'tmp.prepare', msg: 'Preparing isolated temp directory', extra: { tmpDir } });
  if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  ensureDir(tmpDir);

  // Copy manifest and package files
  log({ level: 'info', event: 'tmp.copy.manifest', msg: 'Copy manifest.json' });
  cpSync(join(root, 'manifest.json'), join(tmpDir, 'manifest.json'));
  log({ level: 'info', event: 'tmp.copy.package', msg: 'Copy package.json and lockfile if present' });
  cpSync(join(root, 'package.json'), join(tmpDir, 'package.json'));
  if (existsSync(join(root, 'package-lock.json'))) {
    cpSync(join(root, 'package-lock.json'), join(tmpDir, 'package-lock.json'));
  }
  // Copy npm config if present to ensure correct registry/auth inside temp dir
  if (existsSync(join(root, '.npmrc'))) {
    log({ level: 'info', event: 'tmp.copy.npmrc', msg: 'Copy .npmrc' });
    cpSync(join(root, '.npmrc'), join(tmpDir, '.npmrc'));
  } else {
    log({ level: 'debug', event: 'tmp.copy.npmrc.skip', msg: 'No .npmrc found in project root' });
  }
  // Copy built files
  log({ level: 'info', event: 'tmp.copy.dist', msg: 'Copy dist/ directory' });
  ensureDir(join(tmpDir, 'dist'));
  cpSync(join(root, 'dist'), join(tmpDir, 'dist'), { recursive: true });

  // 3) Install prod-only deps inside the temp dir
  log({ level: 'info', event: 'deps.install', msg: 'Installing production-only dependencies (scripts ignored)' });
  if (existsSync(join(tmpDir, 'package-lock.json'))) {
    // --ignore-scripts avoids running lifecycle hooks like prepare that may expect source files (e.g., tsconfig.json)
    run('npm', ['ci', '--omit=dev', '--ignore-scripts'], { cwd: tmpDir });
  } else {
    // Fall back if no lockfile exists
    run('npm', ['i', '--omit=dev', '--no-package-lock', '--ignore-scripts'], { cwd: tmpDir });
  }

  // 4) Pack directly to artifacts directory
  packageWithDXT(tmpDir);

  // 5) Cleanup temp
  log({ level: 'info', event: 'tmp.cleanup', msg: 'Removing temp directory', extra: { tmpDir } });
  rmSync(tmpDir, { recursive: true, force: true });
  log({ level: 'info', event: 'done', msg: 'Pack script completed successfully' });
}

try {
  main();
} catch (err) {
  const error = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
  log({ level: 'error', event: 'fatal', msg: 'Pack script failed', extra: error });
  process.exit(1);
}
