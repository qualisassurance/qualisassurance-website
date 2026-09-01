/**
 * prepare-brand.mjs — raster derivatives of the brand lockup.
 *
 * The reference site pointed og:image at /images/og-qualis-1200x630.jpg and the
 * JSON-LD logo at /images/qualis-logo.svg; neither file has ever existed (both
 * 404 on the live site today). This builds them from the brand assets.
 *
 * Archivo is loaded from the self-hosted woff2 so the rasterised wordmark
 * matches the site exactly rather than falling back to a system sans.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const BRAND = path.join(ROOT, 'public/brand');
const IMAGES = path.join(ROOT, 'public/images');
fs.mkdirSync(IMAGES, { recursive: true });

const PAPER = { r: 0xf7, g: 0xf6, b: 0xf2, alpha: 1 };
const archivo = fs.readdirSync(path.join(ROOT, 'public/fonts')).find((f) => f.startsWith('archivo-'));
const archivoData = fs.readFileSync(path.join(ROOT, 'public/fonts', archivo)).toString('base64');

/** Inline the font so the rasteriser has real Archivo outlines, not a fallback. */
function withFont(svg) {
  const face = `<style>@font-face{font-family:'Archivo';font-weight:100 900;src:url(data:font/woff2;base64,${archivoData}) format('woff2');}</style>`;
  return svg.replace(/(<svg[^>]*>)/, `$1${face}`);
}

const lockup = withFont(fs.readFileSync(path.join(BRAND, 'qualis-logo-horizontal.svg'), 'utf8'));
const stacked = withFont(fs.readFileSync(path.join(BRAND, 'qualis-logo-stacked.svg'), 'utf8'));
const tile = fs.readFileSync(path.join(ROOT, 'public/favicon.svg'));

/* 1. Organisation logo for JSON-LD. Google's structured-data guidance prefers a
      raster; keep it generous so it survives their downscaling. */
await sharp(Buffer.from(lockup), { density: 400 })
  .resize(1120, 200, { fit: 'contain', background: PAPER })
  .flatten({ background: PAPER })
  .png({ compressionLevel: 9 })
  .toFile(path.join(IMAGES, 'qualis-logo.png'));

/* 2. Open Graph card — the filename the reference already points every page at. */
const stackedPng = await sharp(Buffer.from(stacked), { density: 400 })
  .resize(560, null, { fit: 'contain', background: { ...PAPER, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: PAPER } })
  .composite([
    { input: stackedPng, gravity: 'centre' },
    // the site's verification-green rule along the top, as on the header
    { input: { create: { width: 1200, height: 10, channels: 4, background: { r: 0x0f, g: 0x7a, b: 0x5a, alpha: 1 } } }, top: 0, left: 0 },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(path.join(IMAGES, 'og-qualis-1200x630.jpg'));

/* 3. Touch / app icons from the favicon tile. */
for (const size of [180, 192, 512]) {
  await sharp(tile, { density: 400 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(IMAGES, `icon-${size}.png`));
}

/* 4. favicon.ico. Browsers prefer the SVG, but Google's favicon crawler and a
   long tail of feed readers, chat unfurlers and older clients still request
   /favicon.ico from the site root, and a 404 there means no icon at all.

   sharp cannot write ICO, so the container is assembled here rather than
   pulling in a dependency for ~200 lines of format. An ICO is a 6-byte header,
   one 16-byte directory entry per frame, then the frame payloads; the payloads
   are PNGs, which every browser since IE11 reads. Three sizes cover the tab
   strip (16), retina tabs and bookmarks (32), and Windows shortcuts (48). */
const icoSizes = [16, 32, 48];
const frames = [];
for (const size of icoSizes) {
  frames.push(
    await sharp(tile, { density: 400 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
  );
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);            // reserved
header.writeUInt16LE(1, 2);            // 1 = icon
header.writeUInt16LE(frames.length, 4);

let offset = 6 + frames.length * 16;
const entries = frames.map((buf, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 0);  // 0 encodes 256
  e.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 1);
  e.writeUInt8(0, 2);                  // palette size, 0 for truecolour
  e.writeUInt8(0, 3);                  // reserved
  e.writeUInt16LE(1, 4);               // colour planes
  e.writeUInt16LE(32, 6);              // bits per pixel
  e.writeUInt32LE(buf.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});

const icoPath = path.join(ROOT, 'public/favicon.ico');
fs.writeFileSync(icoPath, Buffer.concat([header, ...entries, ...frames]));
console.log(`  favicon.ico                  ${icoSizes.join('/')}px      ${(fs.statSync(icoPath).size / 1024).toFixed(1)}K`);

for (const f of ['qualis-logo.png', 'og-qualis-1200x630.jpg', 'icon-180.png', 'icon-192.png', 'icon-512.png']) {
  const p = path.join(IMAGES, f);
  const m = await sharp(p).metadata();
  console.log(`  ${f.padEnd(28)} ${String(m.width + '×' + m.height).padEnd(11)} ${(fs.statSync(p).size / 1024).toFixed(0)}K`);
}
