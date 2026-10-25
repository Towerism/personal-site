# martinfrackerjr.com

Personal site of Martin Fracker, Jr. One script (`build.mjs`) turns the Markdown in `content/` into static HTML in `dist/`. No framework; the only dependency is `marked`. Needs Node 22 or newer (`.nvmrc` pins the major version).

## Edit content

Each page is a Markdown file in `content/`:

| File | URL |
| --- | --- |
| `home.md` | `/` |
| `about.md` | `/about/` |
| `home-network.md` | `/home-network/` |
| `404.md` | `/404.html` |

Every file starts with frontmatter. Both fields are required and the build fails without them:

```markdown
---
title: About me
description: One sentence for search results and link previews, 160 characters at most.
---
# About me
```

`home.md` has one more, optional field, `ticker`: the lines of the status board next to the home page heading, separated by `|`. A line that starts with `name: ` shows the name as its label. Leave the field out to drop the board.

```markdown
ticker: caddy: serving through a Cloudflare Tunnel | adguard: another ad, blocked | 🐧: tinkering in progress
```

The optional `status` field is the board's heading (default `homelab status`). The lines are playful copy, not live data, and the heading says so: `status: homelab status (mostly fiction)`.

Use one `#` heading per page and don't skip heading levels. Raw HTML is escaped, so write plain Markdown.

To add a service to the home network page, add a `### Name` section under `## Services` in `home-network.md`. It becomes a card on that page, a node in the graph on the home page, and a link in the list under the graph. The first sentence is the node's summary.

The build checks every internal link, including `#fragments`, and stops on a broken one, naming both pages.

The build renames each CSS and JS file after a hash of its content (`css/site.css` becomes `css/site.1a2b3c4d.css`) and rewrites the references in pages and between modules, so the server can cache them forever. Reference them from templates by their plain names; import modules with `./name.js` specifiers.

## Run and build

```sh
npm install
npm run dev     # build, serve on 0.0.0.0:8080 (reachable from your LAN), rebuild on change (HOST=127.0.0.1 to keep it local, PORT to change)
npm test        # node:test suite
npm run lint    # ESLint (recommended rules)
npm run format  # Prettier; `npm run format:check` only reports
npm run check   # lint, format check and tests, as CI runs them
npm run build   # writes dist/
```

Canonical and Open Graph URLs use `https://martinfrackerjr.com`; set `SITE_URL` to build for another address.

## Deploy

The `Dockerfile` runs the tests, builds the site with `node:22.23-alpine`, and copies `dist/` into a `caddy:2.11-alpine` image that runs as a non-root user. CI builds the image for `linux/amd64` and `linux/arm64`. The `Caddyfile` sets the security headers (including a CSP that allows only same-origin scripts) and cache rules.

```sh
docker build -t personal-site .
docker run -p 8080:8080 personal-site
```

`docker-compose.yml` builds the same image and publishes it on `PORT` (default 8080). Portainer deploys the stack from this repository: edit `docker-compose.yml` in git, then pull from the stack page to update it. Set `SITE_URL` in the stack's environment to build for another address.

Caddy listens on port 8080 and expects TLS to end in front of it; the proxy that ends TLS should send HSTS. To have Caddy manage HTTPS itself, run it with `-e SITE_ADDRESS=martinfrackerjr.com` and publish ports 80 and 443 (the Caddy binary may bind them without root). Caddy then sends HSTS on its HTTPS responses.

## Layout

```
content/    Markdown pages (edit these)
templates/  HTML layout and the graph figure
public/     CSS, JS, favicon and social image, copied to dist/ (CSS and JS under content-hashed names)
lib/        frontmatter parser and Markdown renderer
build.mjs   the build
scripts/    dev server
test/       tests
```

## CI and releases

`.github/workflows/ci.yml` runs lint, the format check, tests and the build on every pull request and push to `main`, and builds the image. Pushing a tag such as `v1.2.3` also pushes `ghcr.io/towerism/personal-site-redesign` tagged `1.2.3`, `1.2`, `1` and `latest`.
