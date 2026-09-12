# syntax=docker/dockerfile:1

ARG DIST_DIR=

# ── Stage 1: Build frontend assets when no prebuilt dist is supplied. ──
FROM node:22-alpine AS frontend-builder

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

# Cache dependencies
COPY ui/web/package.json ui/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY ui/web/ .
RUN pnpm build

# ── Stage 2: Accept either a prebuilt dist or the generated output above. ──
FROM busybox AS dist-loader
ARG DIST_DIR
WORKDIR /app

COPY . /src
COPY --from=frontend-builder /app/dist /tmp/built-dist

RUN set -eux; \
    mkdir -p /app/dist; \
    if [ -n "$DIST_DIR" ]; then \
    cp -a "/src/${DIST_DIR}/." /app/dist/; \
    else \
    cp -a /tmp/built-dist/. /app/dist/; \
    fi

# ── Stage 3: Serve ──
FROM nginx:1.27-alpine

# Copy built assets — force 0755 so the nginx worker (non-root) can read them
# regardless of pnpm's build-time umask (see #761).
COPY --chmod=0755 --from=dist-loader /app/dist /usr/share/nginx/html

# Copy nginx config
COPY ui/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1
