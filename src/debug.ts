// filepath: c:\Users\qwazi\Рабочий стол\exchanges-2\src\debug.ts
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';
import { loadConfig } from './utils/config';

async function debugAnalysis() {
  try {
    console.log('🔍 Отладка анализа сигналов...\n');
    
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

    // Анализируем одну пару детально
    const pair = 'BTC/USDT';
    console.log(`📊 Детальный анализ ${pair}:`);
    
    const analysis = await marketAnalysisService.analyzePair(pair);
    
    console.log('\n📈 Результаты анализа:');
    console.log(`Текущая цена: $${analysis.currentPrice}`);
    console.log(`Вероятность: ${(analysis.probability * 100).toFixed(2)}%`);
    console.log(`Сигнал: ${analysis.signal}`);
    console.log(`Уверенность: ${(analysis.confidence * 100).toFixed(2)}%`);
    
    console.log('\n🔧 Технические индикаторы:');
    const latestRSI = technicalAnalysisService.getLatestRSI(analysis.indicators);
    const latestMACD = technicalAnalysisService.getLatestMACD(analysis.indicators);
    const latestBB = technicalAnalysisService.getLatestBollingerBands(analysis.indicators);
    
    console.log(`RSI: ${latestRSI.toFixed(2)}`);
    console.log(`MACD: ${latestMACD.macd.toFixed(4)}, Signal: ${latestMACD.signal.toFixed(4)}, Histogram: ${latestMACD.histogram.toFixed(4)}`);
    console.log(`Bollinger Bands - Upper: ${latestBB.upper.toFixed(2)}, Lower: ${latestBB.lower.toFixed(2)}`);
    
    console.log('\n🐍 Python анализ:');
    console.log(`ARIMA прогноз: $${analysis.forecast.arima_forecast.toFixed(6)}`);
    console.log(`GARCH волатильность: ${(analysis.forecast.garch_volatility * 100).toFixed(2)}%`);
    
    // Проверим условия для сигнала
    console.log('\n🎯 Проверка условий сигнала:');
    console.log(`Вероятность > 0.7: ${analysis.probability > 0.7} (${analysis.probability.toFixed(3)})`);
    console.log(`RSI < 40: ${latestRSI < 40} (${latestRSI.toFixed(2)})`);
    console.log(`MACD > Signal: ${latestMACD.macd > latestMACD.signal} (${latestMACD.macd.toFixed(4)} > ${latestMACD.signal.toFixed(4)})`);
    console.log(`Уверенность > 0.6: ${analysis.confidence > 0.6} (${analysis.confidence.toFixed(3)})`);
    
    // Проверим условия для SELL
    console.log(`\nДля SELL:`);
    console.log(`Вероятность < 0.3: ${analysis.probability < 0.3} (${analysis.probability.toFixed(3)})`);
    console.log(`RSI > 60: ${latestRSI > 60} (${latestRSI.toFixed(2)})`);
    console.log(`MACD < Signal: ${latestMACD.macd < latestMACD.signal} (${latestMACD.macd.toFixed(4)} < ${latestMACD.signal.toFixed(4)})`);
    
    // Генерируем сигналы для всех пар
    console.log('\n📊 Генерация сигналов для всех пар:');
    const analyses = await marketAnalysisService.analyzeMultiplePairs(config.analysisPairs);
    const signals = await marketAnalysisService.generateTradingSignals(analyses);
    
    console.log(`\nВсего проанализировано: ${analyses.length} пар`);
    console.log(`Сгенерировано сигналов: ${signals.length}`);
    
    if (signals.length === 0) {
      console.log('\n❌ Нет сигналов! Причины:');
      for (const analysis of analyses) {
        const rsi = technicalAnalysisService.getLatestRSI(analysis.indicators);
        const macd = technicalAnalysisService.getLatestMACD(analysis.indicators);
        
        console.log(`\n${analysis.pair}:`);
        console.log(`  Сигнал: ${analysis.signal}`);
        console.log(`  Уверенность: ${(analysis.confidence * 100).toFixed(1)}% (нужно >60%)`);
        console.log(`  Вероятность: ${(analysis.probability * 100).toFixed(1)}%`);
        console.log(`  RSI: ${rsi.toFixed(1)}`);
        
        if (analysis.signal === 'HOLD') {
          console.log(`  ❌ Сигнал HOLD - не проходит условия`);
        }
        if (analysis.confidence <= 0.6) {
          console.log(`  ❌ Низкая уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
        }
      }
    } else {
      console.log('\n✅ Найдены сигналы:');
      signals.forEach(signal => {
        console.log(`${signal.pair}: ${signal.signal} (уверенность: ${(signal.confidence * 100).toFixed(1)}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}

debugAnalysis();
