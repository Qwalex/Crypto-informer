import dotenv from 'dotenv';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';
import { loadConfig } from './utils/config';

// Загружаем переменные окружения
dotenv.config();

async function diagnoseSignals() {
  console.log('🔍 Диагностика: почему не генерируются сигналы...\n');
  
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

    // Анализируем пары из конфигурации
    const pairs = config.analysisPairs.slice(0, 5); // Первые 5 пар для диагностики
    console.log(`📊 Диагностируем пары: ${pairs.join(', ')}\n`);

    for (const pair of pairs) {
      console.log(`🔍 Анализ пары: ${pair}`);
      
      try {
        const analysis = await (marketAnalysisService as any).analyzePair(pair);
        
        console.log(`💰 Цена: $${analysis.currentPrice.toFixed(6)}`);
        console.log(`📊 Сигнал: ${analysis.signal}`);
        console.log(`🎯 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
        console.log(`📊 Вероятность: ${(analysis.probability * 100).toFixed(1)}%`);
        
        // Проверяем условия для BUY
        console.log('\n🟢 Условия для BUY:');
        console.log(`  probability >= 0.75: ${analysis.probability >= 0.75} (текущая: ${analysis.probability.toFixed(3)})`);
        console.log(`  confidence >= 0.7: ${analysis.confidence >= 0.7} (текущая: ${analysis.confidence.toFixed(3)})`);
        
        // Проверяем условия для SELL  
        console.log('\n🔴 Условия для SELL:');
        console.log(`  probability <= 0.25: ${analysis.probability <= 0.25} (текущая: ${analysis.probability.toFixed(3)})`);
        console.log(`  confidence >= 0.7: ${analysis.confidence >= 0.7} (текущая: ${analysis.confidence.toFixed(3)})`);
        
        // Проверяем условия для генерации сигналов
        console.log('\n📈 Условия для генерации торгового сигнала:');
        console.log(`  signal !== 'HOLD': ${analysis.signal !== 'HOLD'}`);
        console.log(`  confidence > 0.65: ${analysis.confidence > 0.65}`);
        
        if (analysis.signal !== 'HOLD' && analysis.confidence > 0.65) {
          console.log('  ✅ Эта пара ДОЛЖНА генерировать сигнал!');
        } else {
          console.log('  ❌ Эта пара НЕ генерирует сигнал');
          if (analysis.signal === 'HOLD') {
            console.log('      Причина: сигнал HOLD');
          }
          if (analysis.confidence <= 0.65) {
            console.log(`      Причина: низкая уверенность (${(analysis.confidence * 100).toFixed(1)}% < 65%)`);
          }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Задержка между анализом пар
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Ошибка анализа пары ${pair}:`, error);
      }
    }
    
    console.log('\n🎯 РЕКОМЕНДАЦИИ ПО НАСТРОЙКЕ:');
    console.log('1. Снизить порог уверенности с 0.65 до 0.6 для большего количества сигналов');
    console.log('2. Снизить требования к probability с 0.75 до 0.65 для BUY');
    console.log('3. Увеличить требования к probability с 0.25 до 0.35 для SELL');
    console.log('4. Сделать условия confluence менее строгими');
    console.log('\n💡 Сейчас алгоритм настроен на очень консервативную торговлю!');
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error);
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  diagnoseSignals().catch(console.error);
}

export { diagnoseSignals };
