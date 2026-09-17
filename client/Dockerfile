# --- Build --------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Relative by default so nginx can reverse-proxy /api/* to the backend
# container; override at build time for a different deployment topology.
ARG VITE_API_URL=/api/tasks
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Runtime --------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
