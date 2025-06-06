# Multi-stage build для production
FROM node:18-alpine AS builder

# Установка build tools для native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копируем файлы пакетов
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки TypeScript)
RUN npm ci

# Копируем исходный код
COPY src/ ./src/

# Компилируем TypeScript
RUN npm run build

# Production образ
FROM node:18-alpine AS production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S crypto-bot -u 1001

WORKDIR /app

# Копируем файлы пакетов и устанавливаем только production зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем скомпилированный код
COPY --from=builder /app/dist ./dist

# Копируем конфигурационные файлы
COPY bot-config.json ./
COPY public/ ./public/
COPY views/ ./views/

# Устанавливаем права доступа
RUN chown -R crypto-bot:nodejs /app

USER crypto-bot

# Открываем порт для API
EXPOSE 3000

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Запуск приложения (запускаем уже скомпилированный код)
CMD ["sh", "-c", "node dist/index.js & node dist/api-server.js & wait"]
