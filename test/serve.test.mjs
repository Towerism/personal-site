import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { resolveRequest } from '../scripts/serve.mjs';
import { tempDir, writeFiles } from './helpers.mjs';

const dir = await tempDir();
await writeFiles(dir, {
  'index.html': 'home',
  'about/index.html': 'about',
  '404.html': 'lost',
  'css/site.css': 'body{}',
});

test('serves index.html for directory URLs', async () => {
  assert.deepEqual(await resolveRequest(dir, '/'), { status: 200, file: join(dir, 'index.html') });
  assert.deepEqual(await resolveRequest(dir, '/about/'), {
    status: 200,
    file: join(dir, 'about/index.html'),
  });
});

test('serves plain files, ignoring the query string', async () => {
  assert.deepEqual(await resolveRequest(dir, '/css/site.css?v=1'), {
    status: 200,
    file: join(dir, 'css/site.css'),
  });
});

test('redirects a directory URL without its trailing slash', async () => {
  assert.deepEqual(await resolveRequest(dir, '/about?x=1'), {
    status: 301,
    location: '/about/?x=1',
  });
});

test('the directory redirect is never protocol-relative', async () => {
  assert.deepEqual(await resolveRequest(dir, '/.//css'), { status: 301, location: '/css/' });
  assert.deepEqual(await resolveRequest(dir, '/.///css?q=1'), {
    status: 301,
    location: '/css/?q=1',
  });
  assert.deepEqual(await resolveRequest(dir, '/css'), { status: 301, location: '/css/' });
});

test('unknown paths get 404.html with status 404', async () => {
  assert.deepEqual(await resolveRequest(dir, '/nope/'), {
    status: 404,
    file: join(dir, '404.html'),
  });
});

test('never serves files outside the directory', async () => {
  for (const url of [
    '/../package.json',
    '/%2e%2e/package.json',
    '/..%2fpackage.json',
    '/%2F..%2F..%2Fetc%2Fpasswd',
  ]) {
    assert.deepEqual(
      await resolveRequest(dir, url),
      { status: 404, file: join(dir, '404.html') },
      url,
    );
  }
});
