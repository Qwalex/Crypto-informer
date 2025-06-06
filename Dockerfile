# Production Dockerfile для криптовалютного сигнального бота
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем TypeScript конфигурацию и исходный код
COPY tsconfig.json ./
COPY src/ ./src/

# Копируем views и public директории
COPY views/ ./views/
COPY public/ ./public/

# Устанавливаем dev зависимости для сборки
RUN npm install --only=dev

# Собираем TypeScript проект
RUN npm run build

# Удаляем dev зависимости после сборки
RUN npm prune --production

# Копируем конфигурационные файлы
COPY bot-config.json ./

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Даем права на директорию приложения
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Команда запуска
CMD ["node", "dist/index.js"]
