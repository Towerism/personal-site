import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraph,
  lean,
  nearestNode,
  packetProgress,
  pixelRatio,
  shouldAnimate,
} from '../public/js/graph-model.js';

test('shouldAnimate is true only when motion is allowed and the page is visible', () => {
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: false }), true);
  assert.equal(shouldAnimate({ reducedMotion: true, hidden: false }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: true }), false);
  assert.equal(shouldAnimate({ reducedMotion: true, hidden: true }), false);
});

test('shouldAnimate is false while the canvas is off-screen', () => {
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: false, offscreen: true }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: false, offscreen: false }), true);
});

test('shouldAnimate is false while motion is paused', () => {
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: false, paused: true }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, hidden: false, paused: false }), true);
});

test('pixelRatio caps the device pixel ratio at 2 and falls back to 1', () => {
  assert.equal(pixelRatio(3), 2);
  assert.equal(pixelRatio(1.5), 1.5);
  assert.equal(pixelRatio(undefined), 1);
  assert.equal(pixelRatio(0), 1);
});

test('nearestNode finds the closest point within reach, or -1', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 100, y: 100 },
  ];
  assert.equal(nearestNode(points, 8, 1, 20), 1);
  assert.equal(nearestNode(points, 2, 0, 20), 0);
  assert.equal(nearestNode(points, 60, 50, 20), -1);
  assert.equal(nearestNode([], 0, 0, 20), -1);
});

test('lean pulls a point towards a nearby pointer without passing it', () => {
  const far = lean({ x: 0, y: 0 }, { x: 500, y: 0 }, { reach: 100, strength: 0.3 });
  assert.deepEqual(far, { x: 0, y: 0 });
  const near = lean({ x: 0, y: 0 }, { x: 50, y: 0 }, { reach: 100, strength: 0.3 });
  assert.ok(near.x > 0 && near.x < 50, `moved to ${near.x}`);
  assert.equal(near.y, 0);
  const closer = lean({ x: 0, y: 0 }, { x: 20, y: 0 }, { reach: 100, strength: 0.3 });
  assert.ok(closer.x <= 20);
  assert.deepEqual(lean({ x: 5, y: 5 }, { x: 5, y: 5 }, { reach: 100, strength: 0.3 }), {
    x: 5,
    y: 5,
  });
});

test('packetProgress stays in [0, 1), advances with time and staggers edges', () => {
  for (const t of [0, 999, 123456]) {
    for (const i of [0, 1, 7]) {
      const p = packetProgress(t, i);
      assert.ok(p >= 0 && p < 1, `${t},${i}: ${p}`);
    }
  }
  assert.notEqual(packetProgress(0, 0), packetProgress(0, 1));
  assert.ok(packetProgress(100, 0) > packetProgress(0, 0));
  assert.equal(packetProgress(5000, 3), packetProgress(5000, 3));
});

const data = {
  nodes: [
    { id: 'personal-website', label: 'Personal website', summary: 'This site.', hub: true },
    { id: 'caddy', label: 'Caddy', summary: 'Reverse proxy.' },
    { id: 'plex', label: 'Plex', summary: 'Media.' },
    { id: 'authentik', label: 'Authentik', summary: 'Identity.' },
    { id: 'vaultwarden', label: 'Vaultwarden', summary: 'Passwords.' },
  ],
  links: [
    { source: 'personal-website', target: 'caddy' },
    { source: 'personal-website', target: 'plex' },
    { source: 'personal-website', target: 'authentik' },
    { source: 'personal-website', target: 'vaultwarden' },
    { source: 'personal-website', target: 'missing' },
  ],
};

test('buildGraph centres the hub and rings the other nodes inside the box', () => {
  const { nodes } = buildGraph(data, { width: 400, height: 200 });
  const hub = nodes.find((n) => n.hub);
  assert.deepEqual([hub.x, hub.y], [200, 100]);
  for (const n of nodes.filter((n) => !n.hub)) {
    assert.ok(n.x > 0 && n.x < 400 && n.y > 0 && n.y < 200, `${n.id} at ${n.x},${n.y}`);
    assert.ok(Math.hypot(n.x - 200, n.y - 100) > 20, `${n.id} sits on the hub`);
  }
  assert.ok(hub.r > nodes[1].r, 'hub is drawn larger');
});

test('buildGraph maps links to node indexes and drops links to unknown nodes', () => {
  const { edges } = buildGraph(data, { width: 400, height: 200 });
  assert.deepEqual(edges, [
    { source: 0, target: 1 },
    { source: 0, target: 2 },
    { source: 0, target: 3 },
    { source: 0, target: 4 },
  ]);
});

test('buildGraph is deterministic and does not mutate its input', () => {
  const before = JSON.stringify(data);
  const a = buildGraph(data, { width: 300, height: 300 });
  const b = buildGraph(data, { width: 300, height: 300 });
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(data), before);
});

test('buildGraph copes with an empty graph', () => {
  assert.deepEqual(buildGraph({ nodes: [], links: [] }, { width: 10, height: 10 }), {
    nodes: [],
    edges: [],
  });
});
