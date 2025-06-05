@echo off
echo 🚀 Запуск системы анализа криптовалютного рынка...

:: Проверяем наличие Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker не установлен. Пожалуйста, установите Docker.
    pause
    exit /b 1
)

:: Проверяем наличие .env файла
if not exist .env (
    echo ❌ Файл .env не найден. Скопируйте .env.example в .env и заполните необходимые параметры.
    pause
    exit /b 1
)

:: Запускаем Python сервис
echo 🐍 Запуск Python сервиса...
docker-compose up -d

:: Ждем запуска сервиса
echo ⏳ Ожидание запуска Python сервиса...
timeout /t 10 /nobreak >nul

:: Проверяем статус Python сервиса
echo 🔍 Проверка статуса Python сервиса...
curl -f http://localhost:8000/health >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python сервис запущен успешно
) else (
    echo ⚠️ Python сервис может быть недоступен, но бот попробует работать без него
)

:: Устанавливаем Node.js зависимости если не установлены
if not exist node_modules (
    echo 📦 Установка Node.js зависимостей...
    npm install
)

:: Компилируем TypeScript
echo 🔨 Компиляция TypeScript...
npm run build

:: Запускаем бота
echo 🤖 Запуск криптовалютного бота...
npm start

pause
