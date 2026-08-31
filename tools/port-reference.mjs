/**
 * port-reference.mjs — deterministic port of the 30 static reference pages into Astro.
 *
 * Content is carried across verbatim: the <main> of each reference page becomes the
 * body of an .astro page, with head metadata lifted into BaseLayout props. Nothing
 * is retyped, so copy, prices and checklist codes cannot drift.
 *
 *   node tools/port-reference.mjs <reference-dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseRules, effective, selectorOf, bodyOf } from './lib-css.mjs';

const REF = process.argv[2];
if (!REF) throw new Error('usage: node tools/port-reference.mjs <reference-dir>');
const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES = path.join(ROOT, 'src/pages');

/* ---------------------------------------------------------------- helpers */
const read = (p) => fs.readFileSync(p, 'utf8');
const between = (s, a, b) => {
  const i = s.indexOf(a); if (i < 0) return null;
  const j = s.indexOf(b, i + a.length); if (j < 0) return null;
  return s.slice(i + a.length, j);
};
/** Decode HTML entities. `&amp;` must go last or `&amp;lt;` would decode twice. */
const decodeAttr = (s) => s
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, '\u00a0')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Read a <meta>/<link> value regardless of attribute order. */
function metaContent(html, matcher) {
  const re = /<(meta|link)\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = {};
    for (const a of m[2].matchAll(/([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1].toLowerCase()] = a[2];
    const hit = matcher(attrs);
    if (hit) return decodeAttr(hit);
  }
  return null;
}

/* ------------------------------------------------------- reference inventory */
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(REF);
files.sort();

/* global.css is wrapped in `@layer base { … }`; strip the wrapper so the rules
   inside can be compared against each page's own stylesheet. */
const globalSrc = read(path.join(ROOT, 'src/styles/global.css'))
  .replace(/@layer[^;{]*;/, '')
  .replace(/@layer\s+base\s*\{/, '')
  .replace(/\}\s*$/, '');
const globalRules = new Set(parseRules(globalSrc));
const globalEff = effective([...globalRules]);

/** The header CTA is tailored on 6 pages ("Book a PSI", "Book in Jodhpur"…). */
function headerCta(html) {
  const header = between(html, '<header>', '</header>') ?? '';
  const m = header.match(/<a class="btn btn-solid" href="([^"]*)">([\s\S]*?)<\/a>/);
  return m ? { href: m[1], label: m[2].trim() } : null;
}

/* nav variant is decided by the Clusters link + presence of an FAQ item */
function navVariant(html) {
  const ul = between(html, '<ul class="nav-links"', '</ul>') ?? '';
  if (ul.includes('href="#clusters"')) return 'home';
  if (ul.includes('href="/#clusters"')) return 'service';
  return 'inner';
}

/* -------------------------------------------------- image placeholder rewrite */
const PH_RE =
  /<(div|figure) class="ph">\s*<div class="ph-spec">\s*<b>([\s\S]*?)<\/b>\s*(?:<span>([\s\S]*?)<\/span>)?\s*<\/div>\s*(?:<span class="anno"(?:\s+style="([^"]*)")?>([\s\S]*?)<\/span>\s*)?<\/\1>/g;

/* Emit props as JS expressions, not HTML attributes. Caption text contains raw
   double quotes; as an attribute they would need &quot;, which Astro passes
   through as a literal string and then escapes again on render (&amp;quot;). */
const attr = (v) => `{${JSON.stringify(String(v))}}`;

/* Real photography, keyed by slot id. Produced by tools/prepare-images.mjs; absent
   until that has been run, in which case every slot stays a placeholder. */
const imageManifestPath = path.join(ROOT, 'tools/image-manifest.json');
const IMAGES = fs.existsSync(imageManifestPath) ? JSON.parse(read(imageManifestPath)) : {};

/* The one above-the-fold image per page, loaded eagerly so it is not deprioritised
   as the LCP element. Everything else stays lazy. */
const HERO_SLOTS = new Set([
  'IMG-01', 'IMG-PSI-01', 'IMG-SV-01', 'IMG-CLS-01', 'IMG-JDH-01', 'IMG-FA-01',
]);

function toImageSlots(main, stats) {
  const total = (main.match(/<(?:div|figure) class="ph">/g) || []).length;
  let matched = 0;
  /* Repeated ids (the client-logo row) are addressed ID#2, ID#3, … in document
     order, matching the keys in image-map.json. */
  const seen = new Map();
  const out = main.replace(PH_RE, (_all, tag, label, desc, annoStyle, anno) => {
    matched++;
    const clean = (s) => decodeAttr((s ?? '').replace(/\s+/g, ' ').trim());
    const full = clean(label);
    const sep = full.indexOf(' · ');
    const id = sep < 0 ? full : full.slice(0, sep);
    const spec = sep < 0 ? null : full.slice(sep + 3);
    const parts = [`id=${attr(id)}`];
    if (spec) parts.push(`spec=${attr(spec)}`);
    if (clean(desc)) parts.push(`desc=${attr(clean(desc))}`);
    if (clean(anno)) parts.push(`anno=${attr(clean(anno))}`);
    if (annoStyle) parts.push(`annoStyle=${attr(annoStyle)}`);
    if (tag !== 'div') parts.push(`as=${attr(tag)}`);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    const img = IMAGES[n === 1 ? id : `${id}#${n}`];
    if (img) {
      stats.withPhoto++;
      parts.push(`src=${attr(img.src)}`, `width={${img.width}}`, `height={${img.height}}`);
      if (HERO_SLOTS.has(id)) parts.push('eager');
    }
    return `<ImageSlot ${parts.join(' ')} />`;
  });
  stats.phTotal += total;
  stats.phMatched += matched;
  if (total !== matched) stats.phUnmatched.push(`${stats.current}: ${total - matched} of ${total}`);
  return out;
}

/* ------------------------------------------------- responsive data tables */
/**
 * Copy each column's <th> text onto the <td>s beneath it as data-label.
 * Below 760px the mobile layer hides the header row and renders these labels
 * beside each value, so a wide checklist becomes a readable stack of cards
 * instead of a table scrolled off-screen. Desktop keeps the real <table>.
 * Purely additive: adding an attribute cannot change desktop rendering.
 */
function labelTableCells(main, stats) {
  return main.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (table) => {
    const head = table.match(/<thead>[\s\S]*?<\/thead>/);
    if (!head) return table;
    const headers = [...head[0].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((m) =>
      decodeAttr(
        m[1]
          .replace(/<small\b[\s\S]*?<\/small>/gi, '')  // drop the sub-label; too long for a mobile row label
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
    );
    if (!headers.length) return table;
    stats.tables++;
    const bodyStart = table.indexOf('<tbody>');
    if (bodyStart < 0) return table;
    const before = table.slice(0, bodyStart);
    const body = table.slice(bodyStart).replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, (row) => {
      let i = 0;
      return row.replace(/<td(\s[^>]*)?>/g, (tag, attrs) => {
        const label = headers[i++] ?? '';
        if (!label) return tag;                       // e.g. the .cmp table's blank corner cell
        stats.cells++;
        return `<td${attrs ?? ''} data-label="${label.replace(/"/g, '&quot;')}">`;
      });
    });
    return before + body;
  });
}


/* --------------------------------------------------------------- page styles */
/**
 * Each reference page ships one self-contained <style> block. Splitting it into
 * "shared" + "page overrides" reorders rules relative to each other and changes
 * the cascade (a page's own `.btn` would start beating the base `.nav .btn`, a
 * design-layer `.sec-head{align-items:flex-end}` would stop winning, and so on).
 * So we never split: a page either uses the shared stylesheet verbatim, or it
 * gets its own complete one. That makes the port correct by construction.
 */
/**
 * Two agreed departures from the reference, appended to every generated page
 * stylesheet so a re-port cannot silently revert them. Both are defect fixes,
 * not restyling — see the comment text for the reasoning.
 */
const OWNER_FIXES = `
/* --- ACCESSIBILITY + CONSISTENCY FIXES (agreed with the owner, 2026-09-01) ----
   1. --g500 was #8A8880, which is 3.28:1 on the paper background where WCAG AA
      needs 4.5:1. #737169 is the lightest value that passes (4.52:1). It is the
      only accessibility failure Lighthouse reports anywhere on the site.
   2. .mono was defined on only 7 of the 30 reference pages, so the shared
      footer tagline rendered in JetBrains Mono on those and in Inter on the
      other 23. The markup always said class="mono"; this makes it true. */
:root{--g500:#737169}
.mono{font-family:'JetBrains Mono',monospace;font-size:.78rem;letter-spacing:.04em}
`;

const IMAGE_SLOT_RUNTIME = `
/* --- IMAGE SLOT RUNTIME ---------------------------------------------------
   Applies only once a real photo is supplied to <ImageSlot src="…">. While
   every slot is still a placeholder these rules match nothing. */
.ph.has-img{background:none;border:none}
.ph>picture{display:block;width:100%;height:100%}
.ph img{display:block;width:100%;height:100%;object-fit:cover}
`;

/**
 * True when global.css already produces everything this page's stylesheet does.
 * Byte-identity is too strict: global.css legitimately adds two custom properties
 * to :root that the reference references but never declares. At-rules must match
 * exactly, since their internals are not compared declaration-by-declaration.
 */
/* Declarations global.css deliberately overrides (see OWNER_FIXES). A page whose
   only mismatch is one of these is still fully covered by global.css — without
   this, the --g500 contrast fix would push all 30 pages onto private stylesheets
   and lose the shared, cacheable one. */
const INTENTIONAL_OVERRIDES = new Set([':root|--g500']);

function usesGlobal(pageStyle) {
  return parseRules(pageStyle).every((r) => {
    if (globalRules.has(r)) return true;
    const sel = selectorOf(r);
    if (sel.startsWith('@')) return false;
    const g = globalEff.get(sel);
    if (!g) return false;
    return bodyOf(r).split(';').every((d) => {
      const i = d.indexOf(':');
      if (i < 0) return true;
      const prop = d.slice(0, i).trim();
      if (INTENTIONAL_OVERRIDES.has(`${sel}|${prop}`)) return true;
      return g.get(prop) === d.slice(i + 1).trim();
    });
  });
}

function slugFor(urlPath) {
  const s = urlPath.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return s === '' ? 'home' : s;
}

/* ------------------------------------------------------ section rewrites */
/**
 * Two sections in the reference are built around photography the owner has
 * decided not to shoot (three inspector portraits and a founder portrait), and
 * the team cards also still carry unfilled copy — literal "[Inspector name]"
 * and "Specialty, years, standards trained on.". Both are rewritten here rather
 * than by hand so a re-port cannot bring the placeholders back.
 *
 * Every factual claim below is carried over from the reference or from
 * llms.txt; nothing about the team is invented. The two unnamed inspectors are
 * represented by the clusters they cover, not by made-up names.
 */
const SECTION_REWRITES = {
  '/': [
    {
      // the whole "Your inspectors, by name" section
      find: /<section aria-labelledby="h-team">[\s\S]*?<\/section>/,
      replace: `<section aria-labelledby="h-team">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="eyebrow">People</span><h2 id="h-team">Who signs your report</h2></div>
      <p>No anonymous freelancers. The person who signs your report is the person who stood in the factory.</p>
    </div>
    <div class="signoff rv">
      <div class="signoff-lead">
        <span class="mono">REPORT SIGNATORY</span>
        <h3>Yogesh Raygoor</h3>
        <p class="signoff-role">Founder &amp; lead inspector · Jodhpur</p>
        <p>In the Jodhpur furniture trade since before Qualis existed. Solid wood, finishes, and the factories behind them.</p>
      </div>
      <ul class="signoff-facts">
        <li><b>Named on the report</b><span>Not a company stamp. You know who inspected your order.</span></li>
        <li><b>Same person on the call</b><span>The inspector who walked the floor talks you through the findings.</span></li>
        <li><b>Charter-bound</b><span>Buyer-paid under the Independence Charter — never paid by the factory.</span></li>
      </ul>
    </div>
    <div class="signoff-foot rv">
      <span class="mono">ON THE GROUND</span>
      <p>Inspectors working across <a href="/clusters/jodhpur/">Jodhpur</a>, <a href="/clusters/jaipur/">Jaipur</a>, <a href="/clusters/saharanpur/">Saharanpur</a>, <a href="/clusters/moradabad/">Moradabad</a>, <a href="/clusters/delhi-ncr/">Delhi NCR</a> and <a href="/clusters/kolkata/">Kolkata</a>.</p>
    </div>
  </div>
</section>`,
    },
  ],
  '/why-independent/': [
    {
      // drop the founder portrait; keep every word, restyled as a signed statement
      find: /<div class="wrap founder">[\s\S]*?<figure class="rv">[\s\S]*?<\/figure>/,
      replace: `<div class="wrap founder founder-statement">`,
    },
    {
      // the removed figcaption carried the attribution; reinstate it as a
      // signature strip under the quote, in the same ink/mono language
      find: /<\/blockquote>/,
      replace: `</blockquote>
      <div class="sig"><em>FOUNDER</em><span>YOGESH RAYGOOR · JODHPUR</span></div>`,
    },
  ],
};

function rewriteSections(main, urlPath, problems) {
  for (const rule of SECTION_REWRITES[urlPath] ?? []) {
    if (!rule.find.test(main)) { problems.push(`${urlPath}: section rewrite did not match — the reference markup changed`); continue; }
    main = main.replace(rule.find, rule.replace);
  }
  return main;
}

/* Page-specific CSS for the rewritten sections, appended to that page's own
   stylesheet. Uses only existing design tokens. */
const PAGE_EXTRA_CSS = {
  home: `
/* --- "Who signs your report" — replaces the three portrait cards ---------- */
.signoff{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--rule);border:1px solid var(--rule)}
.signoff-lead{background:#fff;padding:30px 28px}
.signoff-lead .mono{display:block;color:var(--g500);margin-bottom:14px}
.signoff-lead h3{font-size:1.45rem;margin-bottom:4px}
.signoff-lead .signoff-role{font-family:'JetBrains Mono',monospace;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--pass);margin-bottom:14px}
.signoff-lead p{font-size:.95rem;color:var(--g700)}
.signoff-facts{list-style:none;background:#fff;display:flex;flex-direction:column}
.signoff-facts li{padding:20px 28px;border-bottom:1px dashed var(--rule)}
.signoff-facts li:last-child{border-bottom:none}
.signoff-facts b{font-family:'Inter Tight',sans-serif;font-size:1rem;display:block;margin-bottom:4px}
.signoff-facts span{font-size:.9rem;color:var(--g700)}
.signoff-foot{border:1px solid var(--rule);border-top:none;background:var(--paper);padding:18px 28px;display:flex;gap:18px;align-items:baseline;flex-wrap:wrap}
.signoff-foot .mono{color:var(--g500);white-space:nowrap}
.signoff-foot p{font-size:.95rem;color:var(--g700)}
.signoff-foot a{color:var(--pass);text-decoration:none;border-bottom:1px solid var(--pass-tint)}
.signoff-foot a:hover{border-bottom-color:var(--pass)}
@media (max-width:760px){
  .signoff{grid-template-columns:1fr}
  .signoff-lead,.signoff-facts li,.signoff-foot{padding-left:22px;padding-right:22px}
  .signoff-foot{flex-direction:column;gap:8px}
  /* same 16px body-copy floor the rest of the mobile layer enforces */
  .signoff-lead p,.signoff-facts span,.signoff-foot p{font-size:1rem;line-height:1.6}
}
`,
  'why-independent': `
/* --- founder statement — replaces the portrait + text split -------------- */
.founder-statement{display:block;max-width:820px}
.founder-statement blockquote{font-size:clamp(1.3rem,2.6vw,1.7rem);border-left:3px solid var(--pass);padding-left:22px}
.founder-statement .sig{display:inline-flex;gap:12px;align-items:baseline;background:var(--ink);color:var(--g300);font-family:'JetBrains Mono',monospace;font-size:.65rem;letter-spacing:.08em;padding:8px 14px;text-transform:uppercase;margin:0 0 26px}
.founder-statement .sig em{font-style:normal;color:var(--pass-tint)}
`,
};

/* ------------------------------------------------------------------- convert */
/* Remove only what THIS tool generated last time, listed in the previous
   manifest. Never blanket-delete src/pages: hand-written routes (the whole
   /blog tree) live alongside the generated ones. Stale per-page stylesheets are
   swept too, so a page that stops needing one does not leave an orphan behind. */
const manifestPath = path.join(ROOT, 'tools/port-manifest.json');
if (fs.existsSync(manifestPath)) {
  for (const entry of JSON.parse(read(manifestPath))) {
    const f = path.join(PAGES, entry.url.replace(/^\//, ''), 'index.astro');
    if (fs.existsSync(f)) fs.rmSync(f);
    if (entry.stylesheet && entry.stylesheet.startsWith('styles/pages/')) {
      const css = path.join(ROOT, 'src', entry.stylesheet);
      if (fs.existsSync(css)) fs.rmSync(css);
    }
  }
}

const stats = { phTotal: 0, phMatched: 0, phUnmatched: [], current: '', pages: 0, withCss: 0, tables: 0, cells: 0, withPhoto: 0 };
const problems = [];
const manifest = [];

for (const file of files) {
  const html = read(file);
  const rel = path.relative(REF, file).replace(/index\.html$/, '');
  const urlPath = '/' + rel;
  stats.current = urlPath;

  const title = decodeAttr(between(html, '<title>', '</title>') ?? '');
  const description = metaContent(html, (a) => (a.name === 'description' ? a.content : null)) ?? '';
  const canonical = metaContent(html, (a) => (a.rel === 'canonical' ? a.href : null)) ?? '';
  const ogTitle = metaContent(html, (a) => (a.property === 'og:title' ? a.content : null));
  const ogDescription = metaContent(html, (a) => (a.property === 'og:description' ? a.content : null));

  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try { return JSON.parse(m[1]); }
      catch (e) { problems.push(`${urlPath}: invalid JSON-LD (${e.message})`); return null; }
    })
    .filter(Boolean);

  let main = between(html, '<main>', '</main>');
  if (main == null) { problems.push(`${urlPath}: no <main>`); continue; }
  main = rewriteSections(main, urlPath, problems);
  main = labelTableCells(main, stats);
  main = toImageSlots(main, stats);
  const usesImageSlot = main.includes('<ImageSlot');

  const style = between(html, '<style>', '</style>') ?? '';
  const shared = usesGlobal(style);
  let styleImport;
  if (shared) {
    styleImport = 'styles/global.css';
  } else {
    const slug = slugFor(urlPath);
    styleImport = `styles/pages/${slug}.css`;
    const header =
      `/* ${urlPath} — verbatim stylesheet from the static reference.\n` +
      `   Self-contained on purpose: see BaseLayout.astro for why pages are not\n` +
      `   split into shared + override sheets. Do not edit by hand; regenerate\n` +
      `   with: node tools/port-reference.mjs <reference-dir> */\n`;
    fs.mkdirSync(path.join(ROOT, 'src/styles/pages'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'src/styles/pages', `${slug}.css`), header + style.trim() + '\n' + IMAGE_SLOT_RUNTIME + OWNER_FIXES + (PAGE_EXTRA_CSS[slug] ?? ''));
    stats.withCss++;
  }

  const outDir = path.join(PAGES, rel);
  // from src/pages/<rel>index.astro, climb out of <rel> and then out of pages/
  const depth = rel === '' ? 0 : rel.replace(/\/$/, '').split('/').length;
  const up = '../'.repeat(depth + 1);

  const imports = [`import BaseLayout from '${up}layouts/BaseLayout.astro';`];
  if (usesImageSlot) imports.push(`import ImageSlot from '${up}components/ImageSlot.astro';`);
  imports.push(`import '${up}${styleImport}';`);

  const variant = navVariant(html);
  const cta = headerCta(html);
  if (!cta) problems.push(`${urlPath}: no header CTA found`);
  const props = [
    `title={title}`, `description={description}`, `canonical={canonical}`,
    `jsonld={jsonld}`, `navVariant="${variant}"`,
  ];
  // only pass CTA props where the page differs from the component default
  const defHref = variant === 'home' ? '#book' : '/#book';
  if (cta && cta.label !== 'Book an inspection') props.push(`ctaLabel=${attr(cta.label)}`);
  if (cta && cta.href !== defHref) props.push(`ctaHref=${attr(cta.href)}`);
  if (ogTitle && ogTitle !== title) props.push('ogTitle={ogTitle}');
  if (ogDescription && ogDescription !== description) props.push('ogDescription={ogDescription}');

  const fm = [
    '---',
    ...imports,
    '',
    `const title = ${JSON.stringify(title)};`,
    `const description = ${JSON.stringify(description)};`,
    `const canonical = ${JSON.stringify(canonical)};`,
    ...(ogTitle && ogTitle !== title ? [`const ogTitle = ${JSON.stringify(ogTitle)};`] : []),
    ...(ogDescription && ogDescription !== description ? [`const ogDescription = ${JSON.stringify(ogDescription)};`] : []),
    `const jsonld = ${JSON.stringify(jsonld, null, 2)};`,
    '---',
  ].join('\n');

  const body = `<BaseLayout ${props.join(' ')}>\n${main.trim()}\n</BaseLayout>\n`;
  const styleBlock = '';

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.astro'), `${fm}\n${body}${styleBlock}`);
  stats.pages++;
  manifest.push({ url: urlPath, title, jsonld: jsonld.length, stylesheet: styleImport, imageSlots: (main.match(/<ImageSlot/g) || []).length });
}

/* -------------------------------------------------------------------- report */
console.log(`pages written      : ${stats.pages}`);
console.log(`own stylesheet    : ${stats.withCss}  (rest share styles/global.css)`);
console.log(`image slots        : ${stats.phMatched}/${stats.phTotal} converted to <ImageSlot>`);
console.log(`responsive tables  : ${stats.tables} tables, ${stats.cells} cells labelled`);
console.log(`with photography   : ${stats.withPhoto}/${stats.phMatched} slots (rest still placeholders)`);
if (stats.phUnmatched.length) console.log('  unmatched:', stats.phUnmatched.join('; '));
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`);
  problems.forEach((p) => console.log('  ' + p));
  process.exitCode = 1;
} else {
  console.log('\nno problems.');
}
fs.writeFileSync(path.join(ROOT, 'tools/port-manifest.json'), JSON.stringify(manifest, null, 2));
