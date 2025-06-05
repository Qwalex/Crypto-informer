import dotenv from 'dotenv';
import { CryptoSignalBot } from './CryptoSignalBot';
import { loadConfig, validateConfig } from './utils/config';

// Загружаем переменные окружения
dotenv.config();

async function main() {
  try {
    console.log('🚀 Инициализация криптовалютного сигнального бота...');
    
    // Загружаем и валидируем конфигурацию
    const config = loadConfig();
    validateConfig(config);
    
    console.log('📊 Конфигурация:');
    console.log(`- Валютные пары: ${config.analysisPairs.join(', ')}`);
    console.log(`- Интервал анализа: ${config.analysisInterval}`);
    console.log(`- Python сервис: ${config.pythonServiceUrl}`);
    
    // Создаем и запускаем бота
    const bot = new CryptoSignalBot(config);
    
    // Обработка сигналов для корректного завершения
    process.on('SIGINT', async () => {
      console.log('\n🛑 Получен сигнал завершения (SIGINT)');
      await bot.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Получен сигнал завершения (SIGTERM)');
      await bot.stop();
      process.exit(0);
    });
    
    // Обработка необработанных ошибок
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Необработанное отклонение промиса:', reason);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Необработанное исключение:', error);
      process.exit(1);
    });
    
    // Запускаем бота
    await bot.start();
    
    // Бот работает в фоне согласно расписанию
    console.log('✅ Бот работает. Нажмите Ctrl+C для остановки.');
    
  } catch (error) {
    console.error('❌ Критическая ошибка запуска:', error);
    process.exit(1);
  }
}

// Запускаем приложение
main().catch(error => {
  console.error('❌ Неожиданная ошибка:', error);
  process.exit(1);
});
