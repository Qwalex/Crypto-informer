#!/bin/bash

echo "🔍 Проверка статуса системы..."

# Проверка Node.js процесса
if pgrep -f "node.*index.js" > /dev/null; then
    echo "✅ Node.js бот запущен"
else
    echo "❌ Node.js бот не запущен"
fi

# Проверка Python сервиса
if docker ps | grep -q "python-analysis"; then
    echo "✅ Python сервис запущен в Docker"
    
    # Проверка здоровья сервиса
    if curl -f http://localhost:8000/health &> /dev/null; then
        echo "✅ Python сервис отвечает на запросы"
    else
        echo "⚠️ Python сервис не отвечает"
    fi
else
    echo "❌ Python сервис не запущен в Docker"
fi

# Проверка портов
echo ""
echo "📡 Проверка портов:"
if netstat -an | grep -q ":8000.*LISTENING"; then
    echo "✅ Порт 8000 (Python сервис) открыт"
else
    echo "❌ Порт 8000 недоступен"
fi

# Проверка конфигурации
echo ""
echo "⚙️ Проверка конфигурации:"
if [ -f .env ]; then
    if grep -q "TELEGRAM_BOT_TOKEN=" .env && [ -n "$(grep "TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)" ]; then
        echo "✅ Telegram токен настроен"
    else
        echo "❌ Telegram токен не настроен"
    fi
    
    if grep -q "TELEGRAM_CHAT_ID=" .env && [ -n "$(grep "TELEGRAM_CHAT_ID=" .env | cut -d'=' -f2)" ]; then
        echo "✅ Telegram chat ID настроен"
    else
        echo "❌ Telegram chat ID не настроен"
    fi
else
    echo "❌ Файл .env не найден"
fi

echo ""
echo "📊 Логи (последние 5 строк):"
echo "--- Python сервис ---"
docker-compose logs --tail=5 python-analysis 2>/dev/null || echo "Логи недоступны"
