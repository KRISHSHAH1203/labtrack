# Build the React frontend
FROM node:20-alpine AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Build the API
FROM node:20-alpine AS api
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# Small runtime image, non-root user
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 STATIC_DIR=/app/web
COPY --from=api /server/node_modules ./node_modules
COPY --from=api /server/dist ./dist
COPY --from=web /web/dist ./web
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "-r", "./dist/tracing.js", "dist/index.js"]
