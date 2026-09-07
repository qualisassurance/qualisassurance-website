/**
 * Build-time WordPress client.
 *
 * The blog is the only part of the site WordPress drives; the 30 marketing pages
 * live in this repo. Everything here runs at build time only — nothing ships to
 * the browser, and the output stays fully static.
 *
 * Design rule: a CMS problem must never break the build. If the endpoint is
 * unreachable, slow, or returns errors, we log loudly and fall back to an empty
 * blog so the other 30 pages still deploy.
 */

/**
 * CMS lives at qa.qualisassurance.com — now the Hostinger install's primary
 * domain (deliberately reassigned from cms.qualisinspections.com, which no
 * longer resolves, so the CMS doesn't depend on qualisinspections.com staying
 * registered). qualisinspections.com's own build is unaffected: it only ever
 * reads from this endpoint at build time, never serves the CMS itself.
 */
export const WP_ENDPOINT =
  import.meta.env.WP_GRAPHQL_ENDPOINT ??
  process.env.WP_GRAPHQL_ENDPOINT ??
  'https://qa.qualisassurance.com/graphql';

import { SITE } from './site';
import snapshot from '../data/blog-snapshot.json';

const TIMEOUT_MS = 20_000;

let failed = false;

/**
 * @param quiet Suppress logging and leave the `failed` flag alone. Used by the
 *   SEO feature probe, whose failure is expected and must not be reported as an
 *   outage — nor latch `failed`, which would swallow a real outage warning later.
 */
