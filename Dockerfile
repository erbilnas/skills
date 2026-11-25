FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Nitro's node_modules layout follows Node resolution; Bun does not resolve
# sibling packages the same way and can crash at runtime.
FROM node:20-bookworm-slim
# Coolify Dockerfile deploys probe with curl/wget; slim has neither.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/.output/ ./
# Catalog content is read from the filesystem at runtime.
COPY --from=build /app/skills ./skills
COPY --from=build /app/mcps ./mcps
COPY --from=build /app/rules ./rules
COPY --from=build /app/sets ./sets
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server/index.mjs"]
