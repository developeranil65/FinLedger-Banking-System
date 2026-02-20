
# Stage 1: BUILD
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Copy source code
COPY . .

FROM gcr.io/distroless/nodejs20-debian12

# Set working directory
WORKDIR /app

# Copy only what we need from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json

# Set production environment
ENV NODE_ENV=production

# Expose the API port
EXPOSE 3000

# Run with Node.js
CMD ["server.js"]
