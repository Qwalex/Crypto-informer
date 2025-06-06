import { loadConfig } from './utils/config';
import { ExchangeService } from './services/ExchangeService';

async function quickTest() {
  console.log('🧪 Быстрый тест конфигурации...');
  
  try {
    // Загружаем конфигурацию
    const config = loadConfig();
    console.log('📋 Выбранные биржи из конфигурации:', config.selectedExchanges);
    
    // Создаем ExchangeService
    const exchangeService = new ExchangeService(config.selectedExchanges);
    
    // Проверяем доступные биржи
    const availableExchanges = exchangeService.getAvailableExchanges();
    console.log('🏦 Инициализированные биржи:', availableExchanges);
    
    if (availableExchanges.length === 0) {
      console.error('❌ Ни одна биржа не была инициализирована!');
      return;
    }
    
    // Тестируем простое получение цены
    console.log('\n💰 Тестируем получение цены BTC/USDT...');
    
    for (const exchangeName of availableExchanges) {
      try {
        console.log(`🔍 Тестируем биржу: ${exchangeName}`);
        const price = await exchangeService.getCurrentPrice('BTC/USDT', exchangeName);
        console.log(`✅ ${exchangeName}: $${price.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ ${exchangeName}: ${(error as Error).message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

quickTest().catch(console.error);
