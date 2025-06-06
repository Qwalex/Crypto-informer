@echo off
REM Скрипт полного запуска криптобота для Windows
REM Автор: Криптобот Система

echo 🚀 Запуск системы криптобота...
echo ================================

REM Проверка Docker
echo 🐳 Проверка Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не запущен!
    pause
    exit /b 1
)

echo ✅ Docker работает

REM Запуск Docker контейнеров
echo.
echo 🔄 Запуск Docker контейнеров...
call npm run docker:up

timeout /t 5 /nobreak >nul

REM Проверка статуса контейнеров
echo.
echo 📊 Проверка статуса контейнеров...
docker-compose ps

REM Компиляция TypeScript
echo.
echo 🔨 Компиляция TypeScript...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка компиляции!
    pause
    exit /b 1
)

echo ✅ Компиляция завершена

REM Информация о запуске
echo.
echo 🚀 Запуск основного приложения...
echo 📊 Админ-панель будет доступна на: http://localhost:3003/admin
echo 📈 Дашборд доступен в файле: dashboard.html
echo 🎛️ Системный монитор: npm run monitor
echo.
echo Для остановки нажмите Ctrl+C
echo.

REM Запуск в режиме разработки
call npm run dev

pause
