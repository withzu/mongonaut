FROM node:24-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ENV NODE_ENV=production
ENV CI=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="Mongonaut" \
      org.opencontainers.image.description="A modern, open source MongoDB web interface built for self hosted environments." \
      org.opencontainers.image.url="https://mongonaut.org" \
      org.opencontainers.image.documentation="https://mongonaut.org" \
      org.opencontainers.image.source="https://github.com/withzu/mongonaut" \
      org.opencontainers.image.vendor="The Zu Company" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.base.name="docker.io/library/node:24-alpine"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8081
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8081)+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["dumb-init", "node", "server.js"]
