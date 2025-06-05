#!/bin/bash

echo "🚀 Запуск системы анализа криптовалютного рынка..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Скопируйте .env.example в .env и заполните необходимые параметры."
    exit 1
fi

# Запускаем Python сервис
echo "🐍 Запуск Python сервиса..."
docker-compose up -d

# Ждем запуска сервиса
echo "⏳ Ожидание запуска Python сервиса..."
sleep 10

# Проверяем статус Python сервиса
echo "🔍 Проверка статуса Python сервиса..."
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✅ Python сервис запущен успешно"
else
    echo "⚠️ Python сервис может быть недоступен, но бот попробует работать без него"
fi

# Устанавливаем Node.js зависимости если не установлены
if [ ! -d "node_modules" ]; then
    echo "📦 Установка Node.js зависимостей..."
    npm install
fi

# Компилируем TypeScript
echo "🔨 Компиляция TypeScript..."
npm run build

# Запускаем бота
echo "🤖 Запуск криптовалютного бота..."
npm start
