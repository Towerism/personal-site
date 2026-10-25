import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { hashAssets } from '../lib/assets.mjs';

const sha8 = (text) => createHash('sha256').update(text).digest('hex').slice(0, 8);

test('names each file after the first 8 hex digits of its SHA-256', () => {
  const { names, contents } = hashAssets(new Map([['css/site.css', 'body{}']]));
  const name = `css/site.${sha8('body{}')}.css`;
  assert.deepEqual([...names], [['css/site.css', name]]);
  assert.deepEqual([...contents], [[name, 'body{}']]);
});

test('rewrites relative import specifiers to the hashed names, and hashes the rewritten text', () => {
  const files = new Map([
    [
      'js/main.js',
      "import { a } from './a.js';\nimport('./b.js').then(() => 0);\nimport \"./a.js\";\n",
    ],
    ['js/a.js', 'export const a = 1;\n'],
    ['js/b.js', "import { a } from './a.js';\nexport default a;\n"],
  ]);
  const { names, contents } = hashAssets(files);
  const a = `js/a.${sha8(files.get('js/a.js'))}.js`;
  assert.equal(names.get('js/a.js'), a);
  const bText = `import { a } from './${a.slice(3)}';\nexport default a;\n`;
  const b = `js/b.${sha8(bText)}.js`;
  assert.equal(names.get('js/b.js'), b);
  assert.equal(contents.get(b), bText);
  const mainText = `import { a } from './${a.slice(3)}';\nimport('./${b.slice(3)}').then(() => 0);\nimport "./${a.slice(3)}";\n`;
  assert.equal(contents.get(names.get('js/main.js')), mainText);
  assert.equal(names.get('js/main.js'), `js/main.${sha8(mainText)}.js`);
});

test('a change in an imported module changes the importer name too', () => {
  const before = hashAssets(
    new Map([
      ['js/main.js', "import './a.js';"],
      ['js/a.js', '1'],
    ]),
  );
  const after = hashAssets(
    new Map([
      ['js/main.js', "import './a.js';"],
      ['js/a.js', '2'],
    ]),
  );
  assert.notEqual(before.names.get('js/main.js'), after.names.get('js/main.js'));
});

test('an import of a file outside the set is an error', () => {
  assert.throws(
    () => hashAssets(new Map([['js/main.js', "import './gone.js';"]])),
    /js\/main\.js imports \.\/gone\.js/,
  );
});
