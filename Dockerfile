FROM node:20-slim

WORKDIR /app

# Install netcat and openssl for Prisma and DB readiness checking
RUN apt-get update && apt-get install -y --no-install-recommends \
    netcat-traditional \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm install
RUN npx prisma generate

# Copy source code
COPY . .

# Build Vite frontend assets
RUN npm run build

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3010

ENTRYPOINT ["./docker-entrypoint.sh"]
