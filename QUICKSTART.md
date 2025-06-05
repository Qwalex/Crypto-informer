# Быстрый старт

## 📋 Предварительные требования

1. **Node.js 18+** - [Скачать](https://nodejs.org/)
2. **Docker Desktop** - [Скачать](https://www.docker.com/products/docker-desktop/)
3. **Telegram бот токен** - Создайте через [@BotFather](https://t.me/botfather)

## 🚀 Установка за 5 минут

### 1. Клонирование и установка
```bash
git clone <your-repo>
cd exchanges-2
npm install
```

### 2. Настройка переменных окружения
Скопируйте файл `.env.example` в `.env`:
```bash
cp .env.example .env
```

Заполните обязательные параметры в `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 3. Создание Telegram бота

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Выберите имя для бота
4. Скопируйте полученный токен в `.env`

### 4. Получение Chat ID

1. Добавьте созданного бота в свой чат или группу
2. Отправьте боту любое сообщение
3. Перейдите по ссылке: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
4. Найдите `"chat":{"id":ЧИСЛО}` и скопируйте это число в `.env`

### 5. Запуск системы

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Или вручную:**
```bash
# Запуск Python сервиса
docker-compose up -d

# Компиляция и запуск Node.js приложения
npm run build
npm start
```

## 🧪 Тестирование

Проверьте работу всех компонентов:
```bash
npm test
```

## 📊 Мониторинг

- **Логи Python сервиса:** `docker-compose logs -f python-analysis`
- **Логи Node.js бота:** В консоли где запущен `npm start`
- **Статус Python сервиса:** `curl http://localhost:8000/health`

## 🛑 Остановка

```bash
# Остановка Python сервиса
docker-compose down

# Остановка Node.js бота
Ctrl + C в консоли
```

## ⚙️ Настройка валютных пар

В файле `.env` измените параметр `ANALYSIS_PAIRS`:
```env
ANALYSIS_PAIRS=BTC/USDT,ETH/USDT,BNB/USDT,ADA/USDT,SOL/USDT
```

## 🔧 Устранение проблем

### Python сервис не запускается
```bash
docker-compose logs python-analysis
docker-compose restart python-analysis
```

### Telegram уведомления не приходят
- Проверьте токен бота и chat ID в `.env`
- Убедитесь что бот добавлен в чат

### Ошибки API биржи
- Проверьте интернет соединение
- API ключи Bybit не обязательны для просмотра данных

## 📈 Результат

После запуска бот будет:
- Анализировать выбранные валютные пары каждые 30 минут
- Отправлять торговые сигналы в Telegram при обнаружении возможностей
- Присылать сводные отчеты каждые 4 часа

## ⚠️ Важно

**Это не финансовый совет!** Сигналы предназначены только для образовательных целей. Всегда проводите собственный анализ перед принятием торговых решений.
