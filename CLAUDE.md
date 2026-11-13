# personal-site-redesign — Agent & Human Shipyard

## Project conventions
- Content is Markdown under `content/`; a change to wording touches only `content/*.md`. Why: the owner must be able to edit the site without learning Astro.
- Content frontmatter must be valid YAML with `title` and `description` only; quote a value that contains `: `. Why: Astro's `glob` loader parses it strictly and the build fails otherwise.
- Output HTML carries no inline `<script>`, `<style>` or `style=` attribute, and no client JS ships; keep `build.inlineStylesheets: 'never'` in `astro.config.mjs`. Why: the Caddyfile CSP is `default-src 'none'` with only same-origin styles, fonts and images. `test/build.test.mjs` fails on a violation.
- Motion is limited to the `@view-transition` cross-fade, inside `prefers-reduced-motion: no-preference`. Why: the design is static and typographic.
- `docker-compose.yml` is deployed by Portainer from git and runs the image CI publishes to GHCR on a `v*.*.*` tag, never a local build; change its structure only on the owner's request. Why: building on the Raspberry Pi stalls the host, and a reboot mid-build left the old site live (#10). A change reaches the live site only after a tag push and a Portainer redeploy (README "Deploy").
- Commit and branch rules come from the global workflow (Conventional Commits ending `(#N)`, no squash).

## Architecture principles
- Astro 7, static output into `dist/`, served by Caddy on `:8080`. Pages: `src/pages/index.astro` (home.md), `[slug].astro` (every other content file), `404.astro` (404.md); a new `content/<slug>.md` becomes `/<slug>/` with no code change, but appears in the nav only when added to `nav` in `src/layouts/Base.astro`.
- All visual design lives in `src/styles/site.css`; tokens (`--paper`, `--ink`, `--signal`) are on `:root`. Rendered Markdown is styled through `.prose` selectors only, so content needs no classes or HTML.
- Visual design is checked by eye (screenshots at 1440px and 390px), not by tests. `test/build.test.mjs` covers built output; `scripts/smoke.sh` covers the running container.

## Shared background
- Glossary: GLOSSARY.md

## Agent guide
- Delivery follows the canonical workflow plan → execute → review → verify; `/oh-my-claudecode:launch` is an optional governed delivery pipeline (opt-in, invoke explicitly)
- On term conflicts GLOSSARY.md wins; new terms are recorded the moment they settle
- When a deferred surface first appears (standards, decision records, business knowledge, project skills, the design system), it gets an index section here at the moment it is created — never before
- Issue tracker: GitHub, `Towerism/personal-site`. The current design's spec is the body of issue #6.
