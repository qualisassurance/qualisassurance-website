# qualisinspections.com

Headless rebuild of the Qualis website: **30 static marketing pages** ported from the
existing hand-built site, plus a **blog driven by WordPress** over WPGraphQL. Output is
fully static (SSG) — Cloudflare Pages serves flat files, no SSR.

---

## Build

| | |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | **22 LTS** (see `.nvmrc`; `engines` requires ≥20) |
| Framework preset | Astro |

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve dist/ locally
```

### Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `WP_GRAPHQL_ENDPOINT` | no | `https://cms.qualisinspections.com/graphql` | WordPress GraphQL endpoint the blog is built from |

It has a working default so local builds and CI need no configuration. Set it in
Cloudflare Pages if the CMS ever moves. A `.env` file at the repo root also works and is
gitignored.

**A CMS problem never breaks the build.** If the endpoint is unreachable, slow or
erroring, the build logs a warning, renders the blog's "articles coming soon" state and
still ships all 30 marketing pages with exit code 0. Verified against an unreachable
endpoint, an empty CMS and a 27-post CMS.

---

## Layout

```
src/
  pages/            30 generated marketing pages + the hand-written /blog routes
  layouts/          BaseLayout — head meta, JSON-LD, header/footer, shared behaviour
  components/       Header, Footer, ImageSlot, PostCard, BlogIndex, TermArchive, BlogEmpty
  lib/
    site.ts         nav + footer tables, site constants
    wp.ts           build-time WPGraphQL client
  styles/
    global.css      the design system shared by 23 of the 30 pages
    pages/*.css     the 7 pages whose stylesheet genuinely differs
    blog.css        blog layer (incl. its own mobile rules — see below)
    mobile.css      mobile layer; media-query rules only
public/
  fonts/            self-hosted webfonts (see Fonts)
  robots.txt  llms.txt  _headers  favicon.svg
tools/
  port-reference.mjs   regenerates the 30 pages from the reference site
```

---

## The 30 marketing pages are generated, not hand-written

`src/pages/**/index.astro` and `src/styles/pages/*.css` come from the original static
site via:

```bash
node tools/port-reference.mjs /path/to/qualis-deploy-hostinger
```

It lifts each page's `<title>`, meta description, canonical and JSON-LD into layout
props, carries `<main>` across verbatim, picks the nav variant and header CTA, rewrites
the 36 image placeholders into `<ImageSlot>` components, adds `data-label` to table cells
for the mobile stacked view, and chooses that page's stylesheet. It aborts rather than
guessing if it meets a CSS cascade case it has no rule for.

Content is never retyped, so copy, prices and checklist codes cannot drift. It deletes
only files listed in `tools/port-manifest.json`, so the hand-written `/blog` routes are
safe.

> **Edit the generator, not the generated files.** Hand edits to `src/pages/**` are lost
> on the next run. Once real photography lands and `<ImageSlot src=…>` values are filled
> in, either teach the generator about them or retire it.

### Why some pages have their own stylesheet

In the original, each page is a single `<style>` block where base rules and page rules
interleave. Splitting that into "shared + overrides" reorders them and silently changes
the cascade — a page's own `.btn` starts beating the base `.nav .btn`, and so on. So each
page imports **exactly one** stylesheet: 23 share `styles/global.css`, and the 7 that
genuinely differ get their own complete file. Do not "de-duplicate" them.

`BaseLayout.astro` therefore imports no page stylesheet — only `mobile.css`, which Astro
emits last. Blog mobile rules live inside `blog.css` because Astro emits `blog.css`
*after* `mobile.css` on blog routes.

---

## Fonts

Inter Tight, Inter and JetBrains Mono are **self-hosted** in `public/fonts` — the same
woff2 files Google serves, with the original unicode-range subsetting and
`font-display:swap`. The third-party request was render-blocking and cost 17 Lighthouse
points (FCP 3.3 s vs 1.4 s).

