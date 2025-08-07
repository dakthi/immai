# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies first (cached if pnpm-lock.yaml doesn't change)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application code (but .dockerignore will exclude junk like node_modules)
COPY . .

# Generate Drizzle schema
RUN pnpm db:generate

# Build Next.js app (using CI build to skip migrations)
# Set dummy environment variables for build
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm build:ci


# ---- Stage 2: Production Image ----
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose Next.js port
EXPOSE 3000

# Start the Next.js server
CMD ["pnpm", "start"]
