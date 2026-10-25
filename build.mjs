// Builds the site: content/*.md + templates/ + public/ -> dist/.
// Usage: node build.mjs   (SITE_URL overrides the default site URL)
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hashAssets } from './lib/assets.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { escapeHtml, isExternal, render, tickerLines } from './lib/render.mjs';

export const DEFAULT_SITE_URL = 'https://martinfrackerjr.com';
const SITE_NAME = 'Martin Fracker, Jr.';
const NAV = [
  ['/', 'Home'],
  ['/about/', 'About'],
  ['/home-network/', 'Home network'],
];
const SERVICES_PAGE = 'home-network';
// Public files served under content-hashed names, cached as immutable.
const HASHED = /^(css\/[^/]+\.css|js\/[^/]+\.js)$/;
const HUB_SERVICE = 'personal-website';

function urlFor(name) {
  if (name === 'home') return '/';
  if (name === '404') return '/404.html';
  return `/${name}/`;
}
const fileFor = (url) => (url.endsWith('/') ? `${url}index.html` : url).slice(1);

export async function build({ contentDir, srcDir, outDir, siteUrl }) {
  siteUrl = siteUrl.replace(/\/+$/, '');
  const layout = await readFile(join(srcDir, 'templates', 'layout.html'), 'utf8');
  const graphFigure = await readFile(join(srcDir, 'templates', 'graph.html'), 'utf8');
  const heroTemplate = await readFile(join(srcDir, 'templates', 'hero.html'), 'utf8');
  const statusTemplate = await readFile(join(srcDir, 'templates', 'status.html'), 'utf8');

  const pages = [];
  for (const file of (await readdir(contentDir)).filter((f) => f.endsWith('.md')).sort()) {
    const { data, body } = parseFrontmatter(await readFile(join(contentDir, file), 'utf8'), file);
    for (const field of ['title', 'description']) {
      if (!data[field]) throw new Error(`${file}: frontmatter is missing "${field}"`);
    }
    const name = file.slice(0, -3);
    pages.push({
      name,
      url: urlFor(name),
      data,
      ...render(body, { cards: name === SERVICES_PAGE }),
    });
  }

  const services = pages.find((p) => p.name === SERVICES_PAGE)?.sections ?? [];
  const graph = graphData(services, new URL(siteUrl).host);
  const figure = fill(graphFigure, {
    count: String(services.length),
    items: services
      .map(
        (s) =>
          `<li><a href="/${SERVICES_PAGE}/#${s.id}" data-node="${s.id}">${escapeHtml(s.title)}</a></li>`,
      )
      .join('\n'),
  });
  const hero = (page) => {
    const lines = tickerLines(page.data.ticker);
    const status = lines.length
      ? fill(statusTemplate, {
          title: escapeHtml(page.data.status || 'homelab status'),
          count: String(services.length),
          lines: lines
            .map(({ source, text }) => {
              const label = source
                ? `<span class="ticker-source">${escapeHtml(source)}</span> `
                : '';
              return `<li>${label}${escapeHtml(text)}</li>`;
            })
            .join('\n'),
        })
      : '';
    const headingEnd = page.html.indexOf('</h1>');
    if (headingEnd === -1) return page.html;
    const cut = headingEnd + '</h1>'.length;
    return fill(heroTemplate, {
      heading: page.html.slice(0, cut),
      intro: page.html.slice(cut).trim(),
      status,
    });
  };

  const output = new Map();
  for (const page of pages) {
    const title = page.name === 'home' ? page.data.title : `${page.data.title} · ${SITE_NAME}`;
    output.set(
      fileFor(page.url),
      fill(layout, {
        title: escapeHtml(title),
        description: escapeHtml(page.data.description),
        canonical: escapeHtml(siteUrl + page.url),
        ogImage: escapeHtml(`${siteUrl}/og.png`),
        siteName: escapeHtml(SITE_NAME),
        page: escapeHtml(page.name),
        crumb: escapeHtml(page.name === 'home' ? '~/' : `~/${page.name}`),
        robots: page.name === '404' ? '<meta name="robots" content="noindex">\n' : '',
        nav: NAV.map(([href, label]) => {
          const current = href === page.url ? ' aria-current="page"' : '';
          return `<li><a href="${href}"${current}>${label}</a></li>`;
        }).join('\n'),
        content: page.name === 'home' ? hero(page) + figure : page.html,
      }),
    );
  }
  const indexed = pages
    .filter((p) => p.name !== '404')
    .map((p) => p.url)
    .sort();
  output.set('sitemap.xml', sitemap(indexed.map((url) => siteUrl + url)));
  output.set('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  output.set('assets/graph.json', `${JSON.stringify(graph, null, 2)}\n`);

  const publicDir = join(srcDir, 'public');
  const publicFiles = await listFiles(publicDir);
  const toHash = new Map();
  for (const file of publicFiles.filter((f) => HASHED.test(f)))
    toHash.set(file, await readFile(join(publicDir, file), 'utf8'));
  const { names, contents } = hashAssets(toHash);
  for (const [file, html] of output) {
    if (!file.endsWith('.html')) continue;
    output.set(
      file,
      html.replace(/(\s(?:href|src)=")\/([^"]+)"/g, (m, attr, path) =>
        names.has(path) ? `${attr}/${names.get(path)}"` : m,
      ),
    );
  }
  for (const [file, text] of contents) output.set(file, text);
  checkLinks(output, new Set([...publicFiles.filter((f) => !names.has(f)), ...output.keys()]));

  await rm(outDir, { recursive: true, force: true });
  const unhashed = (src) => !names.has(relative(publicDir, src).split(sep).join('/'));
  await cp(publicDir, outDir, { recursive: true, filter: unhashed });
  for (const [file, text] of output) {
    await mkdir(dirname(join(outDir, file)), { recursive: true });
    await writeFile(join(outDir, file), text);
  }
  return { pages: pages.map((p) => p.url) };
}

