import { formatElapsed, isPictograph, splitWords } from './hero-model.js';
import { motionAllowed as allowed, readPaused, storedValue } from './motion-model.js';

const root = document.documentElement;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const isPaused = () => root.classList.contains('motion-paused');
const motionAllowed = () => allowed({ reducedMotion: motionQuery.matches, paused: isPaused() });

// Intervals that run only while motion is allowed; syncTimers starts or stops them.
const timers = [];
const syncTimers = () => {
  for (const timer of timers) {
    clearInterval(timer.id);
    timer.id = motionAllowed() ? setInterval(timer.run, timer.ms) : 0;
  }
};

// Motion toggle (WCAG 2.2.2): pressed means motion is paused. It sets the
// motion-paused class, which pauses CSS animation, and tells the graph and the
// status board timers through a motionchange event. theme-init.js restores the
// stored choice before first paint.
const motionToggle = document.querySelector('.motion-toggle');
if (motionToggle) {
  try {
    root.classList.toggle('motion-paused', readPaused(localStorage.getItem('motion')));
  } catch {
    // Storage blocked: keep the class theme-init.js set, if any.
  }
  motionToggle.setAttribute('aria-pressed', String(isPaused()));
  motionToggle.addEventListener('click', () => {
    const paused = !isPaused();
    root.classList.toggle('motion-paused', paused);
    motionToggle.setAttribute('aria-pressed', String(paused));
    try {
      localStorage.setItem('motion', storedValue(paused));
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
    document.dispatchEvent(new Event('motionchange'));
  });
}
document.addEventListener('motionchange', syncTimers);
motionQuery.addEventListener('change', syncTimers);

// Theme toggle: pressed means the dark theme is active. With motion allowed and
// View Transitions supported, the new theme spreads out from the toggle.
const toggle = document.querySelector('.theme-toggle');
if (toggle) {
  const isDark = () => (root.dataset.theme ?? (darkQuery.matches ? 'dark' : 'light')) === 'dark';
  const sync = () => {
    toggle.setAttribute('aria-pressed', String(isDark()));
    document.dispatchEvent(new Event('themechange'));
  };
  const apply = (theme) => {
    root.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Storage blocked: the choice lasts for this page only.
    }
    sync();
  };
  sync();
  darkQuery.addEventListener('change', sync);
  toggle.addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    if (!document.startViewTransition || !motionAllowed()) return apply(theme);
    const box = toggle.getBoundingClientRect();
    root.style.setProperty('--swap-x', `${box.left + box.width / 2}px`);
    root.style.setProperty('--swap-y', `${box.top + box.height / 2}px`);
    root.classList.add('theme-swap');
    const transition = document.startViewTransition(() => apply(theme));
    transition.finished.finally(() => root.classList.remove('theme-swap'));
  });
}

if (motionAllowed()) {
  for (const heading of document.querySelectorAll('main h1')) splitHeading(heading);
}

// Wraps each word of the heading's text in two spans so CSS can raise the
// words into place one after another. The text itself is unchanged.
function splitHeading(heading) {
  let i = 0;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const parts = splitWords(child.textContent).map((part) => {
        if (/^\s+$/.test(part)) return document.createTextNode(part);
        const word = document.createElement('span');
        const inner = document.createElement('span');
        word.className = isPictograph(part) ? 'split-word is-pictograph' : 'split-word';
        inner.textContent = part;
        inner.style.setProperty('--i', String(i++));
        word.append(inner);
        return word;
      });
      child.replaceWith(...parts);
    }
  };
  walk(heading);
}

// Status board: the visit clock shows once and, with motion allowed, counts up;
// the ticker shows the newest lines like a log, adding one every few seconds.
// Both idle while the tab is hidden.
const uptime = document.querySelector('.status-uptime');
if (uptime) {
  const start = performance.now();
  const tick = () => {
    uptime.textContent = formatElapsed(performance.now() - start);
  };
  tick();
  timers.push({ ms: 1000, run: () => document.hidden || tick(), id: 0 });
}
const ticker = document.querySelector('.ticker');
if (ticker && ticker.children.length > 1 && !motionQuery.matches) {
  ticker.classList.add('is-live');
  timers.push({
    ms: 2800,
    run: () => document.hidden || ticker.append(ticker.firstElementChild),
    id: 0,
  });
}
syncTimers();

// Service cards light up under a fine pointer and, with motion allowed, lean towards it.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
for (const card of document.querySelectorAll('.card')) {
  let frame = 0;
  card.addEventListener('pointermove', (event) => {
    if (!finePointer.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      if (!motionAllowed()) return;
      card.classList.add('is-tilting');
      card.style.setProperty('--tilt-x', `${((x - 0.5) * 8).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((0.5 - y) * 8).toFixed(2)}deg`);
    });
  });
  card.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    card.classList.remove('is-tilting');
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
}

const canvas = document.querySelector('.graph-canvas');
// If the graph script cannot load or start, drop the empty stage and keep the static legend.
if (canvas) {
  import('./graph.js')
    .then(({ startGraph }) => startGraph(canvas, motionQuery, isPaused))
    .catch(() => canvas.parentElement?.remove());
}
