#!/usr/bin/env node

/**
 * Скрипт мониторинга системы криптобота
 * Показывает статус всех компонентов
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Криптобот - Системный мониторинг');
console.log('=====================================\n');

// Проверка Docker контейнеров
console.log('🐳 Статус Docker контейнеров:');
exec('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', (error, stdout) => {
    if (error) {
        console.error('❌ Ошибка при проверке Docker:', error.message);
        return;
    }
    console.log(stdout);
});

// Проверка портов
setTimeout(() => {
    console.log('\n🌐 Проверка портов:');
    
    const ports = [
        { port: 3003, service: 'Админ-панель' },
        { port: 8000, service: 'Python анализ' },
        { port: 6379, service: 'Redis' },
        { port: 5433, service: 'PostgreSQL' }
    ];
    
    ports.forEach(({ port, service }) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (stdout.trim()) {
                console.log(`✅ ${service} (порт ${port}): Активен`);
            } else {
                console.log(`❌ ${service} (порт ${port}): Не доступен`);
            }
        });
    });
}, 1000);

// Проверка логов Python сервиса
setTimeout(() => {
    console.log('\n📊 Последние операции анализа:');
    exec('docker logs --tail 5 exchanges-2-python-analysis-1', (error, stdout) => {
        if (error) {
            console.error('❌ Не удалось получить логи:', error.message);
            return;
        }
        
        const lines = stdout.split('\n').filter(line => line.includes('INFO:app:'));
        lines.slice(-5).forEach(line => {
            console.log(`📈 ${line.replace('INFO:app:', '')}`);
        });
    });
}, 2000);

// Проверка конфигурации
setTimeout(() => {
    console.log('\n⚙️ Конфигурация:');
    
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                if (key.includes('TOKEN') || key.includes('SECRET') || key.includes('KEY')) {
                    console.log(`🔐 ${key}: ***скрыт***`);
                } else {
                    console.log(`📋 ${key}: ${value}`);
                }
            }
        });
    } else {
        console.log('❌ Файл .env не найден');
    }
}, 3000);

// Полезные команды
setTimeout(() => {
    console.log('\n💡 Полезные команды:');
    console.log('📊 Админ-панель: http://localhost:3003/admin');
    console.log('🔧 Перезапуск Python: npm run docker:restart');
    console.log('📜 Логи Python: npm run docker:logs');
    console.log('🧪 Тест системы: npm run test');
    console.log('📈 Диагностика: npm run diagnose');
}, 4000);
