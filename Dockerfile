# syntax=docker/dockerfile:1.7

# ------- Build stage -------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Node server bundle preset is configured in vite.config.ts (nitro.preset).
ENV NODE_ENV=production
RUN npm run build

# Inline runtime helpers (__commonJSMin, __toESM, ...) into split vendor
# chunks. Works around a nitro/rolldown code-splitting bug that leaves those
# helpers undefined at first use, crashing SSR with
# "TypeError: __commonJSMin is not a function".
RUN node scripts/patch-runtime-helpers.mjs

# ------- Runtime stage -------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Nitro's node-server preset outputs a self-contained bundle under .output
COPY --from=build /app/.output ./.output

EXPOSE 4000
CMD ["node", ".output/server/index.mjs"]
