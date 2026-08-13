# personal-site

[martinfrackerjr.com](https://martinfrackerjr.com) — a content-driven personal site
built with Nuxt, Nuxt Content, and Tailwind CSS.

This is a port of the original Nuxt 3 / Content v2 / Tailwind v3 site onto the
current Nuxt major. See [Port notes](#port-notes) for what changed and why.

## Stack

|                 |                                                             |
| --------------- | ----------------------------------------------------------- |
| Framework       | Nuxt 4.5 (`app/` srcDir layout)                             |
| Content         | Nuxt Content 3.15 (collections + `queryCollection`)         |
| Styling         | Tailwind CSS 4.3 via `@tailwindcss/vite` (CSS-first config) |
| Utilities       | VueUse 14                                                   |
| Runtime         | Node 24, Nitro `node-server` preset                         |
| Package manager | pnpm 11                                                     |

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Serves on http://localhost:3000.

## Production

```bash
pnpm build
```

The three content pages are prerendered at build time; unknown paths fall
through to the server so they render the 404 partial with a real 404 status.
Preview the built output with:

```bash
pnpm preview
```

## Other scripts

```bash
pnpm typecheck
```

```bash
pnpm format
```

## Deployment

Unchanged from the original: a multi-stage Docker build produces a Nitro
`node-server` bundle, pushed to `martinfjr/personal-site` by the
`Docker image` GitHub workflow and run behind Caddy via `docker-compose.yml`.

```bash
pnpm docker:deploy
```

## Layout

```
app/
  app.vue                 root component, title template
  assets/css/main.css     Tailwind entry + @theme design tokens + base styles
  components/             AppNavBar, AppFooter, AppPartial, DarkModeToggle, HamburgerButton
  layouts/default.vue     nav + main + footer shell
  pages/[...slug].vue     catch-all, renders a content page or the 404 partial
content/
  index.md                -> /
  about.md                -> /about
  home-network.md         -> /home-network
  partials/404.md         non-routable, rendered by <AppPartial>
content.config.ts         collection definitions
```

## Port notes

### Nuxt 3 → 4

- Application code moved into `app/` (Nuxt 4's default `srcDir`). `content/`,
  `public/`, and config files stay at the repo root.
- The root `tsconfig.json` is now a project-references stub pointing at the four
  generated `.nuxt/tsconfig.*.json` files; `server/tsconfig.json` is gone.
- `nav` + `footer` moved out of the page and into `app/layouts/default.vue`.
  Because a layout renders _outside_ `<RouterView>`, `AppNavBar` can no longer
  use `onBeforeRouteUpdate` / `onBeforeRouteLeave` — those now warn and no-op
  under vue-router 5. It watches `route.path` instead, which closes the mobile
  menu and releases the scroll lock on every navigation.
- Do **not** add `vue-router` to `dependencies`. Nuxt 4.5 pulls in vue-router 5;
  pinning v4 downgrades it and breaks `vue-tsc` (the generated tsconfig
  references `vue-router/volar/sfc-route-blocks`, which v4 does not export).

### Content v2 → v3

- `<ContentDoc>` and `<ContentQuery>` no longer exist. `[...slug].vue` calls
  `queryCollection('content').path(route.path).first()` and renders the result
  with `<ContentRenderer>`; `AppPartial` does the same against the `partials`
  collection.
- Collections are declared in `content.config.ts`. There are two: `content`
  (routable pages, excluding `partials/**`) and `partials` (fragments).
- v3 dropped the leading-underscore convention for non-routable files, so
  `content/_404.md` became `content/partials/404.md`.
- `@nuxt/content` v3 needs an explicit SQLite driver — `better-sqlite3` is a
  direct dependency, and pnpm needs it listed under `allowBuilds` in
  `pnpm-workspace.yaml` since native postinstalls are opt-in from pnpm 10 on.
- MDC inline attributes (`[🚀]{class="text-3xl"}`) still work unchanged.

### Tailwind v3 → v4

- `@nuxtjs/tailwindcss` and `tailwind.config.js` are gone. Tailwind is wired in
  as a Vite plugin (`@tailwindcss/vite`) and configured in CSS.
- `@tailwind base/components/utilities` → a single `@import "tailwindcss"`.
- `darkMode: "selector"` → `@custom-variant dark (&:where(.dark, .dark *))`.
- `theme.extend` → the `@theme` block in `main.css`. v4 folds `padding` and
  `spacing` into one `--spacing-*` namespace and prefers kebab-case, so the old
  `p-section_x` is now `p-section-x`. These tokens were unused in the original
  markup and are carried over as-is; Tailwind only emits them once referenced.
- `@screen md { … }` → `md:` variants inline on the base heading rules.
- `@apply` inside a component `<style>` block now requires a
  `@reference "../assets/css/main.css"` line at the top of that block.
- `bg-opacity-60` was removed in v4; the nav uses `bg-gray-50/60` now.
- Markdown lives outside `app/`, so `main.css` has an explicit
  `@source "../../../content"` to keep MDC-applied classes from being purged.

### Behaviour changes

These are deliberate fixes, not straight ports:

- **Dark-mode flash.** The theme was only applied in `onBeforeMount`, so an
  SSR'd page painted light before hydration. A small inline script in
  `nuxt.config.ts` now sets the `dark` class before first paint. It reads the
  same `theme` localStorage key as `DarkModeToggle.vue` — keep the two in sync.
- **Toggle hydration.** Which icon to draw depends on localStorage, which the
  server cannot know, so `DarkModeToggle` renders inside `<ClientOnly>` with a
  same-size fallback to avoid a mismatch and a layout shift.
- **System-preference query.** The original used
  `not all and (prefers-color-scheme: light)`, which also matches browsers
  reporting _no_ preference and defaults them to dark. This uses the standard
  `(prefers-color-scheme: dark)`. Revert if the old behaviour was intended.
- **404 status.** Content v2's `<ContentDoc>` handled the miss case implicitly;
  the catch-all now calls `setResponseStatus(event, 404)` so unknown paths
  return 404 rather than 200.
- **Broken 404 link.** `content/partials/404.md` linked to `/home`, which has
  never existed — the homepage is `/`.
- Invalid SVG attributes in `HamburgerButton.vue` (`strokewidth`,
  `strokelinecap`, `shaperendering`) were corrected to their hyphenated forms,
  and stray `data-v-a2682a23` attributes were dropped from `DarkModeToggle`.
- Pages now set `<title>` and `<meta name="description">` from the content
  document's first heading and paragraph.

### Not Nuxt 5

Nuxt 5 has not been released — npm's `latest` is 4.5.2 with no 5.x tag. This
targets Nuxt 4.5, which already carries the changes a v5 port would mostly
consist of (the `app/` layout, Content v3, Tailwind v4). When v5 ships, the
upgrade should be `pnpm up nuxt` plus a `compatibilityDate` bump.
