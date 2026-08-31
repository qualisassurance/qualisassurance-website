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

const SRC_DIRS = process.argv.slice(2);
if (!SRC_DIRS.length) throw new Error('usage: node tools/prepare-images.mjs <source-dir> [more dirs…]');
/** Sources are spread over several folders; take the first match. */
const findSource = (file) => SRC_DIRS.map((d) => path.join(d, file)).find((f) => fs.existsSync(f));
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/images');
const PAGES = path.join(ROOT, 'src/pages');

/* ---- collect each slot's declared pixel spec from the ported pages ---- */
const specs = new Map();
const seen = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.astro')) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/<ImageSlot ([^>]*?)\/>/g)) {
        const a = {};
        for (const kv of m[1].matchAll(/(\w+)=\{("(?:[^"\\]|\\.)*")\}/g)) a[kv[1]] = JSON.parse(kv[2]);
        if (!a.id) continue;
        /* A page can repeat an id — the six client-logo frames all but one use
           "LOGO". Address later occurrences as ID#2, ID#3, … in document order. */
        const n = (seen.get(a.id) ?? 0) + 1;
        seen.set(a.id, n);
        const key = n === 1 ? a.id : `${a.id}#${n}`;
        const dim = (a.spec ?? '').match(/(\d+)\s*×\s*(\d+)/) || (a.desc ?? '').match(/(\d+)\s*×\s*(\d+)/);
        if (dim) specs.set(key, { w: +dim[1], h: +dim[2] });
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
  const from = findSource(file);
  if (!from) { problems.push(`${id}: source not found in any source dir — ${file}`); continue; }
  const spec = specs.get(id);
  if (!spec) { problems.push(`${id}: no slot with that id, or it declares no pixel spec`); continue; }

  const isSvg = from.toLowerCase().endsWith('.svg');
  /* Both supplied "SVG" maps are a single base64 bitmap in an SVG wrapper — no
     real vector paths — so shipping them raw would cost ~2.5MB each. Rasterise
     at 2x then downsample, which is sharper than a straight 1x render. */
  const input = isSvg ? sharp(from, { density: 144 }) : sharp(from);
  const meta = await input.metadata();
  if (!isSvg && (meta.width !== spec.w || meta.height !== spec.h)) {
    problems.push(`${id}: source is ${meta.width}×${meta.height} but the slot declares ${spec.w}×${spec.h}`);
  }
  bytesIn += fs.statSync(from).size;

  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = sharp(from, isSvg ? { density: 144 } : undefined)
    .resize(spec.w, spec.h, { fit: isSvg ? 'contain' : 'cover', position: 'attention',
                              background: { r: 247, g: 246, b: 242 } });
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
