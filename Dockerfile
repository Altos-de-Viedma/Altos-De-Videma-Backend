# Production Dockerfile for Altos de Viedma Backend
# Updated: 2026-03-25 - Enhanced Security Configuration

# Build stage
FROM node:20-alpine AS builder

# Security: Update packages and remove unnecessary ones
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Security: Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json yarn.lock* .npmrc ./

# Security: Install dependencies with ignore-scripts
RUN yarn install --frozen-lockfile --production=false --ignore-scripts

# Copy source code
COPY --chown=nodejs:nodejs . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

# Security: Update packages and install security tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init tini && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV NPM_CONFIG_IGNORE_SCRIPTS=true

# Copy package files
COPY --chown=nodejs:nodejs package*.json yarn.lock* .npmrc ./

# Security: Install only production dependencies with ignore-scripts
RUN yarn install --frozen-lockfile --production=true --ignore-scripts && \
    yarn cache clean

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Security: Remove write permissions from application files
RUN chmod -R 555 /app && \
    chmod -R 755 /app/dist && \
    chmod -R 644 /app/dist/**/*.js && \
    chmod -R 444 /app/public

# Switch to non-root user
USER nodejs

# Security: Use non-privileged port
EXPOSE 3010

# Security: Start with tini for proper signal handling and security
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/src/main.js"]