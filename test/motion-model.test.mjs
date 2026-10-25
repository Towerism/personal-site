import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionAllowed, readPaused, storedValue } from '../public/js/motion-model.js';

test('readPaused is true only for the stored value "paused"', () => {
  assert.equal(readPaused('paused'), true);
  for (const value of ['playing', null, undefined, '', 'PAUSED', 'true'])
    assert.equal(readPaused(value), false, String(value));
});

test('storedValue round-trips through readPaused', () => {
  assert.equal(storedValue(true), 'paused');
  assert.equal(storedValue(false), 'playing');
  for (const paused of [true, false]) assert.equal(readPaused(storedValue(paused)), paused);
});

test('motionAllowed needs both no reduced-motion preference and no pause', () => {
  assert.equal(motionAllowed({ reducedMotion: false, paused: false }), true);
  assert.equal(motionAllowed({ reducedMotion: false, paused: true }), false);
  assert.equal(motionAllowed({ reducedMotion: true, paused: false }), false);
  assert.equal(motionAllowed({ reducedMotion: true, paused: true }), false);
});
