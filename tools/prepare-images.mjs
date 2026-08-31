/**
 * prepare-images.mjs — turn the owner's photography into web assets.
 *
 *   node tools/prepare-images.mjs "/path/to/Qualis Images"
 *
 * Reads tools/image-map.json (slot id -> source filename), looks up each slot's
 * published pixel spec from the ported pages, and writes AVIF + WebP + JPEG at
 * exactly that size into public/images/. Writes tools/image-manifest.json, which
 * the porter reads to fill in each <ImageSlot src width height>.
 *
 * Sizes come from the spec the design already declares, so the rendered geometry
 * cannot drift: the layout reserves the same box either way.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.argv[2];
if (!SRC) throw new Error('usage: node tools/prepare-images.mjs <source-image-dir>');
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/images');
const PAGES = path.join(ROOT, 'src/pages');

/* ---- collect each slot's declared pixel spec from the ported pages ---- */
const specs = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.astro')) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/<ImageSlot ([^>]*?)\/>/g)) {
        const a = {};
        for (const kv of m[1].matchAll(/(\w+)=\{("(?:[^"\\]|\\.)*")\}/g)) a[kv[1]] = JSON.parse(kv[2]);
        if (!a.id || !a.spec) continue;
        const dim = a.spec.match(/(\d+)\s*×\s*(\d+)/);
        if (dim) specs.set(a.id, { w: +dim[1], h: +dim[2] });
      }
    }
  }
})(PAGES);

const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/image-map.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const manifest = {};
const problems = [];
let bytesIn = 0, bytesOut = 0;

for (const [id, file] of Object.entries(map)) {
  if (id.startsWith('_')) continue;
  const from = path.join(SRC, file);
  if (!fs.existsSync(from)) { problems.push(`${id}: source not found — ${file}`); continue; }
  const spec = specs.get(id);
  if (!spec) { problems.push(`${id}: no slot with that id, or it declares no pixel spec`); continue; }

  const meta = await sharp(from).metadata();
  if (meta.width !== spec.w || meta.height !== spec.h) {
    problems.push(`${id}: source is ${meta.width}×${meta.height} but the slot declares ${spec.w}×${spec.h}`);
  }
  bytesIn += fs.statSync(from).size;

  const slug = id.toLowerCase();
  const base = sharp(from).resize(spec.w, spec.h, { fit: 'cover', position: 'attention' });
  await base.clone().avif({ quality: 52, effort: 6 }).toFile(path.join(OUT, `${slug}.avif`));
  await base.clone().webp({ quality: 80 }).toFile(path.join(OUT, `${slug}.webp`));
  await base.clone().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(path.join(OUT, `${slug}.jpg`));

  const sizes = ['avif', 'webp', 'jpg'].map((x) => fs.statSync(path.join(OUT, `${slug}.${x}`)).size);
  bytesOut += sizes[0];
  manifest[id] = { src: `/images/${slug}.jpg`, width: spec.w, height: spec.h };
  const kb = (n) => (n / 1024).toFixed(0).padStart(4) + 'K';
  console.log(`  ${id.padEnd(12)} ${String(spec.w + '×' + spec.h).padEnd(11)} avif${kb(sizes[0])}  webp${kb(sizes[1])}  jpg${kb(sizes[2])}`);
}

fs.writeFileSync(path.join(ROOT, 'tools/image-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${Object.keys(manifest).length} slots processed`);
console.log(`source ${(bytesIn / 1048576).toFixed(1)} MB  ->  avif ${(bytesOut / 1048576).toFixed(1)} MB`);
if (problems.length) { console.log(`\nPROBLEMS (${problems.length}):`); problems.forEach((p) => console.log('  ' + p)); process.exitCode = 1; }
else console.log('no problems.');
