# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp and Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy monorepo configuration
COPY package.json yarn.lock ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui-components/package.json ./packages/ui-components/

RUN corepack enable
RUN yarn install

# Copy source code
COPY . .

# Build internal shared packages first
WORKDIR /app/packages/shared-types
RUN yarn build

WORKDIR /app/packages/ui-components
RUN yarn build

# Build Next.js app
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN yarn build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone Next.js monorepo output
COPY --from=builder /app/apps/frontend/.next/standalone ./
# Copy static assets (Crucial: Your commented line was causing missing assets!)
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Set ownership to the non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Note: The standalone output mirrors your monorepo folder structure
CMD ["node", "apps/frontend/server.js"]