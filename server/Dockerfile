# --- Dependencies -----------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Runtime ------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# node:alpine ships a non-root "node" user; run as it instead of root
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "src/server.js"]
