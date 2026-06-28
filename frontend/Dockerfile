FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Accept build-time env vars for Vite
ARG VITE_API_URL
ARG VITE_STRIPE_PRICE_STARTER
ARG VITE_STRIPE_PRICE_GROWTH
ARG VITE_STRIPE_PRICE_PRO
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PRICE_STARTER=$VITE_STRIPE_PRICE_STARTER
ENV VITE_STRIPE_PRICE_GROWTH=$VITE_STRIPE_PRICE_GROWTH
ENV VITE_STRIPE_PRICE_PRO=$VITE_STRIPE_PRICE_PRO

RUN npm run build

# ── Nginx to serve the production bundle ─────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing: fallback to index.html for client-side routes
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
