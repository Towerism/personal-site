import { createHash } from 'node:crypto';
import { posix } from 'node:path';

// Matches `from './x.js'`, `import './x.js'` and `import('./x.js')`.
const SPECIFIER = /\b(from|import)(\s*\(?\s*)(['"])\.\/([\w.-]+\.js)\3/g;

// Content-hashes static assets so they can be cached forever: `css/site.css`
// becomes `css/site.<8 hex>.css`. Relative imports between the files are
// rewritten to the hashed names first, so a change in a module also renames
// every module that imports it. `files` maps paths to text.
// Returns { names: old path -> hashed path, contents: hashed path -> text }.
export function hashAssets(files) {
  const names = new Map();
  const contents = new Map();
  const visit = (file) => {
    if (names.has(file)) return names.get(file);
    const dir = posix.dirname(file);
    const text = files.get(file).replace(SPECIFIER, (match, keyword, gap, quote, spec) => {
      const target = posix.join(dir, spec);
      if (!files.has(target))
        throw new Error(`${file} imports ./${spec}, which is not a hashed asset`);
      return `${keyword}${gap}${quote}./${posix.basename(visit(target))}${quote}`;
    });
    const hash = createHash('sha256').update(text).digest('hex').slice(0, 8);
    const ext = posix.extname(file);
    const name = `${file.slice(0, -ext.length)}.${hash}${ext}`;
    names.set(file, name);
    contents.set(name, text);
    return name;
  };
  for (const file of files.keys()) visit(file);
  return { names, contents };
}
