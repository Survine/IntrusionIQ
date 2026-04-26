# ══════════════════════════════════════════════════════════════
# STAGE 1 — Build Stage
# Node only needed to compile React → static files
# This entire stage gets discarded after build
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# ── Dependency layer (same cache optimization as backend) ─────
# package.json + lock file copied FIRST
# node_modules only reinstalled when these files change
COPY package.json package-lock.json ./
RUN npm ci
# npm ci vs npm install:
# ci = clean install, uses lock file exactly, faster, reproducible
# install = may update versions, non-deterministic in CI/CD

# ── Copy source and build ─────────────────────────────────────
COPY . .
RUN npm run build
# Output: /app/dist/ — plain HTML, CSS, JS
# No Node process needed to serve these files


# ══════════════════════════════════════════════════════════════
# STAGE 2 — Production Stage
# Only this stage becomes the final image
# node_modules, source code, build tools — all gone
# ══════════════════════════════════════════════════════════════
FROM nginx:alpine

# Copy ONLY the built static files from Stage 1
# Everything else from Stage 1 is discarded
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (Chunk 3 — we'll write this next)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx -g daemon off:
# runs Nginx in foreground — Docker requires this
# without it Nginx forks to background and Docker thinks
# the process died and kills the container
CMD ["nginx", "-g", "daemon off;"]