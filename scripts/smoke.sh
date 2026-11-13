#!/bin/sh
# Smoke-test a running site container: scripts/smoke.sh http://127.0.0.1:8080 <container>
set -eu
base=${1:?usage: smoke.sh <base-url> <container>}
container=${2:?usage: smoke.sh <base-url> <container>}
fail() { echo "smoke: $*" >&2; exit 1; }

docker exec "$container" wget -q --spider http://127.0.0.1:8080/ || fail 'compose healthcheck URL is not 200'
[ "$(docker exec "$container" id -u)" != 0 ] || fail 'container runs as root'

headers=$(curl -sfI "$base/about/") || fail '/about/ is not 200'
echo "$headers" | grep -qi "^content-security-policy: default-src 'none'" || fail 'CSP header missing'

missing=$(curl -s -o /dev/null -w '%{http_code}' "$base/no-such-page/")
[ "$missing" = 404 ] || fail "/no-such-page/ returned $missing, not 404"
curl -s "$base/no-such-page/" | grep -q 'class="big404"' || fail '404 page body missing'
# Error responses drop route headers, so the 404 handler imports them again.
curl -sI "$base/no-such-page/" | grep -qi "^content-security-policy: default-src 'none'" || fail 'CSP header missing on 404'

css=$(curl -sf "$base/" | grep -o '/_astro/[^"]*\.css' | head -1)
[ -n "$css" ] || fail 'no stylesheet linked from /'
curl -sfI "$base$css" | grep -qi '^cache-control: .*immutable' || fail "$css is not cached as immutable"

echo 'smoke: ok'
