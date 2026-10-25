# Build stage: run the tests, then build dist/ from content/.
FROM node:22.23-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://martinfrackerjr.com
RUN npm test && SITE_URL="$SITE_URL" npm run build

# Serve stage: Caddy serves the static files only, as a non-root user. It
# listens on 8080, which needs no privilege to bind.
FROM caddy:2.11-alpine
RUN addgroup -S site && adduser -S -G site -H -s /sbin/nologin site \
	&& chown -R site:site /data /config
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
USER site
EXPOSE 8080
