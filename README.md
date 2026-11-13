# martinfrackerjr.com

Personal site of Martin Fracker, Jr. [Astro](https://astro.build) builds the Markdown in `content/` into static HTML; Caddy serves it from a container. Needs Node 24 (`.nvmrc`).

## Edit content

Each page is a Markdown file in `content/`:

| File              | URL              |
| ----------------- | ---------------- |
| `home.md`         | `/`              |
| `about.md`        | `/about/`        |
| `home-network.md` | `/home-network/` |
| `404.md`          | `/404.html`      |

Every file starts with YAML frontmatter. Both fields are required and the build fails without them:

```markdown
---
title: About me
description: One sentence for search results and link previews, 160 characters at most.
---

# About me
```

Quote a value that contains a colon followed by a space (`description: "Note: like this"`).

Use one `#` heading per page. On wide screens `##` headings span the page, `###` headings sit in the left column next to their text and are numbered, and list items are numbered rows. Any other `content/<name>.md` becomes `/<name>/`; add it to `nav` in `src/layouts/Base.astro` to link it from the header.

## Run and build

```sh
npm install
npm run dev           # dev server with live reload
npm test              # builds into a temp dir and checks the output
npm run build         # writes dist/
npm run format        # Prettier; format:check only reports
```

Canonical and Open Graph URLs use `https://martinfrackerjr.com`; set the `SITE_URL` environment variable (or `docker build --build-arg SITE_URL=...`) to build for another address.

## Deploy

The `Dockerfile` runs the tests, builds with `node:24-alpine` and copies `dist/` into a `caddy:2.11-alpine` image that runs as a non-root user on port 8080. The `Caddyfile` sets the security headers (a CSP that allows no scripts at all), caches `/_astro/*` forever and serves `404.html` with a 404 status.

```sh
docker build -t personal-site .
docker run -d --name site -p 8080:8080 personal-site
scripts/smoke.sh http://127.0.0.1:8080 site
```

Portainer deploys `docker-compose.yml` from this repository: the container joins the external `web-proxy-net` network as `personal-site` and publishes no ports; the Caddy proxy there ends TLS, sends HSTS and forwards to `http://personal-site:8080`. It runs `ghcr.io/towerism/personal-site:latest`, the image CI publishes; the Raspberry Pi never builds the image itself, because the build stalls the whole host.

To ship a change:

1. Merge it to `main`.
2. Push a semver tag with no leading zeros, such as `v2026.1.5` (not `v2026.01.05`, which CI cannot publish), and wait for CI's `image` job to pass; it publishes the new `latest`.
3. In Portainer, redeploy the `personal-site` stack. `pull_policy: always` makes it pull the new `latest`.

## CI and releases

`.github/workflows/ci.yml` runs the format check, tests and build, then builds the image, smoke-tests it and builds it for `linux/amd64` and `linux/arm64`. Pushing a tag such as `v2.0.0` also pushes `ghcr.io/towerism/personal-site` tagged `2.0.0`, `2.0`, `2` and `latest`.
