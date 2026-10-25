import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from '../build.mjs';
import { fixtureContent, listFiles, page, root, siteUrl, tempDir, writeFiles } from './helpers.mjs';

async function fixture(overrides = {}) {
  const contentDir = await tempDir();
  const outDir = join(await tempDir(), 'dist');
  await writeFiles(contentDir, { ...fixtureContent, ...overrides });
  return { contentDir, srcDir: root, outDir, siteUrl };
}

const generated = [
  '404.html',
  'about/index.html',
  'assets/graph.json',
  'home-network/index.html',
  'index.html',
  'robots.txt',
  'sitemap.xml',
];

const isHashed = (file) => /^(css\/[^/]+\.css|js\/[^/]+\.js)$/.test(file);
const hashedName = (file) => file.replace(/\.(css|js)$/, '.[0-9a-f]{8}.$1').replaceAll('/', '\\/');

test('outputs exactly the pages, sitemap, robots, graph data and public assets, with CSS and JS hashed', async () => {
  const opts = await fixture();
  await build(opts);
  const publicFiles = await listFiles(join(root, 'public'));
  const out = await listFiles(opts.outDir);
  const plain = publicFiles.filter((f) => !isHashed(f));
  const hashed = publicFiles.filter(isHashed);
  assert.ok(
    hashed.includes('css/site.css') && hashed.includes('js/main.js'),
    'CSS and JS are hashed',
  );
  for (const file of hashed) {
    assert.equal(out.filter((f) => new RegExp(`^${hashedName(file)}$`).test(f)).length, 1, file);
  }
  assert.deepEqual(
    out.filter((f) => !/\.[0-9a-f]{8}\.(css|js)$/.test(f)),
    [...generated, ...plain].sort(),
  );
});

test('unhashed public assets and the stylesheet are copied byte for byte', async () => {
  const opts = await fixture();
  await build(opts);
  const out = await listFiles(opts.outDir);
  for (const file of await listFiles(join(root, 'public'))) {
    if (isHashed(file) && file.endsWith('.js')) continue;
    const target = isHashed(file)
      ? out.find((f) => new RegExp(`^${hashedName(file)}$`).test(f))
      : file;
    const [a, b] = await Promise.all([
      readFile(join(root, 'public', file)),
      readFile(join(opts.outDir, target)),
    ]);
    assert.ok(a.equals(b), `${file} differs`);
  }
});

test('pages and modules reference the hashed asset names, and the originals are gone', async () => {
  const opts = await fixture();
  await build(opts);
  const out = await listFiles(opts.outDir);
  const html = await readFile(join(opts.outDir, 'index.html'), 'utf8');
  for (const [, ref] of html.matchAll(/(?:href|src)="(\/(?:css|js)\/[^"]+)"/g)) {
    assert.match(ref, /\.[0-9a-f]{8}\.(css|js)$/, ref);
    assert.ok(out.includes(ref.slice(1)), ref);
  }
  assert.ok(!out.includes('css/site.css') && !out.includes('js/main.js'));
  for (const file of out.filter((f) => f.endsWith('.js'))) {
    const source = await readFile(join(opts.outDir, file), 'utf8');
    for (const [, spec] of source.matchAll(/(?:from|import)\s*\(?\s*['"]\.\/([^'"]+)['"]/g)) {
      assert.match(spec, /\.[0-9a-f]{8}\.js$/, `${file} -> ${spec}`);
      assert.ok(out.includes(`js/${spec}`), `${file} -> ${spec}`);
    }
  }
});

test('the output directory is cleaned before building', async () => {
  const opts = await fixture();
  await writeFiles(opts.outDir, { 'stale.html': 'old', 'old/index.html': 'old' });
  await build(opts);
  const files = await listFiles(opts.outDir);
  assert.ok(!files.includes('stale.html') && !files.includes('old/index.html'));
});

test('building twice gives identical output', async () => {
  const opts = await fixture();
  await build(opts);
  const first = await snapshot(opts.outDir);
  await build(opts);
  assert.deepEqual(await snapshot(opts.outDir), first);
});

async function snapshot(dir) {
  const out = {};
  for (const f of await listFiles(dir)) out[f] = await readFile(join(dir, f), 'utf8');
  return out;
}

for (const field of ['title', 'description']) {
  test(`a page missing ${field} fails the build and names the file`, async () => {
    const fm = field === 'title' ? 'description: D' : 'title: T';
    const opts = await fixture({ 'about.md': `---\n${fm}\n---\n# About\n` });
    await assert.rejects(
      build(opts),
      (err) => err.message.includes('about.md') && err.message.includes(field),
    );
  });
}

