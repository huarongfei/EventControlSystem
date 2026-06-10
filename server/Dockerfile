# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

RUN npm run prisma:generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

RUN addgroup -g 1001 -S ecs && \
    adduser -u 1001 -S ecs -G ecs

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --legacy-peer-deps --omit=dev && \
    npm cache clean --force

# 日志目录（卷挂载 + 容器内回退）
RUN mkdir -p /app/logs && chown ecs:ecs /app/logs

USER ecs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "dist/index.js"]
