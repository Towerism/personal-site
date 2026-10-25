// Static checks on the stylesheet and scripts in public/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './helpers.mjs';

const css = await readFile(join(root, 'public/css/site.css'), 'utf8');

function block(source, opener) {
  const start = source.indexOf(opener);
  if (start === -1) return null;
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unbalanced block after ${opener}`);
}

test('has a reduced-motion block that switches animation and transitions off', () => {
  const reduce = block(css, '@media (prefers-reduced-motion: reduce)');
  assert.ok(reduce, 'reduced-motion block missing');
  assert.match(reduce, /animation: none !important/);
  assert.match(reduce, /transition: none !important/);
});

test('all motion lives inside the no-preference motion block', () => {
  const allowed = block(css, '@media (prefers-reduced-motion: no-preference)');
  assert.ok(allowed, 'no-preference block missing');
  const rest = css
    .replace(allowed, '')
    .replace(block(css, '@media (prefers-reduced-motion: reduce)'), '');
  assert.doesNotMatch(rest, /@view-transition|@keyframes|animation(-timeline)?\s*:|transition\s*:/);
});

test('every animation in the motion block is scoped under .js', () => {
  const allowed = block(css, '@media (prefers-reduced-motion: no-preference)').replace(
    /\/\*[^]*?\*\//g,
    '',
  );
  const rules = [...allowed.matchAll(/([^{};]+)\{([^{}]*)\}/g)].filter(([, , body]) =>
    /(^|[;\s])animation\s*:/.test(body),
  );
  assert.ok(rules.length > 0, 'no animation rules found');
  for (const [, selectorList] of rules) {
    for (const selector of selectorList.split(',').map((s) => s.trim())) {
      // View transition pseudo-elements hang off the document, not an element
      // that could carry the class; see the comment on @view-transition.
      if (/^::view-transition-/.test(selector)) continue;
      assert.match(selector, /^\.js[ .]/, selector);
    }
  }
});

test('pausing motion pauses every animation and is shown only with JS', () => {
  assert.match(css, /\.js\.motion-paused \*[^{]*\{[^}]*animation-play-state: paused !important/);
  assert.match(css, /\.motion-toggle \{\s*display: none;\s*\}/);
  assert.match(css, /\.js \.motion-toggle \{/);
});

test('has a visible :focus-visible style', () => {
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*\d+px solid/);
});

test('reveal rules are scoped under .js so content shows without JS', () => {
  const selectors = [...css.matchAll(/([^{};]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => s.includes('.reveal'));
  assert.ok(selectors.length > 0, 'no reveal rules found');
  for (const s of selectors.flatMap((s) => s.split(','))) assert.match(s.trim(), /^\.js[ .]/, s);
});

// WCAG 2.x relative luminance and contrast ratio.
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('contrast helper matches known WCAG values', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(contrast('#777777', '#ffffff').toFixed(2), '4.48');
});

const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi)].map(
    ([, name, light, dark]) => [name, { light, dark }],
  ),
);

for (const theme of ['light', 'dark']) {
  test(`text and accent tokens meet WCAG AA (4.5:1) in the ${theme} theme`, () => {
    for (const name of ['bg', 'surface', 'fg', 'muted', 'accent'])
      assert.ok(tokens[name], `--${name} not defined with light-dark()`);
    for (const fg of ['fg', 'muted', 'accent']) {
      for (const bg of ['bg', 'surface']) {
        const ratio = contrast(tokens[fg][theme], tokens[bg][theme]);
        assert.ok(ratio >= 4.5, `--${fg} on --${bg}: ${ratio.toFixed(2)}`);
      }
    }
  });
}

test('the theme can be forced either way with data-theme', () => {
  assert.match(css, /:root\[data-theme="light"\]\s*\{\s*color-scheme: light;/);
  assert.match(css, /:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/);
});

for (const file of ['graph-model.js', 'hero-model.js', 'motion-model.js']) {
  test(`${file} is pure: no DOM or browser globals`, async () => {
    const source = await readFile(join(root, 'public/js', file), 'utf8');
    assert.doesNotMatch(
      source,
      /\b(document|window|localStorage|matchMedia|requestAnimationFrame)\b/,
    );
  });
}
