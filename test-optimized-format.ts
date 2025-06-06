import { TelegramFormatter } from './src/templates/TelegramFormatter';
import { MarketAnalysis } from './src/types';

// Создаем тестовые данные с несколькими одинаковыми статусами
const testAnalyses: MarketAnalysis[] = [
  // Группа 1: Индикаторы не определились (confluence: 0)
  {
    pair: 'BTC/USDT',
    exchange: 'binance',
    signal: 'HOLD',
    currentPrice: 103676.25,
    confidence: 0.5,
    probability: 0.5,
    indicators: {
      rsi: [55, 54, 56],
      macd: {
        macd: [0.2, 0.1, 0.3],
        signal: [0.15, 0.12, 0.25],
        histogram: [0.05, -0.02, 0.05]
      },
      bollingerBands: {
        upper: [104000, 103800, 104200],
        middle: [103500, 103400, 103600],
        lower: [103000, 103000, 103000]
      }
    },
    forecast: {
      arima_forecast: 103500,
      garch_volatility: 0.02,
      pair: 'BTC/USDT'
    },
    reasoning: {
      technical: ['RSI в нейтральной зоне (55)', 'MACD показывает слабый импульс', 'Technical confluence: 0'],
      fundamental: ['Стабильный рынок'],
      risk: 'УМЕРЕННЫЙ',
      timeframe: '1d'
    }
  },
  {
    pair: 'ETH/USDT',
    exchange: 'binance',
    signal: 'HOLD',
    currentPrice: 3845.67,
    confidence: 0.48,
    probability: 0.52,
    indicators: {
      rsi: [52, 51, 53],
      macd: {
        macd: [-0.1, -0.05, -0.15],
        signal: [-0.08, -0.06, -0.12],
        histogram: [-0.02, 0.01, -0.03]
      },
      bollingerBands: {
        upper: [3900, 3880, 3920],
        middle: [3850, 3840, 3860],
        lower: [3800, 3800, 3800]
      }
    },
    forecast: {
      arima_forecast: 3840,
      garch_volatility: 0.025,
      pair: 'ETH/USDT'
    },
    reasoning: {
      technical: ['RSI близко к нейтральному (52)', 'MACD слабо негативный', 'Technical confluence: 0'],
      fundamental: ['Нейтральные настроения'],
      risk: 'УМЕРЕННЫЙ',
      timeframe: '1d'
    }
  },
  {
    pair: 'ADA/USDT',
    exchange: 'bybit',
    signal: 'HOLD',
    currentPrice: 1.034,
    confidence: 0.45,
    probability: 0.5,
    indicators: {
      rsi: [58, 57, 59],
      macd: {
        macd: [0.05, 0.03, 0.07],
        signal: [0.04, 0.04, 0.06],
        histogram: [0.01, -0.01, 0.01]
      },
      bollingerBands: {
        upper: [1.05, 1.04, 1.06],
        middle: [1.03, 1.03, 1.04],
        lower: [1.01, 1.02, 1.02]
      }
    },
    forecast: {
      arima_forecast: 1.035,
      garch_volatility: 0.015,
      pair: 'ADA/USDT'
    },
    reasoning: {
      technical: ['RSI в середине диапазона (58)', 'MACD почти нулевой', 'Technical confluence: 0'],
      fundamental: ['Стабильные фундаментальные показатели'],
      risk: 'УМЕРЕННЫЙ',
      timeframe: '1d'
    }
  },
  {
    pair: 'DOT/USDT',
    exchange: 'bybit',
    signal: 'HOLD',
    currentPrice: 7.23,
    confidence: 0.47,
    probability: 0.49,
    indicators: {
      rsi: [56, 55, 57],
      macd: {
        macd: [-0.02, -0.01, -0.03],
        signal: [-0.015, -0.02, -0.01],
        histogram: [-0.005, 0.01, -0.02]
      },
      bollingerBands: {
        upper: [7.4, 7.35, 7.45],
        middle: [7.2, 7.25, 7.3],
        lower: [7.0, 7.15, 7.15]
      }
    },
    forecast: {
      arima_forecast: 7.25,
      garch_volatility: 0.018,
      pair: 'DOT/USDT'
    },
    reasoning: {
      technical: ['RSI нейтральный (56)', 'MACD практически ноль', 'Technical confluence: 0'],
      fundamental: ['Умеренные перспективы'],
      risk: 'УМЕРЕННЫЙ',
      timeframe: '1d'
    }
  },
  
  // Группа 2: Слабые сигналы роста (confluence: 1)
  {
    pair: 'SOL/USDT',
    exchange: 'binance',
    signal: 'HOLD',
    currentPrice: 245.67,
    confidence: 0.55,
    probability: 0.58,
    indicators: {
      rsi: [62, 61, 63],
      macd: {
        macd: [0.8, 0.7, 0.9],
        signal: [0.6, 0.65, 0.75],
        histogram: [0.2, 0.05, 0.15]
      },
      bollingerBands: {
        upper: [250, 248, 252],
        middle: [245, 244, 246],
        lower: [240, 240, 240]
      }
    },
    forecast: {
      arima_forecast: 248,
      garch_volatility: 0.022,
      pair: 'SOL/USDT'
    },
    reasoning: {
      technical: ['RSI показывает силу (62)', 'MACD положительный', 'Technical confluence: 1'],
      fundamental: ['Позитивные новости экосистемы'],
      risk: 'НИЗКИЙ',
      timeframe: '1d'
    }
  },
  {
    pair: 'AVAX/USDT',
    exchange: 'bybit',
    signal: 'HOLD',
    currentPrice: 42.15,
    confidence: 0.53,
    probability: 0.56,
    indicators: {
      rsi: [59, 58, 60],
      macd: {
        macd: [0.3, 0.25, 0.35],
        signal: [0.2, 0.22, 0.28],
        histogram: [0.1, 0.03, 0.07]
      },
      bollingerBands: {
        upper: [43, 42.8, 43.2],
        middle: [42, 42.1, 42.3],
        lower: [41, 41.4, 41.4]
      }
    },
    forecast: {
      arima_forecast: 42.5,
      garch_volatility: 0.019,
      pair: 'AVAX/USDT'
    },
    reasoning: {
      technical: ['RSI выше среднего (59)', 'MACD растет', 'Technical confluence: 1'],
      fundamental: ['Развитие DeFi экосистемы'],
      risk: 'НИЗКИЙ',
      timeframe: '1d'
    }
  },
  
  // Группа 3: Слабые сигналы падения (confluence: -1)
  {
    pair: 'LINK/USDT',
    exchange: 'binance',
    signal: 'HOLD',
    currentPrice: 28.45,
    confidence: 0.52,
    probability: 0.45,
    indicators: {
      rsi: [42, 41, 43],
      macd: {
        macd: [-0.5, -0.4, -0.6],
        signal: [-0.3, -0.35, -0.45],
        histogram: [-0.2, -0.05, -0.15]
      },
      bollingerBands: {
        upper: [29, 28.8, 29.2],
        middle: [28.5, 28.4, 28.6],
        lower: [28, 28, 28]
      }
    },
    forecast: {
      arima_forecast: 28.2,
      garch_volatility: 0.028,
      pair: 'LINK/USDT'
    },
    reasoning: {
      technical: ['RSI ниже среднего (42)', 'MACD отрицательный', 'Technical confluence: -1'],
      fundamental: ['Снижение активности оракулов'],
      risk: 'ВЫСОКИЙ',
      timeframe: '1d'
    }
  }
];

console.log('🧪 Тестируем новый оптимизированный формат Telegram сообщений...\n');

// Форматируем сообщения
const messages = TelegramFormatter.formatAnalysisReport(testAnalyses);

console.log(`📊 Сгенерировано сообщений: ${messages.length}\n`);

// Выводим каждое сообщение
messages.forEach((message, index) => {
  console.log(`📝 СООБЩЕНИЕ ${index + 1}:`);
  console.log('─'.repeat(80));
  console.log(message);
  console.log('─'.repeat(80));
  console.log(`📏 Длина: ${message.length} символов\n`);
});

console.log('✅ Демонстрация нового формата завершена!');
