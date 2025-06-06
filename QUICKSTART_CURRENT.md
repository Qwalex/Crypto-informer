# 🚀 Быстрый старт криптобота

## 📊 Текущий статус системы
✅ **Python сервис анализа:** Работает  
✅ **Docker контейнеры:** Активны  
✅ **Telegram бот:** Настроен  
✅ **Анализ валютных пар:** 17 пар  

---

## 🛠️ Основные команды

### 📈 Мониторинг и статус
```bash
npm run monitor          # Системный мониторинг
npm run status           # Краткий статус (алиас для monitor)
npm run docker:logs      # Логи Python сервиса
```

### 🚀 Запуск и управление
```bash
# Полный запуск системы
start-full.bat          # Windows
./start-full.sh         # Linux/Mac

# Частичный запуск
npm run docker:up        # Только Docker контейнеры
npm run dev              # Только Node.js приложение
npm run admin            # Только админ-панель
```

### 🧪 Тестирование и диагностика
```bash
npm run test             # Общий тест системы
npm run diagnose         # Диагностика торговых сигналов
npm run test:swing       # Тест swing-анализа
```

### 🔧 Управление Docker
```bash
npm run docker:restart   # Перезапуск Python сервиса
npm run docker:rebuild   # Полная пересборка
npm run docker:down      # Остановка контейнеров
```

---

## 🌐 Веб-интерфейсы

| Сервис | URL | Описание |
|--------|-----|----------|
| **Админ-панель** | http://localhost:3003/admin | Настройка бота и мониторинг |
| **Python API** | http://localhost:8000 | Сервис анализа данных |
| **Дашборд** | `dashboard.html` | Визуальный мониторинг |

---

## 📊 Анализируемые пары
BTC/USDT, ETH/USDT, BNB/USDT, ADA/USDT, SOL/USDT, XRP/USDT, DOT/USDT, LINK/USDT, POL/USDT, UNI/USDT, DOGE/USDT, PEPE/USDT, TRX/USDT, ONDO/USDT, ANIME/USDT, SPX/USDT, BMT/USDT

---

## 🎯 Следующие шаги

1. **Проверить работу**: `npm run monitor`
2. **Открыть дашборд**: Откройте `dashboard.html` в браузере
3. **Настроить через админ-панель**: http://localhost:3003/admin
4. **Проверить сигналы**: `npm run diagnose`

---

## 🆘 Решение проблем

### Проблема: Порт 3003 занят
```bash
# Найти процесс
netstat -ano | findstr :3003
# Или просто перезапустить
taskkill /f /im node.exe
```

### Проблема: Docker контейнер не запускается
```bash
npm run docker:rebuild  # Полная пересборка
docker system prune     # Очистка системы Docker
```

### Проблема: Python сервис не отвечает
```bash
docker logs exchanges-2-python-analysis-1  # Проверить логи
npm run docker:restart                      # Перезапуск
```

---

## 📞 Поддержка
- 📊 Мониторинг: `npm run monitor`
- 🔍 Логи: `npm run docker:logs`
- 🧪 Диагностика: `npm run diagnose`
- 📈 Дашборд: `dashboard.html`
