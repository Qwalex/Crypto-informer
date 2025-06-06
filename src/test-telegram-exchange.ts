import { loadConfig } from './utils/config';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysis } from './types';

async function testTelegramReport() {
  console.log('📤 Тестирование Telegram отчета с информацией о биржах...\n');
  
  try {
    const config = loadConfig();
    const telegramService = new TelegramService(config.telegramToken, config.telegramChatId);
    
    // Создаем тестовые данные анализа
    const testAnalyses: MarketAnalysis[] = [
      {
        pair: 'BTC/USDT',
        exchange: 'Bybit',
        probability: 0.85,
        indicators: {} as any,
        forecast: {} as any,
        currentPrice: 67500.123456,
        signal: 'STRONG_BUY',
        confidence: 0.88,
        reasoning: {
          technical: ['RSI дневной график перепродан (25.3)', 'Мультитаймфрейм confluence: +4'],
          fundamental: ['ARIMA прогноз: рост на 5.2%'],
          risk: 'УМЕРЕННЫЙ',
          timeframe: '1-7 дней (swing торговля)'
        }
      },
      {
        pair: 'ETH/USDT',
        exchange: 'Binance',
        probability: 0.45,
        indicators: {} as any,
        forecast: {} as any,
        currentPrice: 3750.987654,
        signal: 'HOLD',
        confidence: 0.62,
        reasoning: {
          technical: ['RSI нейтральная зона (45.8)', 'Confluence: 0'],
          fundamental: ['Волатильность GARCH: 15.3%'],
          risk: 'НИЗКИЙ',
          timeframe: '1-7 дней (swing торговля)'
        }
      },
      {
        pair: 'SOL/USDT',
        exchange: 'OKX',
        probability: 0.25,
        indicators: {} as any,
        forecast: {} as any,
        currentPrice: 145.234567,
        signal: 'SELL',
        confidence: 0.72,
        reasoning: {
          technical: ['RSI дневной график перекуплен (78.5)', 'Мультитаймфрейм confluence: -3'],
          fundamental: ['ARIMA прогноз: падение на 3.8%'],
          risk: 'ВЫСОКИЙ',
          timeframe: '1-7 дней (swing торговля)'
        }
      },
      {
        pair: 'DOGE/USDT',
        exchange: 'Kraken',
        probability: 0.55,
        indicators: {} as any,
        forecast: {} as any,
        currentPrice: 0.078912,
        signal: 'HOLD',
        confidence: 0.58,
        reasoning: {
          technical: ['RSI нейтральная зона (52.1)', 'Confluence: +1'],
          fundamental: ['Волатильность GARCH: 22.7%'],
          risk: 'УМЕРЕННЫЙ',
          timeframe: '1-7 дней (swing торговля)'
        }
      }
    ];
    
    console.log('📊 Тестовые данные:');
    testAnalyses.forEach(analysis => {
      console.log(`  • ${analysis.pair} (${analysis.exchange}): ${analysis.signal} - ${(analysis.confidence * 100).toFixed(1)}%`);
    });
    
    console.log('\n📤 Отправляем тестовый отчет в Telegram...');
    await telegramService.sendAnalysisReport(testAnalyses);
    
    console.log('\n✅ Тестовый отчет отправлен!');
    console.log('📱 Проверьте ваш Telegram для просмотра отчета с информацией о биржах.');
    console.log('\n🏦 В отчете должны отображаться:');
    console.log('  ✅ Список всех бирж: Bybit, Binance, OKX, Kraken');
    console.log('  ✅ Количество валютных пар: 4');
    console.log('  ✅ Биржа для каждого активного сигнала');
    console.log('  ✅ Биржа для каждой пары в состоянии HOLD');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

testTelegramReport();
