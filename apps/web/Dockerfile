# Builder stage: Install dependencies and build the application
FROM node:20-alpine AS builder

# Enable Corepack to use pnpm (specified in root package.json)
RUN corepack enable

WORKDIR /app

# Copy workspace root files first (needed for pnpm)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all workspace packages to preserve structure
COPY apps ./apps
COPY packages ./packages

# Install all dependencies with frozen lockfile for reproducibility
RUN pnpm install --frozen-lockfile

# Build the web app (and its dependencies if any)
# Only build the web app, not the entire workspace
RUN pnpm --filter @accountpilot/web build

# Runtime stage: Create minimal production image
FROM node:20-alpine

# Enable Corepack in runtime image as well
RUN corepack enable

WORKDIR /app

# Copy only necessary files from builder
# Copy workspace configuration
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/package.json ./

# Copy built web app and its node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables for Next.js build info
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NODE_ENV=production

# Expose port (Railway will override with $PORT)
EXPOSE 3000

# Change to web app directory and start the application
WORKDIR /app/apps/web
CMD ["sh", "-c", "next start -p ${PORT:-3000}"]

