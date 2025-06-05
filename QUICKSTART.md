# 🚀 Быстрый старт - Crypto Signal Bot

## Метод 1: Веб-интерфейс (Рекомендуется) ⭐

### 1. Установка
```bash
npm install
```

### 2. Запуск Python сервиса
```bash
npm run docker:up
```

### 3. Настройка через веб-интерфейс
```bash
npm run admin
```
Откройте: **http://localhost:3002/admin**

В веб-интерфейсе:
1. **Telegram** → Вставьте Bot Token → Нажмите "Проверить"
2. **Telegram** → Нажмите "Найти Chat ID" (предварительно отправьте сообщение боту)
3. **Анализ** → Выберите валютные пары и таймфрейм
4. **Сохранить конфигурацию**

### 4. Запуск бота
```bash
npm start
```

---

## Метод 2: Ручная настройка

### 1. Установка
```bash
npm install
npm run docker:up
```

### 2. Настройка .env
```bash
cp .env.example .env
# Отредактируйте .env файл
```

### 3. Получение Chat ID
```bash
npm run get-chat-id
```

### 4. Запуск
```bash
npm run build
npm start
```

---

## 📱 Создание Telegram бота

1. Найдите [@BotFather](https://t.me/botfather)
2. Команда: `/newbot`
3. Выберите имя и username бота
4. Скопируйте полученный токен

---

## ✅ Проверка работы

1. **Python сервис**: `curl http://localhost:8000/health`
2. **Админ-панель**: `http://localhost:3002/admin`
3. **API**: `http://localhost:3002/api/status`
4. **Telegram**: Бот должен отправить тестовое сообщение

---

## 🔧 Быстрые команды

```bash
# Статус всех сервисов
npm run docker:logs    # Логи Python
npm run api           # API + админ-панель
npm start             # Запуск бота

# Диагностика
npm test              # Тестирование
npm run diagnose      # Диагностика сигналов
```

---

## 🆘 Если что-то не работает

**Python сервис не запускается:**
```bash
docker-compose down
docker-compose up -d
```

**Telegram не работает:**
- Проверьте токен в [@BotFather](https://t.me/botfather)
- Отправьте сообщение боту перед поиском Chat ID

**Порт занят:**
- Измените порт в `src/api-server.ts` (по умолчанию 3002)

**Подробная документация:** [README.md](README.md) | [ADMIN_PANEL.md](ADMIN_PANEL.md)
