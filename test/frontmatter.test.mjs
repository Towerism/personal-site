import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

test('reads key/value pairs and returns the body after the block', () => {
  const { data, body } = parseFrontmatter(
    '---\ntitle: About\ndescription: Who I am\n---\n# Hi\n',
    'about.md',
  );
  assert.deepEqual(data, { title: 'About', description: 'Who I am' });
  assert.equal(body, '# Hi\n');
});

test('keeps colons inside quoted and unquoted values', () => {
  const src = '---\ntitle: "Home: the lab"\ndescription: \'Ratio 1:2\'\nnote: a: b\n---\nbody';
  const { data } = parseFrontmatter(src, 'x.md');
  assert.equal(data.title, 'Home: the lab');
  assert.equal(data.description, 'Ratio 1:2');
  assert.equal(data.note, 'a: b');
});

test('a file without frontmatter yields empty data and the whole text as body', () => {
  const { data, body } = parseFrontmatter('# Just markdown\n', 'plain.md');
  assert.deepEqual(data, {});
  assert.equal(body, '# Just markdown\n');
});

test('CRLF line endings parse the same as LF', () => {
  const { data, body } = parseFrontmatter(
    '---\r\ntitle: T\r\ndescription: D\r\n---\r\nline one\r\nline two\r\n',
    'crlf.md',
  );
  assert.deepEqual(data, { title: 'T', description: 'D' });
  assert.equal(body, 'line one\nline two\n');
});

test('an unterminated block throws and names the file', () => {
  assert.throws(
    () => parseFrontmatter('---\ntitle: T\n# never closed\n', 'broken.md'),
    /broken\.md/,
  );
});
