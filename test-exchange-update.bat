@echo off
echo 🏦 Тестирование обновления: Информация о биржах в отчетах
echo ============================================================
echo.

echo 📊 1. Тестирование получения информации о бирже...
echo npm run test:exchange
call npm run test:exchange

echo.
echo 📤 2. Тестирование Telegram отчета с биржами...
echo npx ts-node src/test-telegram-exchange.ts
call npx ts-node src/test-telegram-exchange.ts

echo.
echo 🔍 3. Диагностика сигналов...
echo npm run diagnose
timeout 30 call npm run diagnose

echo.
echo ✅ Тестирование завершено!
echo.
echo 🎯 Проверьте Telegram для просмотра обновленных отчетов:
echo   • Список бирж в заголовке отчета
echo   • Эмодзи бирж рядом с валютными парами
echo   • Информация о бирже в активных сигналах
echo.
echo 📚 Документация: EXCHANGE_INFO_UPDATE.md
