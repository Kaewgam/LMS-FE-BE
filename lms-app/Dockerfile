# Stage 1: Build the Next.js application
FROM oven/bun as builder

WORKDIR /app

# Copy package.json and bun.lockb first to leverage Docker caching
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application files
COPY . .

# Build the Next.js application for production
RUN bun --bun run build

# Stage 2: Create the production image
FROM oven/bun

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js runs on (default is 3000)
EXPOSE 3000

# Start the Next.js production server with Bun
CMD ["bun", "--bun", "run", "start"]