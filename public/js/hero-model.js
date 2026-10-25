// Pure helpers for the hero's alive effects. No DOM access, so they run under node:test.

export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Splits text into words and the whitespace between them, losing nothing,
// so a heading can be wrapped word by word and still read the same.
export function splitWords(text) {
  return text.match(/\s+|\S+/g) ?? [];
}

export function isPictograph(word) {
  return /\p{Extended_Pictographic}/u.test(word);
}
