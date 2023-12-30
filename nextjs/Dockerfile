FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY . ./

RUN npm ci
RUN npm run build

# デプロイ用ファイルを配置
RUN mkdir -p /deploy
RUN cp -r /app/.next/standalone/. /deploy/
RUN mkdir -p /deploy/public
RUN mkdir -p /app/public
RUN cp -r /app/public/. /deploy/public/
RUN mkdir -p /deploy/.next/static
RUN cp -r /app/.next/static/. /deploy/.next/static/

# 実行用コンテナ
FROM node:20-bookworm-slim AS runner
COPY --from=builder /deploy /app
WORKDIR /app
CMD ["node", "server.js"]