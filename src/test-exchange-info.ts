import { loadConfig } from './utils/config';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';

async function testExchangeInfo() {
  console.log('🔍 Тестирование информации о бирже в отчетах...\n');
  
  try {
    const config = loadConfig();
    
    const exchangeService = new ExchangeService();
    const technicalAnalysisService = new TechnicalAnalysisService();
    const pythonAnalysisService = new PythonAnalysisService(config.pythonServiceUrl);
    const telegramService = new TelegramService(config.telegramToken, config.telegramChatId);
    
    const marketAnalysisService = new MarketAnalysisService(
      exchangeService,
      technicalAnalysisService,
      pythonAnalysisService,
      telegramService
    );

    // Проверяем название биржи
    console.log(`🏦 Название биржи: ${exchangeService.getExchangeName()}`);
    
    // Анализируем несколько пар
    const testPairs = ['BTC/USDT', 'ETH/USDT', 'DOGE/USDT'];
    console.log(`📊 Анализируем пары: ${testPairs.join(', ')}\n`);
    
    const analyses = await marketAnalysisService.analyzeMultiplePairs(testPairs);
    
    console.log('📈 Результаты анализа с информацией о бирже:');
    console.log('='.repeat(60));
    
    for (const analysis of analyses) {
      console.log(`\n🎯 ${analysis.pair} (${analysis.exchange}):`);
      console.log(`  💰 Цена: $${analysis.currentPrice.toFixed(6)}`);
      console.log(`  📊 Сигнал: ${analysis.signal}`);
      console.log(`  🎯 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`  🏦 Биржа: ${analysis.exchange}`);
    }
    
    // Генерируем сигналы и проверяем
    const signals = await marketAnalysisService.generateTradingSignals(analyses);
    
    if (signals.length > 0) {
      console.log(`\n🚨 Сгенерировано ${signals.length} торговых сигналов с информацией о бирже:`);
      
      for (const signal of signals) {
        console.log(`\n🎯 ${signal.pair} (${signal.exchange}): ${signal.signal}`);
        console.log(`  💰 Цена: $${signal.price.toFixed(6)}`);
        console.log(`  🎯 Уверенность: ${(signal.confidence * 100).toFixed(1)}%`);
        console.log(`  🏦 Биржа: ${signal.exchange}`);
      }
    } else {
      console.log('\n⚪ Активных торговых сигналов нет');
    }
    
    // Тестируем отчет Telegram
    console.log('\n📤 Тестируем отправку отчета в Telegram...');
    await telegramService.sendAnalysisReport(analyses);
    console.log('✅ Отчет отправлен! Проверьте Telegram для просмотра информации о бирже.');
    
    console.log('\n✅ Тест завершен успешно!');
    console.log('✅ Теперь в отчетах будет указываться биржа для каждой валютной пары.');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

testExchangeInfo();
