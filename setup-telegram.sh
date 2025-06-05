#!/bin/bash

echo "============================================"
echo "   🤖 Скрипт настройки Telegram Chat ID"
echo "============================================"
echo

# Переходим в директорию скрипта
cd "$(dirname "$0")"

echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "📥 Установка зависимостей npm..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей"
        exit 1
    fi
fi

if [ ! -d "dist" ]; then
    echo "🔨 Сборка проекта..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка сборки проекта"
        exit 1
    fi
fi

echo
echo "🚀 Запуск скрипта обнаружения Chat ID..."
echo
npm run get-chat-id

echo
echo "✅ Готово!"
echo "💡 Совет: После получения Chat ID, запустите './start.sh' для запуска бота"
echo

read -p "Нажмите Enter для продолжения..."
