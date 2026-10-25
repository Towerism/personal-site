import { Marked } from 'marked';

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Plain text of an HTML fragment, for summaries. Decodes only the entities escapeHtml emits.
export function toText(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(
      /&(amp|lt|gt|quot|#39);/g,
      (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[e],
    )
    .trim();
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const isExternal = (href) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href);

// Keeps http, https and mailto URLs, relative paths and fragments; any other
// scheme (javascript:, data:, ...) becomes "#". Browsers ignore whitespace and
// control characters in a scheme, so those are stripped before the check.
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:']);
export function safeUrl(href) {
  const scheme = String(href)
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\u0000-\u0020\u007f]/g, '')
    .match(/^[a-z][a-z0-9+.-]*:/i)?.[0]
    .toLowerCase();
  return !scheme || SAFE_SCHEMES.has(scheme) ? href : '#';
}

// Renders a page body. Raw HTML in the Markdown is escaped, never passed through.
// With `cards`, every `###` section becomes an <article class="card"> and is
// returned in `sections` as { id, title, summary } (summary: first sentence).
export function render(markdown, { cards = false } = {}) {
  const used = new Map();
  const uniqueId = (text) => {
    const base = slugify(text) || 'section';
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      html({ text }) {
        return escapeHtml(text);
      },
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        return `<h${depth} id="${uniqueId(toText(inner))}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        href = safeUrl(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const rel = isExternal(href) ? ' rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${rel}>${this.parser.parseInline(tokens)}</a>`;
      },
      image({ href, title, text }) {
        href = safeUrl(href);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} loading="lazy" decoding="async">`;
      },
    },
  });

  const tokens = marked.lexer(markdown);
  if (!cards) return { html: marked.parser(tokens), sections: [] };

  const parse = (list) => marked.parser(Object.assign(list, { links: tokens.links }));
  const sections = [];
  let html = '';
  let pending = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type !== 'heading' || token.depth !== 3) {
      pending.push(token);
      i += 1;
      continue;
    }
    html += parse(pending);
    pending = [];
    html += '<div class="cards">\n';
    while (i < tokens.length && tokens[i].type === 'heading' && tokens[i].depth === 3) {
      const titleHtml = marked.parseInline(tokens[i].text);
      const title = toText(titleHtml);
      const id = uniqueId(title);
      const body = [];
      i += 1;
      while (i < tokens.length && !(tokens[i].type === 'heading' && tokens[i].depth <= 3))
        body.push(tokens[i++]);
      const bodyHtml = parse(body);
      const firstParagraph = body.find((t) => t.type === 'paragraph');
      const text = firstParagraph ? toText(marked.parseInline(firstParagraph.text)) : '';
      const summary = (text.match(/^.*?[.!?](?=\s|$)/s)?.[0] ?? text).replace(/\s+/g, ' ');
      sections.push({ id, title, summary });
      html += `<article class="card reveal" id="${id}">\n<h3>${titleHtml}</h3>\n${bodyHtml}</article>\n`;
    }
    html += '</div>\n';
  }
  html += parse(pending);
  return { html, sections };
}

// Parses the home page's `ticker` frontmatter: lines separated by `|`, each
// optionally starting with `source: ` (the part shown as the line's label).
export function tickerLines(value) {
  return String(value ?? '')
    .split('|')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:\s][^:]*?):\s+(.+)$/);
      return m ? { source: m[1].trim(), text: m[2].trim() } : { source: '', text: line };
    });
}
