FROM node:22 as build
WORKDIR /usr/src/app

RUN npm install -g pnpm@9.1.1

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install
COPY . .

RUN pnpm build

FROM node:22-alpine
COPY --from=build /usr/src/app/.output /app
WORKDIR /app

ENV PORT=80
EXPOSE 80
CMD ["node", "server/index.mjs"]