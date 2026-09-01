# CLAUDE.md — qualisinspections.com

Guidance for Claude Code working in this repo. Read before changing anything.

## What this is

A headless rebuild of the Qualis furniture-inspection website: **30 static marketing
pages** ported from a hand-built HTML site, plus a **blog driven by WordPress** over
WPGraphQL at build time. Output is fully static and served from **Cloudflare Workers
static assets**. It is live on the production domain.

The defining constraint: the 30 pages are verified **pixel-identical** to the original.
Most rules below exist to protect that.

## Tech stack

- **Astro 7**, `output: 'static'`, `trailingSlash: 'always'`, `compressHTML: false`
- Plain CSS, hand-written, ported verbatim from the original site
- `@astrojs/sitemap`; `sharp` (dev only, for the image pipeline)
- No framework runtime, no client-side state library, no server, no database
- Total client JS is ~40 lines of vanilla TS in `BaseLayout.astro`

**Do not introduce Tailwind, React, or a CSS framework.** The port is verified against the
original stylesheet; a utility framework would silently destroy that guarantee.

## Build & test

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # no system Node on this machine
npm run dev        # http://localhost:4321
npm run build      # -> dist/  (33 pages when the CMS has posts, 31 when it does not)
npm run preview
```

There is **no `npm test`** and no test suite. Verification is done by diffing rendered
output against the original site — see *Verification* below. Do not claim tests passed.

## Coding standards

- **TypeScript strictly; no `any`.** There are currently zero `any` usages in `src/`.
  Type GraphQL responses through `gql<T>()`, and type `Astro.props` with a local
  `interface` rather than casting.
- **2-space indentation.**
- **Named exports, not default.** `src/lib` and `tools/` are all named exports.
  (`.astro` components are default-exported by the framework; that is unavoidable.)
- Comments explain *why*, especially where the code looks odd on purpose — most of the
  surprising code here is load-bearing.

## Architecture

```
src/
  pages/            30 GENERATED marketing pages + hand-written /blog routes
  layouts/          BaseLayout — head meta, JSON-LD, header/footer, shared behaviour
  components/       Header, Footer, Logo, ImageSlot, PostCard, BlogIndex, TermArchive
  lib/site.ts       nav/footer tables, brand + contact constants
  lib/wp.ts         build-time WPGraphQL client
  styles/
    global.css      the design system shared by 23 of the 30 pages
    pages/*.css     the 7 pages whose stylesheet genuinely differs
    blog.css        blog layer, including its own mobile rules
    mobile.css      mobile layer; media-query rules only
public/             fonts, brand, images, robots.txt, llms.txt, _headers, favicon
tools/              the porter and the image/brand pipelines
```

### The 30 marketing pages are GENERATED

`src/pages/**/index.astro` and `src/styles/pages/*.css` come from:

```bash
node tools/port-reference.mjs ~/Downloads/qualis-deploy-hostinger
```

**Edit the generator, not its output.** Hand edits are lost on the next run. The porter
deletes only what is listed in `tools/port-manifest.json`, so the hand-written `/blog`
routes are safe. Agreed departures from the original live in `OWNER_FIXES`,
`SECTION_REWRITES` and `PAGE_EXTRA_CSS` inside the porter, so a re-port cannot revert them.

### One stylesheet per page — do not "de-duplicate"

Each page imports **exactly one** stylesheet: 23 share `styles/global.css`, and the 7 that
genuinely differ get their own complete file. `BaseLayout` imports no page stylesheet,
only `mobile.css`.

In the original, every page is a single `<style>` block where base rules and page rules
interleave. Any split reorders them and changes the cascade — a page's own `.btn` starts
beating the base `.nav .btn`, design-layer rules stop winning. This was attempted twice
(source-order split, then `@layer`) and broke rendering both times. The duplication is
deliberate and costs ~4.4 KB gzipped per page.

Blog mobile rules live in `blog.css`, not `mobile.css`, because Astro emits `blog.css`
*after* the layout's `mobile.css` on blog routes.

### Framework gotchas that cost real time

- `compressHTML: false` is deliberate — Astro's whitespace stripping removed a meaningful
  inline-block space and shifted buttons 2px.
- Component props are raw strings. Pass them as JS expressions (`JSON.stringify`), not
  HTML attributes, or entities double-escape (`&amp;quot;`).
- `rem` resolves against the 16px root, not `body`'s 17px — `.9rem` is 14.4px.
- Grid/flex children default to `min-width:auto`, which lets wide content force
  horizontal scroll. `min-width:0` where tracks must shrink.
- The brand lockup is **inlined**, never `<img>` — its wordmark is `<text>` in Archivo,
  and an `<img>`-loaded SVG cannot see page webfonts.

## Content pipelines

```bash
node tools/prepare-images.mjs "<dir1>" "<dir2>"   # -> public/images (AVIF/WebP/JPEG)
node tools/prepare-brand.mjs                      # -> OG card, logo raster, app icons
node tools/port-reference.mjs <reference-dir>     # -> the 30 pages
```

`tools/image-map.json` maps slot id → source file. Repeated slot ids (the client-logo row)
are keyed `LOGO#2`, `LOGO#3`, … in document order. Image sizes come from each slot's
published pixel spec, so photos cannot shift the layout.

## The blog

`src/lib/wp.ts` queries WPGraphQL at build time. `WP_GRAPHQL_ENDPOINT` has a working
default, so no configuration is needed.

**A CMS problem must never break the build.** Every fetch error is caught, logged loudly,
and falls back to an empty blog so the 30 marketing pages still ship with exit code 0.
Keep it that way, and re-test the failure path after touching this file.

Only `seo.title` and `seo.metaDesc` are consumed. Never consume `seo.canonical` (points at
the CMS host) or `seo.metaRobotsNoindex` (reflects the CMS's own site-wide noindex — it
would put `noindex` on every published post).

## Verification

There are no unit tests. Instead:

- **Fidelity** — diff computed styles and bounding boxes element-by-element against
  `~/Downloads/qualis-deploy-hostinger` at 1440/1280/1024/768px. Zero unexpected
  differences is the bar. Never trust a screenshot for this.
- **Content** — diff text, titles and JSON-LD per page; count prices, checklist codes
  (C-01→C-10, V-01→V-10, L-01→L-12, A-01→A-08), FAQ entries and image slots.
- **Mobile** — 320/375/430px: no horizontal scroll, no sub-16px body copy, no
  under-44px standalone tap targets.
- **Lighthouse (mobile)** — current bar is performance 97–100, accessibility 100,
  best practices 100, SEO 100, CLS 0. Do not regress it.

Re-run fidelity and mobile checks after any change to layouts, components, fonts or
config — those are what silently break the port.

## Ground rules from the owner

- Reproduce the original design faithfully; do not restyle without asking.
- Preserve copy and prices verbatim: PSI $249, Verification $299, Audit $449, CLS $269,
  DUPRO $249, Monitoring from $199, Protected Container $449, First Order Shield $649.
- Do not invent content, images, names or findings.
- Ask before anything touching the live domain, DNS, email or third-party accounts.
