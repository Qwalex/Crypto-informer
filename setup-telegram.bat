@echo off
echo ============================================
echo   🤖 Скрипт настройки Telegram Chat ID
echo ============================================
echo.

cd /d "%~dp0"

echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo 📥 Установка зависимостей npm...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

if not exist "dist" (
    echo 🔨 Сборка проекта...
    call npm run build
    if errorlevel 1 (
        echo ❌ Ошибка сборки проекта
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Запуск скрипта обнаружения Chat ID...
echo.
call npm run get-chat-id

echo.
echo ✅ Готово! 
echo 💡 Совет: После получения Chat ID, запустите 'start.bat' для запуска бота
echo.
pause
