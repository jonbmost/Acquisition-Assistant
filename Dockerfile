# Use Node.js 24 as specified in package.json engines
FROM node:24-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build the Vite app
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Set environment variable
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
