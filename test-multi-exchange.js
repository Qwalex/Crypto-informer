// Тест работы с несколькими биржами без API ключей
const { loadConfig } = require('./dist/utils/config');
const { ExchangeService } = require('./dist/services/ExchangeService');

async function testMultiExchange() {
  console.log('🧪 Тестируем работу с несколькими биржами...\n');
  
  try {
    // Загружаем конфигурацию
    const config = loadConfig();
    console.log('📋 Выбранные биржи:', config.selectedExchanges);
    
    // Создаем ExchangeService с несколькими биржами
    const exchangeService = new ExchangeService(config.selectedExchanges);
    
    console.log('\n🏦 Доступные биржи:');
    const availableExchanges = exchangeService.getAvailableExchanges();
    availableExchanges.forEach(exchange => {
      console.log(`  ✅ ${exchange.toUpperCase()}`);
    });
    
    // Тестируем получение данных с каждой биржи
    const testPair = 'BTC/USDT';
    console.log(`\n💰 Тестируем получение цены ${testPair} с каждой биржи:`);
    
    for (const exchangeName of availableExchanges) {
      try {
        console.log(`\n🔍 Биржа: ${exchangeName.toUpperCase()}`);
        
        // Получаем текущую цену
        const price = await exchangeService.getCurrentPrice(testPair, exchangeName);
        console.log(`  💲 Цена: $${price.toFixed(2)}`);
        
        // Получаем OHLCV данные
        const ohlcv = await exchangeService.fetchOHLCVData(testPair, '1h', 5, exchangeName);
        console.log(`  📊 OHLCV данных: ${ohlcv.length} записей`);
        
        if (ohlcv.length > 0) {
          const lastCandle = ohlcv[ohlcv.length - 1];
          console.log(`  📈 Последняя свеча: O:${lastCandle.open.toFixed(2)} H:${lastCandle.high.toFixed(2)} L:${lastCandle.low.toFixed(2)} C:${lastCandle.close.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Ошибка на бирже ${exchangeName}:`, error.message);
      }
    }
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

testMultiExchange();