test('404.html is at the root and marked noindex; other pages are not', async () => {
  const opts = await fixture();
  await build(opts);
  assert.match(
    await readFile(join(opts.outDir, '404.html'), 'utf8'),
    /<meta name="robots" content="noindex">/,
  );
  assert.doesNotMatch(await readFile(join(opts.outDir, 'about/index.html'), 'utf8'), /noindex/);
});

test('sitemap is well-formed XML listing absolute URLs of indexable pages only', async () => {
  const opts = await fixture();
  await build(opts);
  const xml = await readFile(join(opts.outDir, 'sitemap.xml'), 'utf8');
  assert.match(
    xml,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
  );
  assertBalanced(xml);
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs.sort(), [`${siteUrl}/`, `${siteUrl}/about/`, `${siteUrl}/home-network/`]);
});

// Minimal well-formedness check: every open tag is closed in order.
function assertBalanced(xml) {
  const stack = [];
  for (const [, close, name, selfClose] of xml
    .replace(/^<\?xml[^>]*\?>/, '')
    .matchAll(/<(\/?)([\w:-]+)[^>]*?(\/?)>/g)) {
    if (selfClose) continue;
    if (close) assert.equal(stack.pop(), name, `unexpected </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], 'unclosed tags');
}

test('robots.txt allows crawling and points at the absolute sitemap URL', async () => {
  const opts = await fixture();
  await build(opts);
  const robots = await readFile(join(opts.outDir, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${siteUrl}/sitemap\\.xml$`, 'm'));
});

test('a trailing slash on the site URL does not double up', async () => {
  const opts = await fixture();
  await build({ ...opts, siteUrl: `${siteUrl}/` });
  const html = await readFile(join(opts.outDir, 'about/index.html'), 'utf8');
  assert.match(html, new RegExp(`<link rel="canonical" href="${siteUrl}/about/">`));
});

test('a link to a missing page fails the build naming source and target', async () => {
  const opts = await fixture({ 'about.md': page('About', 'D', '# About\n\n[Gone](/nowhere/)') });
  await assert.rejects(
    build(opts),
    (err) => err.message.includes('/about/') && err.message.includes('/nowhere/'),
  );
});

test('a link to a missing fragment fails the build naming source and target', async () => {
  const opts = await fixture({
    'home.md': page('Home', 'D', '# Home\n\n[Nope](/home-network/#nope)'),
  });
  await assert.rejects(
    build(opts),
    (err) => err.message.includes('/home-network/#nope') && /from \//.test(err.message),
  );
});

