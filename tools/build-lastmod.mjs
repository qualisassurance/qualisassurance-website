#!/usr/bin/env node
/**
 * Generates src/data/lastmod.json — route -> ISO date of the last commit that
 * touched that route's source file.
 *
 * Why a committed JSON file instead of asking git at build time: the Cloudflare
 * build clones the repo, and a shallow clone has no history for most files, so
 * `git log -1 -- <file>` there returns nothing. Falling back to file mtime is
 * worse than useless — on a fresh clone every mtime is the checkout time, which
 * would stamp every URL with the build date. Google treats an inaccurate
 * lastmod as a reason to ignore the field site-wide, so a wrong date costs more
 * than no date at all.
 *
 * Blog posts are NOT in here: their real modified date comes from WordPress and
 * is read out of src/data/blog-snapshot.json by the sitemap config instead.
 *
 * Run after content changes, before committing:
 *   node tools/build-lastmod.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/lastmod.json');

/** Recursively collect files named `name` under `dir`. */
function walk(dir, name, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, name, acc);
    else if (entry.name === name) acc.push(full);
  }
  return acc;
}

/** Route for a page source file, or null if it should not be in the sitemap. */
function routeFor(file) {
  const rel = relative(ROOT, file);
  if (rel === 'src/pages/index.astro') return '/';
  if (rel.startsWith('src/pages/')) {
    const seg = rel.slice('src/pages/'.length, -'/index.astro'.length);
    // /blog/* is dynamic and dated from WordPress, not from the route source.
    return seg.startsWith('blog') ? null : `/${seg}/`;
  }
  if (rel.startsWith('public/')) {
    const seg = rel.slice('public/'.length, -'/index.html'.length);
    // /lp/* are noindex paid-traffic landing pages and are not in the sitemap.
    return seg.startsWith('lp/') ? null : `/${seg}/`;
  }
  return null;
}

/** Date of the last commit touching `file`, as YYYY-MM-DD, or null if untracked. */
function lastCommitDate(file) {
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  return out || null;
}

const sources = [
  ...walk(join(ROOT, 'src/pages'), 'index.astro'),
  ...walk(join(ROOT, 'public'), 'index.html'),
].filter((f) => statSync(f).isFile());

/**
 * Dynamic routes are not `index.astro` files, so the walk above misses them and
 * their URLs ship without a lastmod. The Defect Library is one template over a
 * data file, so each entry is dated by whichever of the two changed last —
 * editing an entry touches the data file, restyling the page touches the route.
 * Add a block like this for any future dynamic route outside /blog.
 */
function defectRoutes() {
  const route = join(ROOT, 'src/pages/defects/[slug].astro');
  const data = join(ROOT, 'src/data/defects.ts');
  if (!existsSync(route) || !existsSync(data)) return [];
  const slugs = [...readFileSync(data, 'utf8').matchAll(/^\s*slug: '([^']+)',/gm)].map((m) => m[1]);
  const dates = [lastCommitDate(route), lastCommitDate(data)].filter(Boolean).sort();
  const date = dates.at(-1);
  return date ? slugs.map((slug) => [`/defects/${slug}/`, date]) : [];
}

const lastmod = {};
let skipped = 0;
for (const file of sources) {
  const route = routeFor(file);
  if (!route) continue;
  const date = lastCommitDate(file);
  if (!date) {
    skipped += 1;
    console.warn(`  no commit yet, omitting: ${relative(ROOT, file)}`);
    continue;
  }
  lastmod[route] = date;
}

for (const [route, date] of defectRoutes()) lastmod[route] = date;

const sorted = Object.fromEntries(Object.entries(lastmod).sort(([a], [b]) => a.localeCompare(b)));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`lastmod: ${Object.keys(sorted).length} routes -> ${relative(ROOT, OUT)}` +
  (skipped ? ` (${skipped} untracked, omitted)` : ''));
