# Docker Deployment Guide

## Обзор

Проект поддерживает два режима контейнеризации:
- **Production** - оптимизированный для продакшена
- **Development** - с hot reload и отладкой

## Quick Start

### Production Environment

```bash
# Запуск production версии
npm run production:start

# Или напрямую через docker-compose
docker-compose up -d
```

### Development Environment

```bash
# Запуск development версии
npm run development:start

# Или напрямую через docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

## Доступные команды

### Build команды
```bash
npm run docker:build          # Сборка production образа
npm run docker:build:dev      # Сборка development образа
```

### Production команды
```bash
npm run docker:up             # Запуск production
npm run docker:down           # Остановка production
npm run docker:logs           # Просмотр логов production
npm run docker:restart        # Перезапуск production
npm run docker:rebuild        # Пересборка и запуск production
```

### Development команды
```bash
npm run docker:up:dev         # Запуск development
npm run docker:down:dev       # Остановка development
npm run docker:logs:dev       # Просмотр логов development
npm run docker:rebuild:dev    # Пересборка и запуск development
```

### Утилиты
```bash
npm run docker:clean          # Очистка Docker системы
```

## Архитектура

### Production (docker-compose.yml)
- **crypto-bot**: Основное приложение (порт 3000)
- **python-analysis**: Python сервис анализа (порт 8000)
- Оптимизированная сборка с multi-stage build
- Health checks для всех сервисов
- Автоматический restart при сбоях

### Development (docker-compose.dev.yml)
- **crypto-bot-dev**: Приложение с hot reload (порты 3000, 9229)
- **python-analysis-dev**: Python сервис с debug режимом (порт 8000)
- Volume mount для live code changes
- Debugging порт 9229 для Node.js

## Порты

| Сервис | Production | Development | Описание |
|--------|------------|-------------|----------|
| API Server | 3000 | 3000 | Web API и админка |
| Python Service | 8000 | 8000 | Анализ данных |
| Debug Port | - | 9229 | Node.js debugging |

## Переменные окружения

### Production
- `NODE_ENV=production`
- `PYTHON_SERVICE_URL=http://python-analysis:8000`

### Development
- `NODE_ENV=development`
- `DEBUG=*`
- `PYTHON_SERVICE_URL=http://python-analysis-dev:8000`

## Health Checks

Все сервисы имеют health check endpoints:
- **Node.js**: `GET /health`
- **Python**: `GET /health`

## Volumes

### Production
- `./bot-config.json:/app/bot-config.json:ro` - Конфигурация (read-only)

### Development
- `.:/app` - Live code sync
- `node_modules_dev:/app/node_modules` - Кеш зависимостей

## Networking

Сервисы используют изолированные Docker networks:
- **Production**: `crypto-bot-network`
- **Development**: `crypto-bot-dev`

## Мониторинг

```bash
# Просмотр статуса контейнеров
docker-compose ps

# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f crypto-bot
docker-compose logs -f python-analysis
```

## Troubleshooting

### Проблемы с портами
```bash
# Проверка занятых портов
netstat -an | findstr :3000
netstat -an | findstr :8000
```

### Очистка Docker
```bash
# Остановка всех контейнеров
docker-compose down
docker-compose -f docker-compose.dev.yml down

# Полная очистка
npm run docker:clean
```

### Пересборка после изменений
```bash
# Production
npm run docker:rebuild

# Development
npm run docker:rebuild:dev
```

## Security

### Production
- Использование non-root пользователя
- Read-only конфигурационные файлы
- Минимальный Alpine Linux образ
- Multi-stage build для уменьшения attack surface

### Development
- Доступ к отладочному порту только локально
- Bind mount для удобства разработки
