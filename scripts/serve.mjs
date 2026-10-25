// Development server: builds the site, serves dist/ on HOST:PORT (default
// 0.0.0.0:8080), and rebuilds when content/, templates/ or public/ change.
// Usage: npm run dev
import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, DEFAULT_SITE_URL } from '../build.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

// Maps a request URL to a file in dir, the way the production server does:
// directories serve index.html, a directory without its trailing slash
// redirects, and anything missing (or outside dir) gets 404.html.
export async function resolveRequest(dir, rawUrl) {
  dir = resolve(dir);
  const notFound = { status: 404, file: join(dir, '404.html') };
  const url = new URL(rawUrl, 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return notFound;
  }
  const target = resolve(dir, `.${pathname}`);
  if (target !== dir && !target.startsWith(dir + sep)) return notFound;

  const info = await stat(target).catch(() => null);
  if (info?.isDirectory()) {
    // Collapse leading slashes so the Location can never be protocol-relative (//host/).
    if (!pathname.endsWith('/'))
      return { status: 301, location: `/${url.pathname.replace(/^\/+/, '')}/${url.search}` };
    const index = join(target, 'index.html');
    return (await stat(index).catch(() => null))?.isFile()
      ? { status: 200, file: index }
      : notFound;
  }
  return info?.isFile() ? { status: 200, file: target } : notFound;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const options = {
    contentDir: join(root, 'content'),
    srcDir: root,
    outDir: join(root, 'dist'),
    siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL,
  };
  const port = Number(process.env.PORT) || 8080;
  const host = process.env.HOST ?? '0.0.0.0';

  let building = null;
  let again = false;
  const rebuild = async () => {
    if (building) {
      again = true;
      return building;
    }
    building = build(options)
      .then(({ pages }) => console.log(`Built ${pages.length} pages`))
      .catch((err) => console.error(`Build failed: ${err.message}`));
    await building;
    building = null;
    if (again) {
      again = false;
      await rebuild();
    }
  };

  await rebuild();

  createServer(async (req, res) => {
    const result = await resolveRequest(options.outDir, req.url);
    if (result.location) {
      res.writeHead(301, { Location: result.location }).end();
      return;
    }
    try {
      const body = await readFile(result.file);
      res.writeHead(result.status, {
        'Content-Type': TYPES[extname(result.file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res
        .writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end('Not found (is the build failing?)\n');
    }
  }).listen(port, host, () => console.log(`Serving dist/ at http://${host}:${port}/`));

  let timer;
  for (const dir of ['content', 'templates', 'public']) {
    watch(join(root, dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 100);
    });
  }
}
