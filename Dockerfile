FROM node:24-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat dumb-init python3 make g++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package.json ./

RUN npm install --include=dev --no-package-lock

COPY . .

ARG MONGO_CONNECTION_URL=mongodb://localhost:27017
ENV MONGO_CONNECTION_URL=${MONGO_CONNECTION_URL}
ARG MONGONAUT_READONLY=false
ENV MONGONAUT_READONLY=${MONGONAUT_READONLY}
ARG MONGONAUT_TIMEOUT=5000
ENV MONGONAUT_TIMEOUT=${MONGONAUT_TIMEOUT}
ARG MONGONAUT_AUTH_MODE=NONE
ENV MONGONAUT_AUTH_MODE=${MONGONAUT_AUTH_MODE}

ENV NODE_ENV=production

RUN npm run build

FROM node:24-alpine
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN apk update && apk upgrade && apk add --no-cache libc6-compat dumb-init

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 8081
ENV PORT=8081
ENV HOSTNAME="0.0.0.0"

USER nextjs

CMD ["dumb-init", "node", "server.js"]