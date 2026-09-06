// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Read as a file rather than `import ... with { type: 'json' }`: import
// attributes are gated on the Node version, and the Cloudflare builder's Node
// is not pinned by this repo.
const readJson = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  } catch {
    return fallback;
  }
};

// Organic pages served as static files from public/ (self-contained HTML, not
// Astro routes) — @astrojs/sitemap can't see them, so they're listed here.
// The /lp/* ad landing pages are deliberately NOT listed: they are noindex,
// paid-traffic-only, and twin the organic service pages.
const SITE = 'https://qualisassurance.com';
const staticPublicPages = [
  `${SITE}/importing-furniture-from-india/`,
  `${SITE}/importing-furniture-from-india/germany/`,
  `${SITE}/importing-furniture-from-india/netherlands/`,
  `${SITE}/importing-furniture-from-india/uk/`,
  `${SITE}/importing-furniture-from-india/usa/`,
  `${SITE}/importing-furniture-from-india/australia/`,
  `${SITE}/importing-furniture-from-india/uae/`,
  `${SITE}/importing-furniture-from-india/canada/`,
  `${SITE}/importing-furniture-from-india/france/`,
  `${SITE}/importing-furniture-from-india/spain/`,
  `${SITE}/importing-furniture-from-india/saudi-arabia/`,
  `${SITE}/eudr-compliance-india-furniture/`,
  `${SITE}/eudr-supplier-evidence-review/`,
];

/* Blog dates come from WordPress. The snapshot is rewritten during the build,
   before the sitemap hook runs, so reading it here gets this build's posts —
   and if the CMS was down, it holds the last known good set instead. Both
   lookups are lazy and memoised: the file does not exist yet at config-eval
   time, only by the time the sitemap integration calls back. */
const lastmodByRoute = readJson('./src/data/lastmod.json', {});
let blogCache;
const blog = () => {
  if (!blogCache) {
    const posts = readJson('./src/data/blog-snapshot.json', { posts: [] }).posts ?? [];
    /** route -> ISO date, for posts, term archives and the index. */
    const dates = {};
    /** term route -> post count, so single-post archives can be dropped. */
    const counts = {};
    const newer = (route, iso) => {
      if (!iso) return;
      if (!dates[route] || iso > dates[route]) dates[route] = iso;
    };
    for (const p of posts) {
      // WPGraphQL returns "2026-09-05T17:00:02" (site time, no zone). The date
      // half is all a sitemap needs, and it sidesteps the missing offset.
      const day = String(p.modified || p.date || '').slice(0, 10);
      if (!day) continue;
      newer(`/blog/${p.slug}/`, day);
      newer('/blog/', day);
      for (const [kind, terms] of [['category', p.categories], ['tag', p.tags]]) {
        for (const t of terms ?? []) {
          const route = `/blog/${kind}/${t.slug}/`;
          newer(route, day);
          counts[route] = (counts[route] ?? 0) + 1;
        }
      }
    }
    blogCache = { dates, counts };
  }
  return blogCache;
};

/** Term archives with fewer than two posts — excluded from the sitemap. */
const thinTermArchives = () =>
  new Set(Object.entries(blog().counts).filter(([, n]) => n < 2).map(([route]) => route));

const lastmodFor = (pathname) =>
  pathname.startsWith('/blog') ? blog().dates[pathname] : lastmodByRoute[pathname];

export default defineConfig({
  site: 'https://qualisassurance.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  // Astro collapses whitespace between tags by default. The reference relies on
  // it: two inline-block .btn siblings separated by a newline render with a real
  // space between them, and stripping it shifted them by 2px. Gzip recovers the
  // few hundred bytes this costs.
  compressHTML: false,
  integrations: [
    sitemap({
      customPages: staticPublicPages,
      /* Drop archives that hold a single post. They are a near-duplicate of
         that post with no extra content, and they compete with it. The page
         itself also carries `noindex,follow` — see TermArchive.astro. */
      filter: (url) => !thinTermArchives().has(new URL(url).pathname),
      /* lastmod. Static routes are dated from src/data/lastmod.json (the last
         commit that touched the page source); blog routes are dated from
         WordPress's own `modified` field. Anything we cannot date honestly is
         left without a lastmod — an absent value is ignored, a wrong one
         teaches Google to distrust the whole file. */
      serialize: (item) => {
        const date = lastmodFor(new URL(item.url).pathname);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
});
