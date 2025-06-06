import { TelegramService } from './services/TelegramService';
import { MarketAnalysis } from './types';

// Тест для проверки правильного отображения эмодзи Bybit
async function testBybitEmoji() {
  console.log('🧪 Тестирование эмодзи для Bybit...\n');
  
  const telegramService = new TelegramService('test-token', 'test-chat');
  
  // Создаем тестовые данные с анализом для Bybit
  const testAnalyses: MarketAnalysis[] = [
    {
      pair: 'BTC/USDT',
      exchange: 'bybit',
      signal: 'BUY',
      currentPrice: 43250.75,
      probability: 0.75,
      confidence: 0.75,
      indicators: {
        rsi: [75],
        macd: {
          macd: [0.002],
          signal: [0.001], 
          histogram: [0.001]
        },
        bollingerBands: {
          upper: [44000],
          middle: [43000],
          lower: [42000]
        }
      },
      forecast: {
        arima_forecast: 43500,
        garch_volatility: 0.02,
        pair: 'BTC/USDT'
      },
      reasoning: {
        technical: ['RSI показывает перекупленность, confluence: 2'],
        fundamental: ['Позитивные новости о Bitcoin'],
        risk: 'УМЕРЕННЫЙ',
        timeframe: '4h'
      }
    },
    {
      pair: 'ETH/USDT',
      exchange: 'bybit',
      signal: 'HOLD',
      currentPrice: 2580.45,
      probability: 0.55,
      confidence: 0.55,
      indicators: {
        rsi: [55],
        macd: {
          macd: [0.0],
          signal: [0.0],
          histogram: [0.0]
        },
        bollingerBands: {
          upper: [2600],
          middle: [2550],
          lower: [2500]
        }
      },
      forecast: {
        arima_forecast: 2590,
        garch_volatility: 0.025,
        pair: 'ETH/USDT'
      },
      reasoning: {
        technical: ['Индикаторы смешанные, confluence: 0'],
        fundamental: ['Нейтральные настроения'],
        risk: 'НИЗКИЙ',
        timeframe: '1h'
      }
    }
  ];
  
  // Тестируем функцию formatAnalysisReport
  const reportMessage = (telegramService as any).formatAnalysisReport(testAnalyses);
  
  console.log('📄 Сгенерированный отчет:');
  console.log('='.repeat(50));
  console.log(reportMessage);
  console.log('='.repeat(50));
  
  // Проверяем наличие правильного эмодзи
  const hasOrangeSquare = reportMessage.includes('🟧');
  const hasOrangeCircle = reportMessage.includes('🟠');
  
  console.log('\n✅ Результаты проверки:');
  console.log(`🟧 Оранжевый квадрат найден: ${hasOrangeSquare ? '✅ ДА' : '❌ НЕТ'}`);
  console.log(`🟠 Оранжевый круг найден: ${hasOrangeCircle ? '❌ ДА (не должно быть!)' : '✅ НЕТ'}`);
  
  if (hasOrangeSquare && !hasOrangeCircle) {
    console.log('\n🎉 ТЕСТ ПРОЙДЕН: Эмодзи Bybit успешно изменено с 🟠 на 🟧!');
  } else {
    console.log('\n❌ ТЕСТ НЕ ПРОЙДЕН: Проблема с заменой эмодзи Bybit');
  }
}

// Запускаем тест
testBybitEmoji().catch(console.error);
