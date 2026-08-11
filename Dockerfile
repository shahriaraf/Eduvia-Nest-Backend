# syntax=docker/dockerfile:1

# ---------- Stage 1: install deps + compile TypeScript ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

RUN npm prune --omit=dev

# ---------- Stage 2: minimal runtime image ----------
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --chown=nestjs:nodejs package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/' + (process.env.API_PREFIX || 'api') + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run pending migrations, then start the API. Set RUN_MIGRATIONS_ON_BOOT=false
# to skip migrations (e.g. if they're run as a separate CI/CD step instead).
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS_ON_BOOT\" != \"false\" ]; then npm run migration:run:prod; fi && node dist/main.js"]
