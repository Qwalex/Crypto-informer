#!/bin/bash

# Скрипт полного запуска криптобота
# Автор: Криптобот Система
# Дата: $(date)

echo "🚀 Запуск системы криптобота..."
echo "================================"

# Проверка Docker
echo "🐳 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен!"
    exit 1
fi

echo "✅ Docker работает"

# Запуск Docker контейнеров
echo ""
echo "🔄 Запуск Docker контейнеров..."
npm run docker:up

sleep 5

# Проверка статуса контейнеров
echo ""
echo "📊 Проверка статуса контейнеров..."
docker-compose ps

# Ожидание готовности Python сервиса
echo ""
echo "⏳ Ожидание готовности Python сервиса..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Python сервис готов!"
        break
    fi
    
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo ""
    echo "⚠️  Python сервис не отвечает, но продолжаем запуск..."
fi

# Компиляция TypeScript
echo ""
echo "🔨 Компиляция TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции!"
    exit 1
fi

echo "✅ Компиляция завершена"

# Запуск основного приложения
echo ""
echo "🚀 Запуск основного приложения..."
echo "📊 Админ-панель будет доступна на: http://localhost:3003/admin"
echo "📈 Дашборд доступен в файле: dashboard.html"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запуск в режиме разработки
npm run dev
