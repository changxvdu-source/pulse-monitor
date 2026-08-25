FROM node:22-bookworm-slim AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV OPERATOR_EMAIL=build@pulse.invalid
ENV OPERATOR_PASSWORD=build-only-not-used
ENV SESSION_SECRET=build-session-secret-placeholder-32ch
ENV DATABASE_PATH=/tmp/pulse-build.db
RUN npm run build && npm run build:worker

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/worker.cjs ./worker.cjs

EXPOSE 3000
CMD ["node", "server.js"]
