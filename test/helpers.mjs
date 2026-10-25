import { mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const siteUrl = 'https://example.test';

export const tempDir = () => mkdtemp(join(tmpdir(), 'site-test-'));

export async function writeFiles(dir, files) {
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(dir, name)), { recursive: true });
    await writeFile(join(dir, name), text);
  }
}

export async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).split('\\').join('/'))
    .sort();
}

export const page = (title, description, body) =>
  `---\ntitle: ${title}\ndescription: ${description}\n---\n${body}\n`;

// A small but complete content set: the four page names the site uses.
export const fixtureContent = {
  'home.md': page(
    'Home',
    'Fixture home page.',
    '# Home\n\nSee [about](/about/) and the [network](/home-network/#caddy).',
  ),
  'about.md': page(
    'About',
    'Fixture about page.',
    '# About\n\nAbout text. [Out](https://example.org)',
  ),
  'home-network.md': page(
    'Home network',
    'Fixture network page.',
    '# Home network\n\n## Services\n\n### Personal website\n\nThis site. Self-hosted.\n\n### Caddy\n\nReverse proxy server. Routes traffic.\n\n### Plex\n\nMedia streaming server.',
  ),
  '404.md': page('Not found', 'Fixture 404 page.', '# Lost\n\nGo [home](/).'),
};
