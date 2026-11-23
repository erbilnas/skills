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
WORKDIR /app
COPY --from=build /app/.output/ ./
# Catalog content is read from the filesystem at runtime.
COPY --from=build /app/skills ./skills
COPY --from=build /app/mcps ./mcps
COPY --from=build /app/rules ./rules
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "server/index.mjs"]
