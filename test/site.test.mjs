// Integration suite: builds the real content/ once and checks every page.
import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from '../build.mjs';
import { listFiles, root, siteUrl, tempDir } from './helpers.mjs';

const pages = {
  '/': 'index.html',
  '/about/': 'about/index.html',
  '/home-network/': 'home-network/index.html',
  '/404.html': '404.html',
};
let outDir;
const html = {};

before(async () => {
  outDir = join(await tempDir(), 'dist');
  await build({ contentDir: join(root, 'content'), srcDir: root, outDir, siteUrl });
  for (const [url, file] of Object.entries(pages))
    html[url] = await readFile(join(outDir, file), 'utf8');
});

// The owner edits home-network.md freely, so expectations come from it, not from a pinned list.
async function homeNetworkSource() {
  const md = await readFile(join(root, 'content/home-network.md'), 'utf8');
  const section = (name) =>
    md.split(new RegExp(`^## ${name}\\s*$`, 'm'))[1]?.split(/^## /m)[0] ?? '';
  return {
    hardware: [...section('Hardware').matchAll(/^- (.+)$/gm)].map((m) => m[1]),
    services: [...section('Services').matchAll(/^### (.+)$/gm)].map((m) => m[1]),
  };
}

const decode = (s) =>
  s.replace(
    /&(amp|lt|gt|quot|#39);/g,
    (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e],
  );
const attr = (doc, pattern) => doc.match(pattern)?.[1];
const count = (doc, pattern) => (doc.match(pattern) ?? []).length;

test('the real content builds to the expected page set', async () => {
  const files = await listFiles(outDir);
  for (const file of [...Object.values(pages), 'sitemap.xml', 'robots.txt', 'assets/graph.json']) {
    assert.ok(files.includes(file), `${file} missing`);
  }
  assert.equal(files.filter((f) => f.endsWith('.html')).length, 4);
});

test('every page has a unique title', () => {
  const titles = Object.values(html).map((doc) => attr(doc, /<title>([^<]*)<\/title>/));
  assert.equal(new Set(titles).size, titles.length, titles.join(' | '));
});

for (const url of Object.keys(pages)) {
  describe(`page ${url}`, () => {
    const doc = () => html[url];

    test('has doctype, lang, charset, viewport and color-scheme', () => {
      assert.match(doc(), /^<!doctype html>\n<html lang="en">/);
      assert.match(doc(), /<meta charset="utf-8">/);
      assert.match(doc(), /<meta name="viewport" content="width=device-width, initial-scale=1">/);
      assert.match(doc(), /<meta name="color-scheme" content="dark light">/);
    });

    test('has a description of at most 160 characters', () => {
      const description = decode(attr(doc(), /<meta name="description" content="([^"]*)">/) ?? '');
      assert.ok(
        description.length > 0 && description.length <= 160,
        `${description.length}: ${description}`,
      );
    });

    test('has a canonical URL and Open Graph tags', () => {
      assert.equal(attr(doc(), /<link rel="canonical" href="([^"]*)">/), siteUrl + url);
      for (const prop of ['type', 'title', 'description', 'url', 'image']) {
        assert.match(
          doc(),
          new RegExp(`<meta property="og:${prop}" content="[^"]+">`),
          `og:${prop}`,
        );
      }
      assert.equal(attr(doc(), /<meta property="og:url" content="([^"]*)">/), siteUrl + url);
      assert.match(doc(), /<meta name="twitter:card" content="summary_large_image">/);
    });

    test('has landmarks: one main, header, nav, footer, and a skip link to main', () => {
      assert.equal(count(doc(), /<main\b/g), 1);
      assert.match(doc(), /<main id="main">/);
      assert.match(doc(), /<header\b/);
      assert.match(doc(), /<nav aria-label="Main">/);
      assert.match(doc(), /<footer\b/);
      assert.ok(
        doc().indexOf('class="skip-link" href="#main"') < doc().indexOf('<header'),
        'skip link comes first',
      );
    });

    test('has exactly one h1 and no skipped heading levels', () => {
      const levels = [...doc().matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
      assert.equal(levels.filter((l) => l === 1).length, 1);
      assert.equal(levels[0], 1);
      levels.reduce((prev, level) => {
        assert.ok(level <= prev + 1, `h${prev} followed by h${level}`);
        return level;
      });
    });

    test('every image has alt text', () => {
      for (const [img] of doc().matchAll(/<img\b[^>]*>/g)) assert.match(img, /\salt="/);
    });

    test('has no inline scripts, styles or event handlers', () => {
      for (const [tag] of doc().matchAll(/<script\b[^>]*>/g)) assert.match(tag, /\ssrc="/, tag);
      assert.doesNotMatch(doc(), /<style\b/);
      assert.doesNotMatch(doc(), /<[^>]+\sstyle=/);
      assert.doesNotMatch(doc(), /<[^>]+\son[a-z]+=/i);
    });

    test('loads the theme script blocking in head and the main script as a module', () => {
      const head = doc().slice(0, doc().indexOf('</head>'));
      assert.match(head, /<script src="\/js\/theme-init\.[0-9a-f]{8}\.js"><\/script>/);
      assert.match(head, /<script type="module" src="\/js\/main\.[0-9a-f]{8}\.js"><\/script>/);
    });

    test('the theme toggle is a button with aria-pressed', () => {
      assert.match(
        doc(),
        /<button type="button" class="theme-toggle" aria-pressed="(true|false)">/,
      );
    });

    test('the motion toggle is a named button with aria-pressed', () => {
      assert.match(
        doc(),
        /<button type="button" class="motion-toggle" aria-pressed="false">[^]*?Pause motion<\/button>/,
      );
    });

    test('external links carry rel="noopener noreferrer" and no target', () => {
      for (const [a] of doc().matchAll(/<a\b[^>]*href="(?:https?:)?\/\/[^"]*"[^>]*>/g)) {
        assert.match(a, /rel="noopener noreferrer"/, a);
        assert.doesNotMatch(a, /target=/, a);
      }
    });

    test('marks the current page in the nav', () => {
      if (url === '/404.html') assert.doesNotMatch(doc(), /aria-current/);
      else assert.match(doc(), new RegExp(`<a href="${url}" aria-current="page">`));
    });
  });
}

test('only the 404 page is noindex, and the sitemap leaves it out', async () => {
  for (const [url, doc] of Object.entries(html))
    assert.equal(/noindex/.test(doc), url === '/404.html', url);
  const xml = await readFile(join(outDir, 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(xml, /404/);
  assert.equal(count(xml, /<loc>https:\/\/example\.test\/[^<]*<\/loc>/g), 3);
});

describe('content is preserved', () => {
  test('home introduces Martin as a web developer and tinkerer', () => {
    assert.match(html['/'], /<h1[^>]*>[^<]*Martin/);
    assert.match(html['/'], /tinkering with technology/);
    assert.match(html['/'], /Vue\.js, JavaScript, and TypeScript/);
  });

  test('home has a static status board with the ticker lines from its frontmatter', async () => {
    const { services } = await homeNetworkSource();
    const board = html['/'].match(/<aside class="status"[^]*?<\/aside>/)?.[0] ?? '';
    assert.ok((board.match(/<li>/g) ?? []).length >= 3, 'at least three ticker lines');
    assert.match(board, /<span class="ticker-source">caddy<\/span>/);
    assert.match(board, /<\/span>homelab status \(mostly fiction\)<\/p>/);
    assert.match(board, new RegExp(`<dd>${services.length}</dd>`));
  });

  test('about keeps the work and life details', () => {
    for (const phrase of [
      'Joyent',
      'Samsung Private Cloud',
      'GraphQL',
      'car-detailing',
      'husband',
    ]) {
      assert.match(html['/about/'], new RegExp(phrase));
    }
  });

  test('home network lists the hardware and a card for every service', async () => {
    const doc = decode(html['/home-network/']);
    const { hardware, services } = await homeNetworkSource();
    assert.ok(hardware.length > 0 && services.length > 0);
    for (const item of hardware) {
      assert.ok(doc.includes(item.split(/\s+/).slice(0, 3).join(' ')), item);
    }
    const cards = [
      ...doc.matchAll(/<article class="card[^"]*" id="[^"]+">\s*<h3>([^<]+)<\/h3>/g),
    ].map((m) => m[1]);
    assert.deepEqual(cards, services);
  });

  test('404 keeps its wit and a way home', () => {
    assert.match(html['/404.html'], /wandered into the void/);
    assert.match(html['/404.html'], /interdimensional nanobots/);
    assert.match(html['/404.html'], /<a href="\/">homepage<\/a>/);
  });

  test('graph.json has a node per service with a one-line summary', async () => {
    const graph = JSON.parse(await readFile(join(outDir, 'assets/graph.json'), 'utf8'));
    const { services } = await homeNetworkSource();
    assert.equal(graph.nodes.length, services.length);
    assert.equal(
      graph.nodes
        .filter((n) => n.hub)
        .map((n) => n.id)
        .join(),
      'personal-website',
    );
    for (const n of graph.nodes)
      assert.ok(n.summary && !n.summary.includes('\n') && n.summary.length < 120, n.id);
    assert.equal(graph.links.length, services.length - 1);
  });
});

describe('editing content round trip', () => {
  async function copyContent() {
    const dir = await tempDir();
    await cp(join(root, 'content'), dir, { recursive: true });
    return dir;
  }
  async function snapshot(contentDir) {
    const out = join(await tempDir(), 'dist');
    await build({ contentDir, srcDir: root, outDir: out, siteUrl });
    const files = {};
    for (const f of await listFiles(out)) files[f] = await readFile(join(out, f), 'utf8');
    return files;
  }

  test('editing the about body changes only /about/', async () => {
    const dir = await copyContent();
    const before = await snapshot(dir);
    const about = await readFile(join(dir, 'about.md'), 'utf8');
    await writeFile(join(dir, 'about.md'), `${about}\nA brand new paragraph about sourdough.\n`);
    const after = await snapshot(dir);
    const changed = Object.keys(after).filter((f) => after[f] !== before[f]);
    assert.deepEqual(changed, ['about/index.html']);
    assert.match(after['about/index.html'], /brand new paragraph about sourdough/);
  });

  test('a new ### section adds a service card and a graph node', async () => {
    const dir = await copyContent();
    const network = await readFile(join(dir, 'home-network.md'), 'utf8');
    const added = network.replace(
      '### Vaultwarden',
      '### Grafana\n\nDashboards for everything. Pretty graphs.\n\n### Vaultwarden',
    );
    assert.notEqual(added, network, 'fixture edit applied');
    await writeFile(join(dir, 'home-network.md'), added);
    const after = await snapshot(dir);
    assert.match(
      after['home-network/index.html'],
      /<article class="card[^"]*" id="grafana">\s*<h3>Grafana<\/h3>/,
    );
    const graph = JSON.parse(after['assets/graph.json']);
    assert.deepEqual(
      graph.nodes.find((n) => n.id === 'grafana'),
      { id: 'grafana', label: 'Grafana', summary: 'Dashboards for everything.' },
    );
    assert.ok(graph.links.some((l) => l.target === 'grafana'));
  });
});
