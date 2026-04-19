# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias para Prisma (openssl)
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

COPY . .

# Production stage
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
