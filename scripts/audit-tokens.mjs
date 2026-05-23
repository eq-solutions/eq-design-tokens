#!/usr/bin/env node
/**
 * EQ design-tokens delta audit.
 *
 * Scans each EQ app for raw design values that should be tokens, classifies
 * them against the canonical set, and emits a per-app JSON report under
 * audit-reports/<app>.json.
 *
 * Three buckets per app:
 *   matched  - raw value matches a canonical token; safe migration target
 *   drift    - raw value is close to (but not equal to) a canonical token;
 *              flag for designer review before migrating
 *   unknown  - raw value with no canonical equivalent; either add a token
 *              or accept it as app-specific
 *
 * Usage:
 *   node scripts/audit-tokens.mjs               # audit all apps
 *   node scripts/audit-tokens.mjs eq-shell      # audit one app
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECTS_DIR = join(ROOT, '..');
const REPORT_DIR = join(ROOT, 'audit-reports');

const APPS = ['eq-cards', 'eq-shell', 'eq-solves-field', 'eq-solves-service', 'eq-intake'];

// File extensions worth scanning per app.
const SCAN_EXTENSIONS = new Set([
  '.css', '.scss', '.less',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.dart',
  '.html', '.svelte', '.vue',
]);

// Directories to skip (never want to audit generated or vendored code).
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.cache',
  'coverage', 'storybook-static', '.vercel', '.netlify', 'out',
  'ios', 'android', 'macos', 'linux', 'windows',  // Flutter native platform shells
  '.dart_tool', '.flutter-plugins-dependencies',
  'public', 'static', 'assets',                   // bundled / static
  '.claude',                                        // Claude worktrees (duplicates of source)
  '_archive',                                       // old deploy snapshots
  'tmp',                                            // build output (Next.js etc)
  'docs',                                           // review HTML, audit docs — not production source
  'supabase',                                       // migration SQL files — not CSS/design
  'scripts',                                        // ad-hoc utility scripts, not app source
]);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Load canonical tokens
// ─────────────────────────────────────────────────────────────────────────────

function loadCanonical() {
  const baseDir = join(ROOT, 'tokens', 'base');
  const canonical = { color: new Map(), spacing: new Map(), radius: new Map(), shadow: new Map(), fontSize: new Map() };

  function add(map, value, tokenName) {
    if (typeof value !== 'string') return;
    const key = value.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(tokenName);
  }

  function walk(tree, path = []) {
    for (const [k, v] of Object.entries(tree)) {
      if (v && typeof v === 'object' && 'value' in v) {
        const tokenName = [...path, k].join('.');
        const val = v.value;
        const p = [...path, k];
        if (p[0] === 'color')   add(canonical.color, val, tokenName);
        if (p[0] === 'spacing') add(canonical.spacing, val, tokenName);
        if (p[0] === 'radius')  add(canonical.radius, val, tokenName);
        if (p[0] === 'shadow')  add(canonical.shadow, val, tokenName);
        if (p[0] === 'typography' && p[1] === 'scale') add(canonical.fontSize, val, tokenName);
      } else if (v && typeof v === 'object') {
        walk(v, [...path, k]);
      }
    }
  }

  for (const file of readdirSync(baseDir)) {
    if (!file.endsWith('.json')) continue;
    walk(JSON.parse(readFileSync(join(baseDir, file), 'utf8')));
  }

  return canonical;
}

const canonical = loadCanonical();

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pattern detectors
// ─────────────────────────────────────────────────────────────────────────────

const HEX_RE     = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGBA_RE    = /rgba?\([^)]+\)/g;
const PX_RE      = /\b(\d+(?:\.\d+)?)px\b/g;
const RADIUS_HINT = /\b(?:border-radius|borderRadius|BorderRadius\.circular)/;
const SHADOW_HINT = /\b(?:box-shadow|boxShadow|BoxShadow)/;
const FONT_HINT   = /\b(?:font-size|fontSize)/;

function classifyHex(hex) {
  const normalized = hex.length === 4
    ? '#' + hex.slice(1).split('').map(c => c + c).join('')
    : hex;
  const lookup = normalized.toLowerCase();
  if (canonical.color.has(lookup)) {
    return { bucket: 'matched', token: canonical.color.get(lookup).join(' | ') };
  }
  // Drift = within Manhattan distance 16 across r/g/b channels.
  const [r, g, b] = [1, 3, 5].map(i => parseInt(lookup.slice(i, i + 2), 16));
  for (const [canonHex, names] of canonical.color) {
    if (canonHex.length !== 7) continue;
    const [cr, cg, cb] = [1, 3, 5].map(i => parseInt(canonHex.slice(i, i + 2), 16));
    const dist = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
    if (dist > 0 && dist <= 16) {
      return { bucket: 'drift', token: names.join(' | '), distance: dist, canonical: canonHex };
    }
  }
  return { bucket: 'unknown' };
}

function classifyPx(value, kind) {
  const key = `${value}px`;
  let map;
  if (kind === 'spacing') map = canonical.spacing;
  else if (kind === 'radius') map = canonical.radius;
  else if (kind === 'fontSize') map = canonical.fontSize;
  else return { bucket: 'unknown' };

  if (map.has(key)) {
    return { bucket: 'matched', token: map.get(key).join(' | ') };
  }
  return { bucket: 'unknown' };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Walk files
// ─────────────────────────────────────────────────────────────────────────────

function* walkFiles(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      yield* walkFiles(full);
    } else if (st.isFile()) {
      const dot = entry.lastIndexOf('.');
      if (dot >= 0 && SCAN_EXTENSIONS.has(entry.slice(dot))) {
        yield full;
      }
    }
  }
}

function auditApp(appName) {
  const appDir = join(PROJECTS_DIR, appName);
  if (!existsSync(appDir)) {
    return { app: appName, error: `Directory not found: ${appDir}` };
  }

  const report = {
    app: appName,
    scannedAt: new Date().toISOString(),
    summary: { filesScanned: 0, hexCount: 0, pxCount: 0 },
    buckets: { matched: [], drift: [], unknown: [] },
  };

  for (const file of walkFiles(appDir)) {
    report.summary.filesScanned++;
    let content;
    try { content = readFileSync(file, 'utf8'); } catch { continue; }
    const rel = relative(PROJECTS_DIR, file);
    const lines = content.split('\n');

    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      const line = lines[lineNo];

      for (const m of line.matchAll(HEX_RE)) {
        report.summary.hexCount++;
        const cls = classifyHex(m[0]);
        report.buckets[cls.bucket].push({
          kind: 'color',
          value: m[0],
          file: rel,
          line: lineNo + 1,
          ...cls,
        });
      }

      const inRadiusCtx = RADIUS_HINT.test(line);
      const inShadowCtx = SHADOW_HINT.test(line);
      const inFontCtx   = FONT_HINT.test(line);

      for (const m of line.matchAll(PX_RE)) {
        report.summary.pxCount++;
        const val = Number(m[1]);
        const kind = inRadiusCtx ? 'radius' : inFontCtx ? 'fontSize' : 'spacing';
        const cls = classifyPx(val, kind);
        report.buckets[cls.bucket].push({
          kind,
          value: `${val}px`,
          file: rel,
          line: lineNo + 1,
          ...cls,
        });
      }
    }
  }

  // Sort each bucket by file + line for stable diffs.
  for (const bucket of Object.values(report.buckets)) {
    bucket.sort((a, b) => (a.file + a.line).localeCompare(b.file + b.line));
  }

  report.summary.matched = report.buckets.matched.length;
  report.summary.drift   = report.buckets.drift.length;
  report.summary.unknown = report.buckets.unknown.length;

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Run + emit
// ─────────────────────────────────────────────────────────────────────────────

const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : APPS;

if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });

console.log(`Auditing ${targets.length} app(s) against canonical tokens...`);
console.log(`Canonical: ${canonical.color.size} colours, ${canonical.spacing.size} spacings, ${canonical.radius.size} radii, ${canonical.fontSize.size} font-sizes`);
console.log('');

for (const app of targets) {
  const report = auditApp(app);
  if (report.error) {
    console.log(`  ${app.padEnd(20)} SKIP (${report.error})`);
    continue;
  }
  const outPath = join(REPORT_DIR, `${app}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  const s = report.summary;
  console.log(`  ${app.padEnd(20)} ${String(s.filesScanned).padStart(5)} files  |  matched ${String(s.matched).padStart(4)}  drift ${String(s.drift).padStart(4)}  unknown ${String(s.unknown).padStart(4)}  →  ${relative(ROOT, outPath)}`);
}

console.log('');
console.log('Review reports under audit-reports/. Plan migrations by tackling unknowns first,');
console.log('reconciling drifts second, and bulk-replacing matches last.');
