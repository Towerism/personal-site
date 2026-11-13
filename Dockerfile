# Build stage: run the tests, then build dist/. CI builds the arm64 image by
# running this stage under QEMU; the Pi pulls that image and never builds (#10).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://martinfrackerjr.com
ENV SITE_URL=$SITE_URL
RUN npm test && npm run build

# Serve stage: Caddy serves the static files as a non-root user on 8080.
# busybox wget is included for the docker-compose healthcheck.
FROM caddy:2.11-alpine
RUN addgroup -S site && adduser -S -G site -H -s /sbin/nologin site \
	&& chown -R site:site /data /config
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
USER site
EXPOSE 8080
