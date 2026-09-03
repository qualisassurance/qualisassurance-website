// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Organic pages served as static files from public/ (self-contained HTML, not
// Astro routes) — @astrojs/sitemap can't see them, so they're listed here.
// The /lp/* ad landing pages are deliberately NOT listed: they are noindex,
// paid-traffic-only, and twin the organic service pages.
const SITE = 'https://qualisinspections.com';
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

export default defineConfig({
  site: 'https://qualisinspections.com',
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
  integrations: [sitemap({ customPages: staticPublicPages })],
});
