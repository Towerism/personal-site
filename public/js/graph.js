import {
  buildGraph,
  lean,
  nearestNode,
  packetProgress,
  pixelRatio,
  shouldAnimate,
} from './graph-model.js';

// Draws the network graph on the home page canvas. Nodes drift, packets run
// from the hub to each service, and the pointer pulls nearby nodes and
// highlights the nearest one. The legend links under the canvas highlight
// their node on hover or keyboard focus, and the canvas highlights its legend link.
export async function startGraph(canvas, motionQuery, isPaused) {
  let data;
  try {
    const response = await fetch(canvas.dataset.src);
    if (!response.ok) throw new Error(`graph data: HTTP ${response.status}`);
    data = await response.json();
  } catch {
    // No graph data: drop the empty stage; the legend below already lists every service.
    canvas.parentElement.remove();
    return;
  }
  const ctx = canvas.getContext('2d');
  const stage = canvas.parentElement;
  const readout = stage.querySelector('.graph-readout');
  const legend = [...document.querySelectorAll('.graph-legend a[data-node]')];
  const pointer = { x: 0, y: 0, inside: false, touch: false };
  let graph = { nodes: [], edges: [] };
  let points = [];
  let colors = {};
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastTime = 0;
  let offscreen = true;
  // The canvas position, cached so pointermove does not force a layout read.
  // Refreshed on resize, scroll and pointer entry.
  let box = canvas.getBoundingClientRect();
  const measure = () => {
    box = canvas.getBoundingClientRect();
  };
  let hovered = -1;
  let focused = -1;
  let shown = null;

  const highlight = () => (focused !== -1 ? focused : hovered);

  const readColors = () => {
    const stageStyle = getComputedStyle(stage);
    colors = {
      accent: getComputedStyle(canvas).color,
      fg: stageStyle.color,
      surface: stageStyle.backgroundColor,
    };
  };

  const resize = () => {
    const scale = pixelRatio(devicePixelRatio);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    measure();
    graph = buildGraph(data, { width, height: height * 0.92 });
    shown = null;
  };

  const showReadout = () => {
    const index = highlight();
    if (index === shown) return;
    shown = index;
    const node = graph.nodes[index] ?? graph.nodes.find((n) => n.hub);
    if (!node) return;
    const name = document.createElement('strong');
    name.textContent = node.label;
    readout.replaceChildren(name, ` ${node.summary}`);
    for (const link of legend)
      link.classList.toggle('is-active', index !== -1 && link.dataset.node === node.id);
  };

  const place = (n, i, time) => {
    const drift = n.hub ? 2 : Math.min(width, height) * 0.018;
    const base = {
      x: n.x + Math.cos(time / 1900 + i * 1.7) * drift,
      y: n.y + Math.sin(time / 2300 + i * 1.3) * drift,
    };
    return pointer.inside ? lean(base, pointer, { reach: 170, strength: 0.22 }) : base;
  };

  const draw = (time) => {
    const { accent, fg, surface } = colors;
    const hot = highlight();
    points = graph.nodes.map((n, i) => place(n, i, time));
    ctx.clearRect(0, 0, width, height);

    if (pointer.inside && !pointer.touch) {
      const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 200);
      glow.addColorStop(0, accent);
      glow.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = glow;
      ctx.fillRect(pointer.x - 200, pointer.y - 200, 400, 400);
    }

    graph.edges.forEach((e, k) => {
      const a = points[e.source];
      const b = points[e.target];
      const lit = e.source === hot || e.target === hot;
      ctx.globalAlpha = lit ? 0.9 : 0.2;
      ctx.strokeStyle = lit ? accent : fg;
      ctx.lineWidth = lit ? 1.75 : 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const t = packetProgress(time * (lit ? 2 : 1), k);
      ctx.globalAlpha = Math.sin(Math.PI * t) * (lit ? 1 : 0.8);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, lit ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    });

    const showAll = width >= 560;
    ctx.textAlign = 'center';
    graph.nodes.forEach((n, i) => {
      const p = points[i];
      const lit = i === hot;
      if (n.hub) {
        const pulse = (time % 2600) / 2600;
        ctx.globalAlpha = (1 - pulse) * 0.6;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.r * (1 + pulse * 2.6), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (lit) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, lit ? n.r * 1.5 : n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.hub || lit ? accent : surface;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = accent;
      ctx.stroke();

      if (!showAll && !lit && !n.hub) return;
      const size = showAll ? 12.5 : 11.5;
      ctx.font = `${lit || n.hub ? 700 : 500} ${size}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      const half = ctx.measureText(n.label).width / 2;
      const x = Math.min(Math.max(p.x, half + 8), width - half - 8);
      const below = p.y > height / 2;
      const y = below ? p.y + n.r + size + 8 : p.y - n.r - 9;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = surface;
      ctx.strokeText(n.label, x, y);
      ctx.globalAlpha = lit || n.hub ? 1 : 0.75;
      ctx.fillStyle = lit ? accent : fg;
      ctx.fillText(n.label, x, y);
    });
    ctx.globalAlpha = 1;
  };

  const loop = (time) => {
    lastTime = time;
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  // While the loop is stopped, redraw one still frame so a resize or a
  // highlight still shows.
  const still = () => {
    if (!frame) draw(lastTime);
  };

  // Animate only while motion is allowed and not paused, the page is visible
  // and the canvas is on screen. With reduced motion the stylesheet hides the canvas.
  const update = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    const go = shouldAnimate({
      reducedMotion: motionQuery.matches,
      hidden: document.hidden,
      offscreen,
      paused: isPaused(),
    });
    if (go) frame = requestAnimationFrame(loop);
    else still();
  };

  const setPointer = (event) => {
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.inside = true;
    pointer.touch = event.pointerType !== 'mouse';
    hovered = nearestNode(points, pointer.x, pointer.y, pointer.touch ? 40 : 28);
    canvas.classList.toggle('is-pointing', hovered !== -1);
    showReadout();
    still();
  };
  const clearPointer = () => {
    pointer.inside = false;
    hovered = -1;
    canvas.classList.remove('is-pointing');
    showReadout();
    still();
  };

  readColors();
  resize();
  showReadout();
  new ResizeObserver(() => {
    resize();
    update();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    update();
  }).observe(canvas);

  addEventListener('scroll', measure, { passive: true });
  canvas.addEventListener('pointerenter', measure);
  canvas.addEventListener('pointermove', setPointer);
  canvas.addEventListener('pointerleave', clearPointer);
  // Touch has no hover, so the first tap highlights a node and a second tap on it
  // opens its card. A mouse click opens the card at once.
  let armed = -1;
  canvas.addEventListener('pointerdown', (event) => {
    armed = hovered;
    setPointer(event);
  });
  canvas.addEventListener('click', () => {
    const node = graph.nodes[hovered];
    if (!node) return;
    if (pointer.touch && armed !== hovered) return;
    location.href = `/home-network/#${node.id}`;
  });

  for (const link of legend) {
    const index = () => graph.nodes.findIndex((n) => n.id === link.dataset.node);
    const on = () => {
      focused = index();
      showReadout();
      still();
    };
    const off = () => {
      focused = -1;
      showReadout();
      still();
    };
    link.addEventListener('pointerenter', on);
    link.addEventListener('pointerleave', off);
    link.addEventListener('focus', on);
    link.addEventListener('blur', off);
  }

  document.addEventListener('themechange', () => {
    readColors();
    still();
  });
  document.addEventListener('motionchange', update);
  motionQuery.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
}
