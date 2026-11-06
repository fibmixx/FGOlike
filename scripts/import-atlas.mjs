#!/usr/bin/env node
// Downloads the JP servant data from Atlas Academy and converts it for FGOlike.
//
//   npm run import:atlas            (uses a 24h cache in .cache/atlas)
//   npm run import:atlas -- --fresh (forces a new download)
//
// Output: src/data/generated/servants.json and classRelation.json
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertClassRelation, convertServant, disambiguate } from './atlas/convert.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache', 'atlas');
const OUT = join(ROOT, 'src', 'data', 'generated');
const BASE = 'https://api.atlasacademy.io/export/JP';
const fresh = process.argv.includes('--fresh');

async function cached(file) {
  const path = join(CACHE, file);
  try {
    const st = await stat(path);
    if (!fresh && Date.now() - st.mtimeMs < 24 * 3600 * 1000) {
      console.log(`  cache  ${file}`);
      return JSON.parse(await readFile(path, 'utf8'));
    }
  } catch { /* not cached */ }
  console.log(`  fetch  ${BASE}/${file} …`);
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(path, text);
  return JSON.parse(text);
}

async function main() {
  console.log('FGOlike · Atlas Academy import (JP)');
  const [servants, relation] = await Promise.all([
    cached('nice_servant_lang_en.json'),
    cached('NiceClassRelation.json'),
  ]);

  const stats = {};
  const defs = disambiguate(
    servants
      .map((s) => convertServant(s, stats))
      .filter(Boolean)
      .sort((a, b) => a.collectionNo - b.collectionNo),
  );
  const classRel = convertClassRelation(relation);

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'servants.json'), JSON.stringify(defs));
  await writeFile(join(OUT, 'classRelation.json'), JSON.stringify(classRel, null, 1));

  const byClass = {};
  for (const d of defs) byClass[d.cls] = (byClass[d.cls] ?? 0) + 1;
  console.log(`\n✔ ${defs.length} servants → src/data/generated/servants.json`);
  console.log('  by class:', byClass);
  console.log(`✔ class relation (${Object.keys(classRel).length} classes) → src/data/generated/classRelation.json`);
  const skipped = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log('\nUnsupported effects (ignored), most common first:');
  for (const [k, v] of skipped) console.log(`  ${String(v).padStart(5)}  ${k}`);
}

main().catch((e) => {
  console.error('\n✖ Import failed:', e.message);
  process.exit(1);
});