To refresh: fetch `SITE.fontsSource` (in `src/lib/site.ts`) with a modern browser
User-Agent, download every `fonts.gstatic.com` URL, and rewrite those URLs to `/fonts/`.
**Re-verify rendering afterwards** — fonts drive every text metric.

---

## Images

Every image is still a styled placeholder carrying its slot ID and art-direction brief
(`IMG-01`, `IMG-PSI-02`, …), exactly as in the original. To drop in a real photo:

```astro
<ImageSlot id="IMG-01" spec="1600×1200px · JPG/AVIF" desc="…"
           src="/images/img-01.avif" width={1600} height={1200} />
```

Sizing lives on the parent, so adding `src` cannot shift the layout.
`public/favicon.svg` is a placeholder derived from the wordmark — replace it with the
real asset.

---

## Quality bar

Mobile Lighthouse, all page types: **performance 99–100, accessibility 100, best
practices 100, SEO 100**, CLS 0, TBT 0 ms.

The port is verified two ways rather than by eye:

- **Visual** — computed styles and bounding boxes diffed element-by-element against the
  original at 1440/1280/1024/768 px. Zero unexpected differences.
- **Content** — text, JSON-LD and titles diffed per page; prices, checklist codes
  (C-01→C-10, V-01→V-10, L-01→L-12, A-01→A-08), FAQ entries and image slots counted.
  Zero differences.

Three deliberate departures from the original, all agreed with the owner:

1. `--g500` #8A8880 → **#737169** — the original was 3.28:1 on the paper background where
   WCAG AA needs 4.5:1. This was the only accessibility failure on the site.
2. `.mono` is now defined globally. The shared footer markup always said
   `class="mono"`, but only 7 of 30 pages defined the rule, so the tagline rendered in
   Inter on the other 23.
3. Self-hosted fonts (above).

(1) and (2) live in `OWNER_FIXES` inside `tools/port-reference.mjs` so re-porting cannot
revert them.

---

## Deploying to Cloudflare Pages

1. **Create → connect to Git**, pick this repository.
2. Framework preset **Astro**, build command `npm run build`, output directory `dist`.
3. Environment variables → add `WP_GRAPHQL_ENDPOINT` (and set Node to 22 via
   `NODE_VERSION=22` if the default is older).
4. Deploy, and check the preview URL before touching DNS.
5. **Later:** add the custom domain, and add a Deploy Hook so WordPress triggers a
   rebuild on publish (Settings → Builds & deployments → Deploy hooks; call that URL from
   a WordPress publish action or a plugin).

`public/_headers` already sets immutable caching for `/_astro/*` and `/fonts/*.woff2`,
plus `X-Content-Type-Options`, `Referrer-Policy` and `X-Frame-Options`.

> The original site's `.htaccess` (HTTPS + www→apex redirects) is Apache-only and is
> **not** ported. Cloudflare handles HTTPS automatically; set up the www→apex redirect as
> a Cloudflare Redirect Rule when you cut over.

---

## Known open items

- **23 of 30 pages have meta descriptions over 160 characters** (up to 265) and 4 have
  titles over 65, so search results will truncate them. This is original copy and was
  left untouched deliberately; it needs the owner's words.
## Per-post SEO

The CMS runs **Yoast SEO** + **Add WPGraphQL SEO**, so authors can set an SEO title and
meta description per post, independent of the headline. `lib/wp.ts` probes the schema
each build and falls back to post title + excerpt if the bridge is ever removed.

Only `seo.title` and `seo.metaDesc` are consumed. Two Yoast fields are deliberately
ignored:

- `canonical` — points at `cms.qualisinspections.com`, never this domain.
- `metaRobotsNoindex` — reflects the CMS's own site-wide "discourage search engines"
  setting, which is **on**. Propagating it would put `noindex` on every published post.

Yoast also fills its SEO title from a template, so an untouched post returns
`"Post title - Qualis CMS"`. The client recognises that pattern and treats it as unset,
so the CMS's name can never reach the public site.
