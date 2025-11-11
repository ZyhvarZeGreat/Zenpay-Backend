# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy artifacts (smart contract ABIs)
COPY artifacts ./artifacts/

# Copy application code
COPY src ./src

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]

