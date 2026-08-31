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

export const WP_ENDPOINT =
  import.meta.env.WP_GRAPHQL_ENDPOINT ??
  process.env.WP_GRAPHQL_ENDPOINT ??
  'https://cms.qualisinspections.com/graphql';

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
          `[wp] Building with an empty blog. The rest of the site is unaffected.\n`
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
 * Rank Math / Yoast expose per-post SEO fields only when their WPGraphQL bridge
 * plugin is active. It is not active today, so we probe once per build and add
 * the `seo { … }` selection only if the schema has it. The day that plugin is
 * installed, the next build starts using real SEO titles with no code change.
 */
let seoSupport: boolean | null = null;
async function hasSeoFields(): Promise<boolean> {
  if (seoSupport !== null) return seoSupport;
  const probe = await gql<{ posts: unknown }>(
    '{ posts(first: 1) { nodes { seo { title description } } } }',
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
  ${seo ? 'seo { title description }' : ''}
`;

type RawPost = Record<string, any>;

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
          sourceUrl: img.sourceUrl,
          altText: img.altText || null,
          width: img.mediaDetails?.width ?? null,
          height: img.mediaDetails?.height ?? null,
        }
      : null,
    categories: n.categories?.nodes ?? [],
    tags: n.tags?.nodes ?? [],
    seoTitle: n.seo?.title || null,
    seoDescription: n.seo?.description || null,
  };
}

/* ------------------------------------------------------------- fetching */
let cache: WpPost[] | null = null;

/** Every published post, newest first. Cursor-paginated so it scales past 100. */
export async function getAllPosts(): Promise<WpPost[]> {
  if (cache) return cache;
  const seo = await hasSeoFields();
  const out: WpPost[] = [];
  let after: string | null = null;

  for (let page = 0; page < 100; page++) {
    const data: any = await gql(
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
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
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
