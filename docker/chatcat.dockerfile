FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app

COPY patches patches
COPY static static
COPY .npmrc .npmrc
COPY bun.lock bun.lock
COPY package.json package.json
COPY svelte.config.js svelte.config.js
COPY tsconfig.json tsconfig.json
COPY vite.config.ts vite.config.ts

RUN bun install
RUN bun patch svelte-adapter-bun

COPY src src

RUN bun run build
RUN ls build

FROM oven/bun:1.3.14-alpine

RUN mkdir -p /build

COPY --from=builder /app/build /build

WORKDIR build

CMD ["bun", "index.js"]
