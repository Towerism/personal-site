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

// Expected values come from the content files, so a wording edit never fails the build.
const frontmatter = async (name) => {
  const md = await readFile(join(root, 'content', `${name}.md`), 'utf8');
  return (field) => md.match(new RegExp(`^${field}: (.*)$`, 'm'))[1];
};

const routes = [
  ['home', 'index.html', 'https://example.test/'],
  ['about', 'about/index.html', 'https://example.test/about/'],
  ['home-network', 'home-network/index.html', 'https://example.test/home-network/'],
  ['404', '404.html', null],
];

for (const [name, path, canonical] of routes) {
  test(`${path} renders content/${name}.md`, async () => {
    const [html, field] = await Promise.all([page(path), frontmatter(name)]);
    assert.match(html, new RegExp(`<title>${field('title')}`));
    assert.ok(html.includes(`<meta name="description" content="${field('description')}"`));
    assert.match(html, /<article class="prose"><h1 id="[^"]+">\S/);
    if (canonical) assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`));
    else assert.doesNotMatch(html, /rel="canonical"/);
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
