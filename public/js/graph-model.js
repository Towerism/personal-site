// Pure helpers for the network graph. No DOM access, so they run under node:test.

export function shouldAnimate({ reducedMotion, hidden, offscreen = false, paused = false }) {
  return !reducedMotion && !hidden && !offscreen && !paused;
}

// Canvas backing-store scale: sharp on high-density screens, but never more
// than 2x, which quadruples the pixels to fill for no visible gain.
export function pixelRatio(dpr) {
  return Math.min(dpr || 1, 2);
}

export function nearestNode(points, x, y, reach) {
  let best = -1;
  let bestDist = reach;
  points.forEach((p, i) => {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

// Pulls a point towards the pointer inside `reach`. The pull stops at the pointer,
// so a node never overshoots it.
export function lean(point, pointer, { reach, strength }) {
  const dx = pointer.x - point.x;
  const dy = pointer.y - point.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= reach) return { x: point.x, y: point.y };
  const pull = Math.min(dist, (reach - dist) * strength);
  return { x: point.x + (dx / dist) * pull, y: point.y + (dy / dist) * pull };
}

// Packet position along edge `index` at `time` (ms): 0 at the hub, just under 1 at
// the service. Each edge has its own speed and offset, so packets never run in lockstep.
export function packetProgress(time, index) {
  const period = 2400 + ((index * 733) % 1900);
  const offset = (index * 0.618) % 1;
  return (time / period + offset) % 1;
}

export function buildGraph(data, { width, height }) {
  const cx = width / 2;
  const cy = height / 2;
  const ring = data.nodes.filter((n) => !n.hub);
  const rx = width * 0.38;
  const ry = height * 0.38;
  const base = Math.max(3, Math.min(width, height) / 60);

  let k = 0;
  const nodes = data.nodes.map((n) => {
    const { id, label, summary } = n;
    if (n.hub) return { id, label, summary, hub: true, x: cx, y: cy, r: base * 2 };
    const angle = -Math.PI / 2 + (k++ * 2 * Math.PI) / ring.length;
    return {
      id,
      label,
      summary,
      hub: false,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
      r: base,
    };
  });

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = data.links
    .filter((l) => index.has(l.source) && index.has(l.target))
    .map((l) => ({ source: index.get(l.source), target: index.get(l.target) }));

  return { nodes, edges };
}
