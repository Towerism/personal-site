// Splits a Markdown file into `key: value` frontmatter and the body after it.
// Only flat string values are supported; that is all a content page needs.
export function parseFrontmatter(text, file) {
  const src = text.replace(/\r\n?/g, '\n');
  if (!src.startsWith('---\n')) return { data: {}, body: src };

  const end = src.indexOf('\n---', 3);
  const closesLine = end !== -1 && (src[end + 4] === '\n' || end + 4 === src.length);
  if (!closesLine) throw new Error(`${file}: frontmatter block is not closed with "---"`);

  const data = {};
  for (const line of src.slice(4, end + 1).split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) throw new Error(`${file}: frontmatter line has no "key:": ${line}`);
    data[line.slice(0, colon).trim()] = unquote(line.slice(colon + 1).trim());
  }
  return { data, body: src.slice(end + 5) };
}

function unquote(value) {
  const q = value[0];
  if ((q === '"' || q === "'") && value.length > 1 && value.endsWith(q)) return value.slice(1, -1);
  return value;
}
