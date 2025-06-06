import { loadConfig } from './utils/config';
import { ExchangeService } from './services/ExchangeService';
import { MarketAnalysisService } from './services/MarketAnalysisService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';

async function testMultiExchange() {
  console.log('🧪 Тестируем работу с несколькими биржами без API ключей...\n');
  
  try {
    // Загружаем конфигурацию
    const config = loadConfig();
    console.log('📋 Выбранные биржи:', config.selectedExchanges);
    
    // Создаем ExchangeService с несколькими биржами
    const exchangeService = new ExchangeService(config.selectedExchanges);
    
    console.log('\n🏦 Инициализированные биржи:');
    const availableExchanges = exchangeService.getAvailableExchanges();
    availableExchanges.forEach(exchange => {
      console.log(`  ✅ ${exchange.toUpperCase()}`);
    });
    
    if (availableExchanges.length === 0) {
      console.error('❌ Ни одна биржа не была инициализирована!');
      return;
    }
    
    // Тестируем получение данных с каждой биржи
    const testPair = 'BTC/USDT';
    console.log(`\n💰 Тестируем получение данных ${testPair} с каждой биржи:`);
    
    for (const exchangeName of availableExchanges) {
      try {
        console.log(`\n🔍 Биржа: ${exchangeName.toUpperCase()}`);
        
        // Устанавливаем текущую биржу
        exchangeService.setCurrentExchange(exchangeName);
        console.log(`  🎯 Установлена как текущая: ${exchangeService.getCurrentExchange()}`);
        
        // Получаем текущую цену
        const price = await exchangeService.getCurrentPrice(testPair, exchangeName);
        console.log(`  💲 Цена: $${price.toFixed(2)}`);
        
        // Получаем OHLCV данные
        const ohlcv = await exchangeService.fetchOHLCVData(testPair, '1h', 3, exchangeName);
        console.log(`  📊 OHLCV данных: ${ohlcv.length} записей`);
        
        if (ohlcv.length > 0) {
          const lastCandle = ohlcv[ohlcv.length - 1];
          console.log(`  📈 Последняя свеча: O:${lastCandle.open.toFixed(2)} H:${lastCandle.high.toFixed(2)} L:${lastCandle.low.toFixed(2)} C:${lastCandle.close.toFixed(2)}`);
        }
        
        console.log(`  ✅ ${exchangeName.toUpperCase()} работает корректно!`);
        
      } catch (error) {
        console.error(`  ❌ Ошибка на бирже ${exchangeName}:`, (error as Error).message);
      }
    }
    
    // Тестируем полный анализ с несколькими биржами
    console.log('\n🔍 Тестируем полный анализ с несколькими биржами...');
    
    try {
      const technicalAnalysisService = new TechnicalAnalysisService();
      const pythonAnalysisService = new PythonAnalysisService(config.pythonServiceUrl);
      const telegramService = new TelegramService(config.telegramToken, config.telegramChatId);
      
      const marketAnalysisService = new MarketAnalysisService(
        exchangeService,
        technicalAnalysisService,
        pythonAnalysisService,
        telegramService
      );
      
      // Анализируем одну пару на всех биржах
      const testPairs = ['BTC/USDT'];
      const analyses = await marketAnalysisService.analyzeMultipleExchanges(testPairs);
      
      console.log(`\n📊 Результаты анализа:`);
      console.log(`📈 Всего анализов: ${analyses.length}`);
      
      // Группируем по биржам
      const exchangeGroups = analyses.reduce((groups, analysis) => {
        if (!groups[analysis.exchange]) {
          groups[analysis.exchange] = [];
        }
        groups[analysis.exchange].push(analysis);
        return groups;
      }, {} as Record<string, typeof analyses>);
      
      Object.entries(exchangeGroups).forEach(([exchangeName, exchangeAnalyses]) => {
        console.log(`\n🏦 ${exchangeName.toUpperCase()}:`);
        exchangeAnalyses.forEach(analysis => {
          console.log(`  📊 ${analysis.pair}: ${analysis.signal} (${(analysis.confidence * 100).toFixed(1)}%)`);
          console.log(`    💰 Цена: $${analysis.currentPrice.toFixed(2)}`);
        });
      });
      
      if (analyses.length > 0) {
        console.log('\n✅ Анализ с несколькими биржами работает корректно!');
        
        // Проверяем, есть ли данные от обеих бирж
        const uniqueExchanges = [...new Set(analyses.map(a => a.exchange))];
        console.log(`🎯 Получены данные от ${uniqueExchanges.length} бирж: ${uniqueExchanges.join(', ')}`);
        
        if (uniqueExchanges.length >= 2) {
          console.log('🎉 УСПЕХ: Система работает с несколькими биржами!');
        } else {
          console.log('⚠️  ВНИМАНИЕ: Данные получены только от одной биржи');
        }
        
      } else {
        console.log('❌ Анализ не дал результатов');
      }
      
    } catch (analysisError) {
      console.error('❌ Ошибка при полном анализе:', (analysisError as Error).message);
    }
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

// Запускаем тест
testMultiExchange().catch(console.error);
