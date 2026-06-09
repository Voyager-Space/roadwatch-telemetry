# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy monorepo package files
COPY package.json yarn.lock ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install dependencies
RUN corepack enable
RUN yarn install

# Copy source code
COPY . .
RUN yarn install
# Generate Prisma Client & Build Packages
WORKDIR /app/packages/shared-types
RUN yarn build

WORKDIR /app/packages/shared-utils
RUN yarn build

WORKDIR /app/apps/backend
RUN npx prisma generate
RUN yarn build

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

WORKDIR /app/apps/backend

EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]