// Replaces {{key}} with values[key]; an unknown key is a template bug.
function fill(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`template uses unknown placeholder {{${key}}}`);
    return values[key];
  });
}

function graphData(services, host) {
  const nodes = services.map((s) => ({ id: s.id, label: s.title, summary: s.summary }));
  let hub = nodes.find((n) => n.id === HUB_SERVICE);
  if (hub) hub.hub = true;
  else nodes.unshift((hub = { id: 'site', label: host, summary: 'This website.', hub: true }));
  const links = nodes.filter((n) => n !== hub).map((n) => ({ source: hub.id, target: n.id }));
  return { nodes, links };
}

function sitemap(urls) {
  const entries = urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// Every internal href/src in the HTML output must point at a file that will be
// written, and every #fragment at an id on the target page. External URLs are skipped.
function checkLinks(output, files) {
  const broken = [];
  for (const [file, html] of output) {
    if (!file.endsWith('.html')) continue;
    const source = file === 'index.html' ? '/' : `/${file.replace(/index\.html$/, '')}`;
    for (const [, href] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      if (isExternal(href)) continue;
      const target = new URL(href.replaceAll('&amp;', '&'), `http://site${source}`);
      let ok;
      try {
        const targetFile = fileFor(decodeURIComponent(target.pathname));
        const fragment = decodeURIComponent(target.hash.slice(1));
        ok = files.has(targetFile) && (!fragment || hasId(output.get(targetFile), fragment));
      } catch {
        ok = false; // a malformed % escape
      }
      if (!ok) broken.push(`from ${source} to ${href}`);
    }
  }
  if (broken.length) throw new Error(`Broken links:\n  ${broken.join('\n  ')}`);
}

const hasId = (html, id) => html !== undefined && html.includes(` id="${escapeHtml(id)}"`);

async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).split('\\').join('/'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const here = dirname(fileURLToPath(import.meta.url));
  try {
    const { pages } = await build({
      contentDir: join(here, 'content'),
      srcDir: here,
      outDir: join(here, 'dist'),
      siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL,
    });
    console.log(`Built ${pages.length} pages into dist/: ${pages.join(' ')}`);
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exitCode = 1;
  }
}
