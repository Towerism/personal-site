# personal-site-redesign — Agent & Human Shipyard

## Project conventions
- Content is Markdown under `content/`; a change to wording never touches `templates/`, `public/` or `build.mjs`. Why: the owner must be able to edit the site without learning anything else.
- `marked` is the only runtime dependency. Add another only when the code it replaces is larger than the dependency's footprint and you state that comparison in the PR. Why: the site was redesigned to escape framework weight.
- No inline `<script>`, inline handler or `style=` attribute in output HTML. Why: the site ships a strict `script-src 'self'` CSP; one inline script breaks it.
- Every motion effect is gated by `prefers-reduced-motion` and by the `js` class on `<html>`; with either off, the page is complete static HTML. The one exception is the page cross-fade (`@view-transition`): an at-rule cannot be scoped to a class, and it runs once per navigation. Why: content must be readable without JS.
- Commit and branch rules come from the global workflow (Conventional Commits ending `(#N)`, no squash).

## Architecture principles
- The build script is a pipeline of pure functions (`lib/`) around one `build()` entry; tests call `build()` into a temp dir and never touch `dist/`.
- Visual and motion code is not unit tested; its pure parts live in `public/js/*-model.js` (`shouldAnimate` and `buildGraph` in `graph-model.js`, the motion toggle state in `motion-model.js`) so they can be.
- Graph data is derived from `content/home-network.md`; never hand-edit `dist/assets/graph.json`.
- `build.mjs` serves `public/css/*.css` and `public/js/*.js` under content-hashed names (`lib/assets.mjs`) and the Caddyfile caches those as immutable. Templates use the plain names; modules import each other only as `./name.js`, or the rewrite misses them.

## Shared background
- Glossary: GLOSSARY.md

## Agent guide
- Delivery follows the canonical workflow plan → execute → review → verify; `/oh-my-claudecode:launch` is an optional governed delivery pipeline (opt-in, invoke explicitly)
- On term conflicts GLOSSARY.md wins; new terms are recorded the moment they settle
- When a deferred surface first appears (standards, decision records, business knowledge, project skills, the design system), it gets an index section here at the moment it is created — never before
- Issue tracker: GitHub, `Towerism/personal-site-redesign`. The owner's spec for the redesign is the body of issue #1.
