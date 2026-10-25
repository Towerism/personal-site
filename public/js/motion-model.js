// Pure state for the motion toggle. No DOM access, so it runs under node:test.
// theme-init.js repeats readPaused inline, because it is a classic script that
// runs before first paint and cannot import a module.

export function readPaused(stored) {
  return stored === 'paused';
}

export function storedValue(paused) {
  return paused ? 'paused' : 'playing';
}

export function motionAllowed({ reducedMotion, paused }) {
  return !reducedMotion && !paused;
}