async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  quiet = false
): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(WP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
    return json.data ?? null;
  } catch (err) {
    if (quiet) return null;
    if (!failed) {
      failed = true;
      console.warn(
        `\n[wp] Could not reach WPGraphQL at ${WP_ENDPOINT}\n` +
          `[wp]   ${err instanceof Error ? err.message : String(err)}\n` +
          `[wp] Falling back to the committed snapshot if one exists; the rest of the\n` +
        `[wp] site is unaffected either way.\n`
      );
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ types */
export interface WpTerm { name: string; slug: string }
export interface WpImage { sourceUrl: string; altText: string | null; width: number | null; height: number | null }
export interface WpPost {
  databaseId: number;
  title: string;
  slug: string;
  date: string;
  modified: string;
  excerpt: string;
  content: string;
  author: { name: string; slug: string; description: string | null } | null;
  featuredImage: WpImage | null;
  categories: WpTerm[];
  tags: WpTerm[];
  /** From an SEO plugin when one is bridged to WPGraphQL; otherwise null. */
  seoTitle: string | null;
  seoDescription: string | null;
}

/* ------------------------------------------------------ SEO field probe */
/**
 * Per-post SEO fields exist only when an SEO plugin's WPGraphQL bridge is active
 * (currently Yoast SEO + "Add WPGraphQL SEO"). We probe once per build and add
 * the `seo { … }` selection only if the schema has it, so the build still works
 * if the bridge is ever removed or breaks after a plugin update.
 *
 * We read only `title` and `metaDesc`. Deliberately NOT used:
 *   · `canonical`     — points at the CMS domain (qa.qualisassurance.com), never our domain.
 *   · `metaRobotsNoindex` — reflects the CMS's own site-wide "discourage search
 *     engines" setting, which is ON (the CMS must not be indexed). Propagating
 *     it would put noindex on every published post of the public site.
 */
let seoSupport: boolean | null = null;
async function hasSeoFields(): Promise<boolean> {
  if (seoSupport !== null) return seoSupport;
  const probe = await gql<{ posts: unknown }>(
    '{ posts(first: 1) { nodes { seo { title metaDesc } } } }',
    {},
    true
  );
  seoSupport = probe !== null;
  console.info(
    seoSupport
      ? '[wp] SEO plugin fields detected — using per-post SEO title and meta description.'
      : '[wp] No SEO plugin fields in the schema; per-post SEO falls back to title + excerpt.\n' +
          '[wp]   To enable, activate Rank Math (or Yoast) plus its WPGraphQL add-on on the CMS.'
  );
  return seoSupport;
}

const POST_FIELDS = (seo: boolean) => `
  databaseId
  title
  slug
  date
  modified
  excerpt
  content
  author { node { name slug description } }
  featuredImage { node { sourceUrl altText mediaDetails { width height } } }
  categories { nodes { name slug } }
  tags { nodes { name slug } }
  ${seo ? 'seo { title metaDesc }' : ''}
`;

type RawPost = Record<string, any>;

/**
 * Serve a featured image from our own domain when we already ship the identical
 * file in public/images. The CMS has been unreachable before, and a static page
 * that hotlinks it loses its images with it — including the og:image every
 * social preview depends on. Anything we do not have locally keeps the CMS URL,
 * so the owner can still add a brand-new image through WordPress alone.
 *
 * Absolute on purpose: BaseLayout emits ogImage verbatim, so a root-relative
 * path here would produce an og:image no scraper can resolve.
 */
const SHIPPED_IMAGES = new Set(
  Object.keys(import.meta.glob('../../public/images/*', { eager: false })).map((p) =>
    p.split('/').pop()!,
  ),
);

if (SHIPPED_IMAGES.size === 0) {
  console.warn('[wp] no local images resolved — featured images will hotlink the CMS');
}

function localiseImage(sourceUrl: string): string {
  const base = sourceUrl.split('/').pop();
  if (!base) return sourceUrl;
  return SHIPPED_IMAGES.has(base) ? `${SITE.url}/images/${base}` : sourceUrl;
}

/**
 * AVIF/WebP siblings to serve above the JPEG in a <picture>, for a featured
 * image. Only a localised /images/*.jpg (see localiseImage) has shipped
 * siblings; a CMS-hosted image returns just its jpg, so the caller renders a
 * plain <img>. The marketing pages already serve AVIF/WebP via ImageSlot; the
 * blog served bare JPEGs, which cost it Lighthouse performance on the listing
 * pages. The image pipeline ships all three formats per basename, but this only
 * references a sibling that is actually in SHIPPED_IMAGES.
 */
export function featuredSources(sourceUrl: string): { avif?: string; webp?: string; jpg: string } {
  const m = sourceUrl.match(/\/images\/(.+)\.jpe?g$/i);
  if (!m) return { jpg: sourceUrl };
  const base = m[1];
  const sib = (ext: 'avif' | 'webp') =>
    SHIPPED_IMAGES.has(`${base}.${ext}`) ? `${SITE.url}/images/${base}.${ext}` : undefined;
  return { avif: sib('avif'), webp: sib('webp'), jpg: sourceUrl };
}

function shape(n: RawPost): WpPost {
  const img = n.featuredImage?.node ?? null;
  return {
    databaseId: n.databaseId,
    title: n.title ?? '',
    slug: n.slug,
    date: n.date,
    modified: n.modified ?? n.date,
    excerpt: n.excerpt ?? '',
    content: n.content ?? '',
    author: n.author?.node
      ? { name: n.author.node.name, slug: n.author.node.slug, description: n.author.node.description ?? null }
      : null,
    featuredImage: img
      ? {
          sourceUrl: localiseImage(img.sourceUrl),
          altText: img.altText || null,
          width: img.mediaDetails?.width ?? null,
          height: img.mediaDetails?.height ?? null,
        }
      : null,
    categories: n.categories?.nodes ?? [],
    tags: n.tags?.nodes ?? [],
    seoTitle: customSeoTitle(n.seo?.title, n.title ?? ''),
    seoDescription: n.seo?.metaDesc || null,
  };
}

/**
 * Yoast fills its SEO title from a template (`%%title%% %%sep%% %%sitename%%`),
 * so an untouched post returns "Hello world! - Qualis CMS" — the *CMS's* name,
 * which must never reach the public site. Treat the templated value as "unset"
 * and only honour a title the author actually wrote.
 */
function customSeoTitle(seoTitle: string | undefined, postTitle: string): string | null {
  if (!seoTitle) return null;
  const site = cmsSiteName;
  if (site) {
    const stripped = seoTitle.replace(new RegExp(`\\s*[-|–—]\\s*${escapeRe(site)}\\s*$`), '').trim();
    if (stripped === postTitle.trim()) return null;
  }
  return seoTitle.trim() === postTitle.trim() ? null : seoTitle;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The CMS's own site title, needed to recognise Yoast's default title template. */
let cmsSiteName = '';

/* ------------------------------------------------------------- fetching */
let cache: WpPost[] | null = null;

/** Every published post, newest first. Cursor-paginated so it scales past 100. */
/**
 * Last-known-good copy of the blog, committed to the repo.
 *
 * The site is built ahead of time, so posts already deployed keep serving even
 * if the CMS disappears — but only until the next build, which happens on every
 * push. Without this, one unrelated deploy during a CMS outage would silently
 * erase every post, with a green build and no error.
 *
 * The snapshot is refreshed on any build that reaches the CMS and gets posts
 * back, so it stays current on its own. It is never written from an empty or
 * failed fetch, which would defeat the point.
 */
const SNAPSHOT_PATH = 'src/data/blog-snapshot.json';

function readSnapshot(): WpPost[] {
  const posts = (snapshot as { posts?: WpPost[] }).posts ?? [];
  return Array.isArray(posts) ? posts : [];
}

async function writeSnapshot(posts: WpPost[]): Promise<void> {
  if (!posts.length) return;
  try {
    // Node-only, and only meaningful on a developer machine: on CI the write is
    // discarded with the container, which is correct — CI must not commit.
    const { writeFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    writeFileSync(
      join(process.cwd(), SNAPSHOT_PATH),
      JSON.stringify({ capturedAt: new Date().toISOString(), posts }, null, 2) + '\n',
    );
  } catch {
    // A read-only or unexpected working directory must never fail a build.
  }
}

export async function getAllPosts(): Promise<WpPost[]> {
  if (cache) return cache;
  const seo = await hasSeoFields();
  if (seo && !cmsSiteName) {
    const g = await gql<{ generalSettings: { title: string } }>('{ generalSettings { title } }');
    cmsSiteName = g?.generalSettings?.title ?? '';
  }
  const out: WpPost[] = [];
  let after: string | null = null;

  for (let page = 0; page < 100; page++) {
    const data = await gql<{
      posts: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawPost[] };
    }>(
      `query Posts($after: String) {
         posts(first: 50, after: $after, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
           pageInfo { hasNextPage endCursor }
           nodes { ${POST_FIELDS(seo)} }
         }
       }`,
      { after }
    );
    if (!data?.posts) break;
    out.push(...data.posts.nodes.map(shape));
    if (!data.posts.pageInfo?.hasNextPage) break;
    after = data.posts.pageInfo.endCursor;
  }

  if (!out.length) {
    const saved = readSnapshot();
    if (saved.length) {
      console.warn(
        `[wp] CMS returned no posts — serving the last-known-good snapshot ` +
          `(${saved.length} post${saved.length === 1 ? '' : 's'}, captured ` +
          `${(snapshot as { capturedAt?: string }).capturedAt ?? 'unknown'}).`,
      );
      cache = saved;
      return saved;
    }
  } else {
    await writeSnapshot(out);
  }

  cache = out;
  return out;
}

export async function getPost(slug: string): Promise<WpPost | null> {
  return (await getAllPosts()).find((p) => p.slug === slug) ?? null;
}

/** Terms that actually have posts, so we never emit an empty archive page. */
export async function getUsedTerms(kind: 'tags' | 'categories'): Promise<(WpTerm & { count: number })[]> {
  const posts = await getAllPosts();
  const seen = new Map<string, WpTerm & { count: number }>();
  for (const p of posts) {
    for (const t of p[kind]) {
      const cur = seen.get(t.slug);
      if (cur) cur.count++;
      else seen.set(t.slug, { ...t, count: 1 });
    }
  }
  return [...seen.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getPostsByTerm(kind: 'tags' | 'categories', slug: string): Promise<WpPost[]> {
  return (await getAllPosts()).filter((p) => p[kind].some((t) => t.slug === slug));
}

/* ------------------------------------------------------------ utilities */

/**
 * Conservative sanitiser for CMS HTML. The content is first-party, so the goal
 * is defence in depth rather than untrusted-input hardening: drop anything that
 * can execute, and any inline event handler or javascript: URL. <iframe> is kept
 * because WordPress oEmbed (YouTube, Maps) depends on it.
 */
export function sanitize(html: string): string {
  return html
    .replace(/<(script|style|object|embed|form|link|meta)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|object|embed|form|link|meta)\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    /* An <img> with no alt at all makes a screen reader fall back to reading the
       file name, and fails the Lighthouse a11y check the site holds at 100. We
       cannot invent alt text for a CMS image, but marking it decorative is the
       correct default and is what the WCAG guidance says to do when there is
       nothing meaningful to say. An author who fills the field in WordPress
       still wins — this only touches images where the attribute is absent. */
    .replace(/<img\b(?![^>]*\salt\s*=)([^>]*?)(\/?)>/gi, '<img$1 alt=""$2>')
    /* Associate table cells with headers so a screen reader can navigate them,
       and so Lighthouse `td-has-header` passes. WordPress emits bare <th>/<td>.
       Two fixes: mark every <thead> cell as a column header (scope="col"), and
       promote a row's leading bold-only <td> to a row header (<th scope="row">).
       The second targets comparison/matrix tables, whose row labels ("Question",
       "Timing", …) were data cells associated only with an empty corner header;
       it leaves plain data tables (a numeric first column, no <strong>) untouched.
       th[scope="row"] is restyled back to a normal bold cell in blog.css so the
       promotion is invisible. */
    .replace(/<thead[\s\S]*?<\/thead>/gi, (thead) =>
      /* `(?=[\s>])` keeps this from also matching <thead> — "th" is its prefix. */
      thead.replace(/<th(?=[\s>])(?![^>]*\sscope=)([^>]*)>/gi, '<th scope="col"$1>'))
    .replace(
      /(<tr[^>]*>\s*)<td(?![^>]*\sscope=)[^>]*>(\s*<strong>[\s\S]*?<\/strong>\s*)<\/td>/gi,
      '$1<th scope="row">$2</th>');
}

/** Strip tags and entities from an excerpt so it is safe in a meta tag. */
export function plainText(html: string, limit = 300): string {
  const t = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= limit) return t;
  return t.slice(0, limit).replace(/\s+\S*$/, '') + '…';
}

/** "12 March 2026" — matches the site's plain, factual tone. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function readingMinutes(html: string): number {
  const words = plainText(html, Number.MAX_SAFE_INTEGER).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const POSTS_PER_PAGE = 12;
