# syntax=docker/dockerfile:1.7

# ------- Build stage -------
FROM oven/bun:1.3 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Build a Node server bundle (not the default Cloudflare Workers preset),
# because we run on a plain Iranian VPS with Node in Docker.
ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
RUN bun run build

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
