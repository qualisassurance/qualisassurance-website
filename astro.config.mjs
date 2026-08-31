// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  integrations: [sitemap()],
});
