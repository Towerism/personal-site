import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, tickerLines } from '../lib/render.mjs';

test('external links get rel="noopener noreferrer" and no target', () => {
  const { html } = render('[Craft](https://www.closetcraft.online)');
  assert.match(
    html,
    /<a href="https:\/\/www\.closetcraft\.online" rel="noopener noreferrer">Craft<\/a>/,
  );
  assert.doesNotMatch(html, /target=/);
});

test('internal links and anchors get no rel', () => {
  const { html } = render('[About](/about/) and [Panel](#pterodactyl)');
  assert.match(html, /<a href="\/about\/">About<\/a>/);
  assert.match(html, /<a href="#pterodactyl">Panel<\/a>/);
  assert.doesNotMatch(html, /rel=/);
});

test('raw HTML is escaped, so a script tag never survives', () => {
  const { html } = render(
    '<script>alert(1)</script>\n\nText with <b onclick="x()">inline</b> html.',
  );
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<b /);
  assert.match(html, /&lt;script&gt;/);
});

test('image alt text is kept', () => {
  const { html } = render('![A Raspberry Pi on a shelf](/img/pi.jpg)');
  assert.match(html, /<img src="\/img\/pi\.jpg" alt="A Raspberry Pi on a shelf"/);
});

test('headings get slug ids', () => {
  const { html } = render('## Hardware & more\n\n## Hardware & more');
  assert.match(html, /<h2 id="hardware-more">/);
  assert.match(html, /<h2 id="hardware-more-2">/);
});

test('with cards on, each ### section becomes an article card and a service entry', () => {
  const md =
    '## Services\n\n### Caddy\n\nReverse proxy server. It routes [traffic](https://caddyserver.com).\n\n### Plex Media Server\n\nMedia streaming server.\n\n## After\n\nTail.';
  const { html, sections } = render(md, { cards: true });
  assert.deepEqual(sections, [
    { id: 'caddy', title: 'Caddy', summary: 'Reverse proxy server.' },
    { id: 'plex-media-server', title: 'Plex Media Server', summary: 'Media streaming server.' },
  ]);
  assert.match(
    html,
    /<div class="cards">\s*<article class="card reveal" id="caddy">\s*<h3>Caddy<\/h3>/,
  );
  assert.match(html, /<\/article>\s*<\/div>\s*<h2 id="after">/);
  assert.equal(html.match(/<article/g).length, 2);
});

test('without cards, ### stays a plain heading and no services are returned', () => {
  const { html, sections } = render('### Caddy\n\nText.');
  assert.match(html, /<h3 id="caddy">Caddy<\/h3>/);
  assert.deepEqual(sections, []);
});

test('tickerLines splits on | and separates an optional "source: " prefix', () => {
  assert.deepEqual(tickerLines(' caddy: no open ports | just text |  | dns: blocked: one more '), [
    { source: 'caddy', text: 'no open ports' },
    { source: '', text: 'just text' },
    { source: 'dns', text: 'blocked: one more' },
  ]);
});

test('tickerLines of a missing or empty value is an empty list', () => {
  assert.deepEqual(tickerLines(undefined), []);
  assert.deepEqual(tickerLines('  |  '), []);
});

test('links and images with a scheme other than http, https or mailto become #', () => {
  const md = [
    '[a](javascript:alert(1))',
    '[b](JavaScript:alert(1))',
    '[c](<java\tscript:alert(1)>)',
    '[d](data:text/html;base64,PHNjcmlwdD4=)',
    '[e](vbscript:msgbox)',
    '![f](data:image/svg+xml;base64,PHN2Zz4=)',
    '![g](javascript:alert(1))',
  ].join('\n\n');
  const { html } = render(md);
  assert.doesNotMatch(html, /script:|data:/i);
  assert.equal(html.match(/<a href="#">/g).length, 5);
  assert.equal(html.match(/<img src="#"/g).length, 2);
});

test('http, https, mailto, relative paths and fragments are kept', () => {
  const md =
    '[a](http://x.test/) [b](https://x.test/) [c](mailto:me@x.test) [d](/about/) [e](../up) [f](page?q=1:2) [g](#top) ![h](img/pi.jpg)';
  const { html } = render(md);
  for (const href of [
    'http://x.test/',
    'https://x.test/',
    'mailto:me@x.test',
    '/about/',
    '../up',
    'page?q=1:2',
    '#top',
  ]) {
    assert.match(html, new RegExp(`<a href="${href.replace(/[.?/]/g, '\\$&')}"`), href);
  }
  assert.match(html, /<img src="img\/pi\.jpg"/);
});
