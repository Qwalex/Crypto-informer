@echo off
echo 🔍 Проверка статуса системы...

:: Проверка Python сервиса
docker ps | findstr "python-analysis" >nul
if %errorlevel% equ 0 (
    echo ✅ Python сервис запущен в Docker
    
    :: Проверка здоровья сервиса
    curl -f http://localhost:8000/health >nul 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Python сервис отвечает на запросы
    ) else (
        echo ⚠️ Python сервис не отвечает
    )
) else (
    echo ❌ Python сервис не запущен в Docker
)

:: Проверка портов
echo.
echo 📡 Проверка портов:
netstat -an | findstr ":8000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✅ Порт 8000 ^(Python сервис^) открыт
) else (
    echo ❌ Порт 8000 недоступен
)

:: Проверка конфигурации
echo.
echo ⚙️ Проверка конфигурации:
if exist .env (
    findstr "TELEGRAM_BOT_TOKEN=" .env | findstr /v "TELEGRAM_BOT_TOKEN=$" | findstr /v "TELEGRAM_BOT_TOKEN= " >nul
    if %errorlevel% equ 0 (
        echo ✅ Telegram токен настроен
    ) else (
        echo ❌ Telegram токен не настроен
    )
    
    findstr "TELEGRAM_CHAT_ID=" .env | findstr /v "TELEGRAM_CHAT_ID=$" | findstr /v "TELEGRAM_CHAT_ID= " >nul
    if %errorlevel% equ 0 (
        echo ✅ Telegram chat ID настроен
    ) else (
        echo ❌ Telegram chat ID не настроен
    )
) else (
    echo ❌ Файл .env не найден
)

echo.
echo 📊 Логи ^(последние 5 строк^):
echo --- Python сервис ---
docker-compose logs --tail=5 python-analysis 2>nul || echo Логи недоступны

pause
