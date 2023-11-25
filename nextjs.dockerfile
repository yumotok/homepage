FROM node:20-bookworm-slim AS builder

WORKDIR /app

# nextjs
COPY ./nextjs .

RUN npm ci
RUN npm run build

# デプロイ
WORKDIR /deploy

RUN cp -r /app/public ./public
RUN mkdir -p ./.next/static
RUN cp -r /app/.next/static ./.next/static
RUN cp -r /app/.next/standalone ./

# 実行用コンテナ
FROM node:20-bookworm-slim AS runner
COPY --from=builder /deploy /app
WORKDIR /app
CMD ["node", "server.js"]