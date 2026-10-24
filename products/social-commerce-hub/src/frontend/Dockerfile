# ==========================================
# Multi-Stage Production Dockerfile: Frontend
# Target: React 19 + Vite + Nginx Alpine
# ==========================================

# 1. Build Stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install clean dependencies
RUN npm ci || npm install

# Copy source tree and compile assets
COPY . .
RUN npm run build

# 2. Production Stage with Nginx Alpine
FROM nginx:1.27-alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