test('a link with a malformed % escape is reported as broken, naming the source page', async () => {
  const opts = await fixture({
    'about.md': page('About', 'D', '# About\n\n[Bad](/bad%zz/) and [frag](/#%E0%A4%A)'),
  });
  await assert.rejects(build(opts), (err) => {
    assert.match(err.message, /^Broken links:/);
    assert.match(err.message, /from \/about\/ to \/bad%zz\//);
    assert.match(err.message, /from \/about\/ to \/#%E0%A4%A/);
    return true;
  });
});

test('the page name is escaped in the body class and the crumb', async () => {
  const opts = await fixture({ 'odd"<name>.md': page('Odd', 'D', '# Odd') });
  await build(opts);
  const html = await readFile(join(opts.outDir, 'odd"<name>/index.html'), 'utf8');
  assert.match(html, /<body class="page-odd&quot;&lt;name&gt;">/);
  assert.match(html, /<p class="crumb" aria-hidden="true">~\/odd&quot;&lt;name&gt;<\/p>/);
});

test('external links are not checked', async () => {
  const opts = await fixture({
    'about.md': page('About', 'D', '# About\n\n[x](https://does-not-exist.invalid/page#frag)'),
  });
  await build(opts);
});

test('graph.json has a node per service, the site as hub, and a link from hub to each', async () => {
  const opts = await fixture();
  await build(opts);
  const graph = JSON.parse(await readFile(join(opts.outDir, 'assets/graph.json'), 'utf8'));
  assert.deepEqual(graph.nodes, [
    { id: 'personal-website', label: 'Personal website', summary: 'This site.', hub: true },
    { id: 'caddy', label: 'Caddy', summary: 'Reverse proxy server.' },
    { id: 'plex', label: 'Plex', summary: 'Media streaming server.' },
  ]);
  assert.deepEqual(graph.links, [
    { source: 'personal-website', target: 'caddy' },
    { source: 'personal-website', target: 'plex' },
  ]);
});

test('without a personal website service, a site hub node is added', async () => {
  const opts = await fixture({
    'home-network.md': page('Net', 'D', '# Net\n\n## Services\n\n### Caddy\n\nProxy.'),
  });
  await build(opts);
  const graph = JSON.parse(await readFile(join(opts.outDir, 'assets/graph.json'), 'utf8'));
  assert.equal(graph.nodes[0].hub, true);
  assert.equal(graph.nodes[0].id, 'site');
  assert.deepEqual(graph.links, [{ source: 'site', target: 'caddy' }]);
});

test('the home page carries the graph canvas, hidden from assistive tech, with a text description', async () => {
  const opts = await fixture();
  await build(opts);
  const html = await readFile(join(opts.outDir, 'index.html'), 'utf8');
  assert.match(html, /<canvas[^>]*aria-hidden="true"/);
  assert.match(html, /<figcaption[^>]*>[^]*Personal website[^]*Caddy[^]*Plex[^]*<\/figcaption>/);
});

test('the graph caption lists every service as a link to its card', async () => {
  const opts = await fixture();
  await build(opts);
  const html = await readFile(join(opts.outDir, 'index.html'), 'utf8');
  const legend = [
    ...html.matchAll(
      /<li><a href="\/home-network\/#([\w-]+)" data-node="([\w-]+)">([^<]+)<\/a><\/li>/g,
    ),
  ];
  assert.deepEqual(
    legend.map((m) => m[1]),
    ['personal-website', 'caddy', 'plex'],
  );
  assert.ok(legend.every((m) => m[1] === m[2]));
});

test('home ticker lines from frontmatter become a static status list after the h1', async () => {
  const home = page('Home', 'D', '# Hi there\n\nIntro text.').replace(
    '---\n#',
    'ticker: caddy: routing | plain <b>line</b>\n---\n#',
  );
  const opts = await fixture({ 'home.md': home });
  await build(opts);
  const html = await readFile(join(opts.outDir, 'index.html'), 'utf8');
  assert.ok(
    html.indexOf('</h1>') < html.indexOf('class="status"'),
    'status board follows the heading',
  );
  assert.match(html, /<li><span class="ticker-source">caddy<\/span> routing<\/li>/);
  assert.match(html, /<li>plain &lt;b&gt;line&lt;\/b&gt;<\/li>/);
  assert.match(html, /<dd>3<\/dd>/, 'service count');
});

test('the status board heading comes from the status frontmatter, escaped, with a default', async () => {
  const withTitle = page('Home', 'D', '# Hi').replace(
    '---\n#',
    'ticker: a | b\nstatus: lab <status> (mostly fiction)\n---\n#',
  );
  let opts = await fixture({ 'home.md': withTitle });
  await build(opts);
  assert.match(
    await readFile(join(opts.outDir, 'index.html'), 'utf8'),
    /<\/span>lab &lt;status&gt; \(mostly fiction\)<\/p>/,
  );
  opts = await fixture({
    'home.md': page('Home', 'D', '# Hi').replace('---\n#', 'ticker: a | b\n---\n#'),
  });
  await build(opts);
  assert.match(
    await readFile(join(opts.outDir, 'index.html'), 'utf8'),
    /<\/span>homelab status<\/p>/,
  );
});

test('without ticker lines the home page has no status board', async () => {
  const opts = await fixture();
  await build(opts);
  assert.doesNotMatch(await readFile(join(opts.outDir, 'index.html'), 'utf8'), /class="status"/);
});

test('each page names itself on body for page-specific styling', async () => {
  const opts = await fixture();
  await build(opts);
  assert.match(await readFile(join(opts.outDir, 'index.html'), 'utf8'), /<body class="page-home">/);
  assert.match(await readFile(join(opts.outDir, '404.html'), 'utf8'), /<body class="page-404">/);
});

test('service cards are static HTML on the network page', async () => {
  const opts = await fixture();
  await build(opts);
  const html = await readFile(join(opts.outDir, 'home-network/index.html'), 'utf8');
  assert.equal(html.match(/<article class="card/g).length, 3);
  assert.match(html, /id="caddy"/);
});

test('the build returns the page URLs it wrote', async () => {
  const opts = await fixture();
  const result = await build(opts);
  assert.deepEqual(result.pages.sort(), ['/', '/404.html', '/about/', '/home-network/']);
});

test('the content directory is never written to', async () => {
  const opts = await fixture();
  await writeFile(join(opts.contentDir, 'notes.txt'), 'ignored, not markdown');
  const before = await listFiles(opts.contentDir);
  await build(opts);
  assert.deepEqual(await listFiles(opts.contentDir), before);
});
