# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc ./
# pnpm store 走 BuildKit 缓存，跨构建复用，不再重复下载
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* 必须在 build 阶段注入（Next.js 构建时内联）
ARG NEXT_PUBLIC_PLATFORM_API=""
ARG NEXT_PUBLIC_USE_PLATFORM="false"
ENV NEXT_PUBLIC_PLATFORM_API=$NEXT_PUBLIC_PLATFORM_API
ENV NEXT_PUBLIC_USE_PLATFORM=$NEXT_PUBLIC_USE_PLATFORM
# .next/cache 走 BuildKit 缓存，加速增量构建
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
