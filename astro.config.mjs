import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://martinfrackerjr.com',
  trailingSlash: 'always',
  // The Caddyfile CSP allows only same-origin stylesheets, so never inline them.
  build: { inlineStylesheets: 'never' },
});
