import dotenv from 'dotenv';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';
import { loadConfig } from './utils/config';

// Загружаем переменные окружения
dotenv.config();

async function testSwingAlgorithms() {
  console.log('🧪 Тестирование новых swing алгоритмов...\n');
  try {
    // Инициализация сервисов
    const config = loadConfig();
    const exchangeService = new ExchangeService();
    const technicalAnalysisService = new TechnicalAnalysisService();
    const pythonAnalysisService = new PythonAnalysisService();
    const telegramService = new TelegramService(config.telegramToken, config.telegramChatId);
    const marketAnalysisService = new MarketAnalysisService(
      exchangeService,
      technicalAnalysisService,
      pythonAnalysisService,
      telegramService
    );

    // Тестовые пары
    const testPairs = ['BTC/USDT', 'ETH/USDT', 'DOGE/USDT'];

    console.log('📊 Анализ тестовых пар...');
    const analyses = await marketAnalysisService.analyzeMultiplePairs(testPairs);    
    console.log('\n📈 Результаты swing анализа:');
    console.log('='.repeat(50));

    for (const analysis of analyses) {
      console.log(`\n🎯 ${analysis.pair}:`);
      console.log(`  💰 Цена: $${analysis.currentPrice.toFixed(6)}`);
      console.log(`  📊 Сигнал: ${analysis.signal}`);
      console.log(`  🎯 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
      console.log(`  📊 Вероятность: ${(analysis.probability * 100).toFixed(1)}%`);
      
      if (analysis.reasoning) {
        console.log(`  🔧 Техническое обоснование:`);
        analysis.reasoning.technical.forEach(reason => {
          console.log(`    • ${reason}`);
        });
        
        console.log(`  📊 Фундаментальный анализ:`);
        analysis.reasoning.fundamental.forEach(reason => {
          console.log(`    • ${reason}`);
        });
        
        console.log(`  ⚠️ Риск: ${analysis.reasoning.risk}`);
        console.log(`  ⏰ Временные рамки: ${analysis.reasoning.timeframe}`);
      }
    }

    // Генерация сигналов
    console.log('\n🚨 Генерация торговых сигналов...');
    const signals = await marketAnalysisService.generateTradingSignals(analyses);

    if (signals.length > 0) {
      console.log(`\n✅ Сгенерировано ${signals.length} торговых сигналов:`);
      
      for (const signal of signals) {
        console.log(`\n🎯 ${signal.pair}: ${signal.signal}`);
        console.log(`  💰 Вход: $${signal.swingTarget.entry.toFixed(6)}`);
        console.log(`  🛑 Stop Loss: $${signal.swingTarget.stopLoss.toFixed(6)}`);
        console.log(`  🎪 Take Profit: $${signal.swingTarget.takeProfit.toFixed(6)}`);
        console.log(`  ⏱ Период: ${signal.swingTarget.timeframe}`);
        console.log(`  🎯 Уверенность: ${(signal.confidence * 100).toFixed(1)}%`);
      }

      // Отправка тестового сигнала в Telegram
      console.log('\n📱 Отправка тестового сигнала в Telegram...');
      await telegramService.sendSignal(signals[0]);
      console.log('✅ Тестовый сигнал отправлен!');

    } else {
      console.log('\n⚪ Торговых сигналов не обнаружено (высокие стандарты swing торговли)');
    }

    // Отправка отчета
    console.log('\n📊 Отправка отчета по анализу...');
    await telegramService.sendAnalysisReport(analyses);
    console.log('✅ Отчет отправлен!');

    console.log('\n🎉 Тестирование завершено успешно!');
    console.log('\n💡 Новые функции:');
    console.log('  ✅ Мультитаймфрейм анализ (1h, 4h, 1d)');
    console.log('  ✅ 5 уровней сигналов (STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL)');
    console.log('  ✅ Детальное техническое и фундаментальное обоснование');
    console.log('  ✅ Swing цели с уровнями входа, stop loss и take profit');
    console.log('  ✅ Оценка риска и временных рамок');
    console.log('  ✅ Confluence анализ между таймфреймами');
    console.log('  ✅ Строгие условия для swing торговли (1-7 дней)');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  testSwingAlgorithms().catch(console.error);
}

export { testSwingAlgorithms };
