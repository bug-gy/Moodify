# ---- Stage 1: Build client ----
FROM node:20-alpine AS client
WORKDIR /build/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ .
RUN npm run build

# ---- Stage 2: Production server ----
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    pip3 install ytmusicapi yt-dlp --break-system-packages && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./
RUN npm ci --production

COPY server/ .

COPY --from=client /build/client/dist ./public

EXPOSE 5000

CMD ["node", "server.js"]
