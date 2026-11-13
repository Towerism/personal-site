---
documentLanguage: en
---

# Glossary

One entry per term: definition, boundaries, one resolved ambiguity. Agents write here the moment a term is settled. Vocabulary here is law for all specs, tickets, and code naming. Ship-specific terms only: a concept any sea chart carries does not get an entry.

## Content page
- Definition: a Markdown file in `content/` with `title` and `description` frontmatter; it becomes one HTML page.
- Boundary: is the owner-edited source, not a template and not generated output.
- Avoid: "post", "document".
- Resolved ambiguity: `404.md` is a content page but emits `404.html`, not a directory route.

## Signal
- Definition: the single accent color (`--signal`, orange-red) of the design.
- Boundary: marks numbering, the left page edge, link underlines and the 404 numeral; body text is never set in it.
- Avoid: "brand color", "primary".
- Resolved ambiguity: it stays the same in dark mode; only paper and ink swap.

## Masthead
- Definition: the home page's viewport-sized rendering of `home.md`'s `title`.
- Boundary: is decoration (`aria-hidden`); the page's `<h1>` is still the Markdown's `#` heading.
- Avoid: "hero".
- Resolved ambiguity: its words come from frontmatter, so renaming the site is a content edit.
