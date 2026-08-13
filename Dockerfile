FROM node:24 AS build
WORKDIR /usr/src/app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine
COPY --from=build /usr/src/app/.output /app
WORKDIR /app

ENV PORT=80
EXPOSE 80
CMD ["node", "server/index.mjs"]
