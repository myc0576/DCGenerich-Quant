#!/usr/bin/env node
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'kb', 'INDEX.generated.md');

const INCLUDE_DIRS = [
  'kb',
  'strategies',
  'indicators',
  'backtest',
  'research',
  'docs',
];

const EXCLUDE = new Set([
  'node_modules',
  '.git',
  '.worktrees',
  'data',
  'results',
  'reports',
]);

async function walk(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const e of entries) {
    if (EXCLUDE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
      continue;
    }
    if (!e.isFile()) continue;
    if (!e.name.toLowerCase().endsWith('.md')) continue;
    out.push(full);
  }

  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function toTitle(file) {
  const base = path.basename(file, path.extname(file));
  return base === 'README' ? `${path.dirname(file).split(path.sep).pop()}` : base;
}

async function main() {
  const files = [];
  for (const d of INCLUDE_DIRS) {
    const full = path.join(ROOT, d);
    try {
      const s = await stat(full);
      if (!s.isDirectory()) continue;
    } catch {
      continue;
    }
    files.push(...(await walk(full)));
  }

  const lines = [];
  lines.push('# Generated Index');
  lines.push('');
  lines.push('This file is auto-generated. Edit hand-written pages instead.');
  lines.push('');

  for (const file of files) {
    const r = rel(file);
    lines.push(`- [${toTitle(r)}](${r})`);
  }

  lines.push('');
  await writeFile(OUT, lines.join('\n'), 'utf8');
  console.log(`wrote ${rel(OUT)} (${files.length} pages)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
