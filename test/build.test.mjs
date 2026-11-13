import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';

const root = fileURLToPath(new URL('..', import.meta.url));
let outDir;
const page = (path) => readFile(join(outDir, path), 'utf8');

before(async () => {
  // Inside the project: Astro moves files into outDir with rename(), which fails across filesystems.
  await mkdir(join(root, '.astro'), { recursive: true });
  outDir = await mkdtemp(join(root, '.astro', 'test-dist-'));
  process.env.SITE_URL = 'https://example.test';
  await build({ root, outDir, logLevel: 'error' });
});

after(() => rm(outDir, { recursive: true, force: true }));

const routes = [
  ['index.html', 'Martin Fracker, Jr.', 'https://example.test/', 'Hi, I’m Martin'],
  ['about/index.html', 'About me', 'https://example.test/about/', 'Joyent'],
  ['home-network/index.html', 'Home network', 'https://example.test/home-network/', 'Vaultwarden'],
  ['404.html', 'Page not found', null, 'interdimensional nanobots'],
];

for (const [path, title, canonical, text] of routes) {
  test(`${path} renders its content page`, async () => {
    const html = await page(path);
    assert.match(html, new RegExp(`<title>${title}`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.ok(html.includes(text), `body text "${text}" missing`);
    if (canonical) assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
  });

  // The Caddyfile CSP allows only same-origin scripts and styles.
  test(`${path} has no inline script or style`, async () => {
    const html = await page(path);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/);
    assert.doesNotMatch(html, /<style/);
    assert.doesNotMatch(html, /\sstyle=/);
  });
}

test('nav marks the current page', async () => {
  assert.match(await page('about/index.html'), /<a href="\/about\/" aria-current="page"/);
  assert.doesNotMatch(await page('about/index.html'), /<a href="\/" aria-current="page"/);
});

test('stylesheets and fonts are emitted under /_astro/', async () => {
  const files = await readdir(join(outDir, '_astro'));
  assert.ok(files.some((f) => f.endsWith('.css')));
  assert.ok(files.some((f) => f.endsWith('.woff2')));
});
