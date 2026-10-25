import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatElapsed, isPictograph, splitWords } from '../public/js/hero-model.js';

test('formatElapsed shows mm:ss under an hour and h:mm:ss after', () => {
  assert.equal(formatElapsed(0), '00:00');
  assert.equal(formatElapsed(7_900), '00:07');
  assert.equal(formatElapsed(61_000), '01:01');
  assert.equal(formatElapsed(3_600_000), '1:00:00');
  assert.equal(formatElapsed(3_723_000), '1:02:03');
  assert.equal(formatElapsed(-5), '00:00');
});

test('splitWords keeps every character, alternating words and whitespace', () => {
  const parts = splitWords("Hi, I'm  Martin 🐧");
  assert.deepEqual(parts, ['Hi,', ' ', "I'm", '  ', 'Martin', ' ', '🐧']);
  assert.equal(parts.join(''), "Hi, I'm  Martin 🐧");
  assert.deepEqual(splitWords(''), []);
  assert.deepEqual(splitWords(' lead'), [' ', 'lead']);
});

test('isPictograph spots emoji words only', () => {
  assert.equal(isPictograph('🐧'), true);
  assert.equal(isPictograph('🌌'), true);
  assert.equal(isPictograph('Martin'), false);
  assert.equal(isPictograph(' '), false);
});
