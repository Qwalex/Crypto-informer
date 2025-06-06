import { ExchangeService } from './ExchangeService';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';
import { PythonAnalysisService } from './PythonAnalysisService';
import { TelegramService } from './TelegramService';
import { MarketAnalysis, TradingSignal, OHLCVData, TechnicalIndicators, PythonAnalysisResult } from '../types';

export class MarketAnalysisService {
  private exchangeService: ExchangeService;
  private technicalAnalysisService: TechnicalAnalysisService;
  private pythonAnalysisService: PythonAnalysisService;
  private telegramService: TelegramService;

  constructor(
    exchangeService: ExchangeService,
    technicalAnalysisService: TechnicalAnalysisService,
    pythonAnalysisService: PythonAnalysisService,
    telegramService: TelegramService
  ) {
    this.exchangeService = exchangeService;
    this.technicalAnalysisService = technicalAnalysisService;
    this.pythonAnalysisService = pythonAnalysisService;
    this.telegramService = telegramService;
  }

  async analyzePair(pair: string): Promise<MarketAnalysis> {
    try {
      console.log(`📊 Swing-анализ пары: ${pair}`);      // Получаем данные для разных временных рамок
      const ohlcv1h = await this.exchangeService.fetchOHLCVData(pair, '1h', 200); // Увеличиваем до 200 для достаточного анализа
      const ohlcv4h = await this.exchangeService.fetchOHLCVData(pair, '4h', 50);
      const ohlcv1d = await this.exchangeService.fetchOHLCVData(pair, '1d', 30);
      const currentPrice = await this.exchangeService.getCurrentPrice(pair);

      // Мультитаймфрейм анализ
      const indicators1h = this.technicalAnalysisService.calculateIndicators(ohlcv1h);
      const indicators4h = this.technicalAnalysisService.calculateIndicators(ohlcv4h);
      const indicators1d = this.technicalAnalysisService.calculateIndicators(ohlcv1d);

      // Прогноз от Python сервиса
      const forecast = await this.pythonAnalysisService.analyzeWithARIMAGARCH(ohlcv1h, pair);

      // Swing-анализ
      const swingAnalysis = this.performSwingAnalysis({
        indicators1h,
        indicators4h,
        indicators1d,
        forecast,
        currentPrice,
        ohlcvData: ohlcv1h
      });

      const signal = this.generateSwingSignal(swingAnalysis);      const reasoning = this.generateReasoning(swingAnalysis, signal);
      const swingTargets = this.calculateSwingTargets(currentPrice, indicators1d, signal);

      return {
        pair,
        exchange: this.exchangeService.getExchangeName(),
        probability: swingAnalysis.probability,
        indicators: indicators1h, // Основные индикаторы для отображения
        forecast,
        currentPrice,
        signal,
        confidence: swingAnalysis.confidence,
        reasoning
      };
    } catch (error) {
      console.error(`❌ Ошибка swing-анализа пары ${pair}:`, error);
      throw error;
    }
  }

  async analyzeMultiplePairs(pairs: string[]): Promise<MarketAnalysis[]> {
    const analyses: MarketAnalysis[] = [];

    for (const pair of pairs) {
      try {
        const analysis = await this.analyzePair(pair);
        analyses.push(analysis);
        
        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Ошибка анализа пары ${pair}:`, error);
        continue;
      }
    }

    return analyses;
  }

  async analyzeMultipleExchanges(pairs: string[]): Promise<MarketAnalysis[]> {
    const analyses: MarketAnalysis[] = [];
    const availableExchanges = this.exchangeService.getAvailableExchanges();

    console.log(`🔍 Анализируем ${pairs.length} пар на ${availableExchanges.length} биржах...`);

    for (const exchangeName of availableExchanges) {
      console.log(`\n🏦 Анализ на бирже: ${exchangeName.toUpperCase()}`);
      
      // Устанавливаем текущую биржу
      this.exchangeService.setCurrentExchange(exchangeName);
      
      for (const pair of pairs) {
        try {
          const analysis = await this.analyzePair(pair);
          analyses.push(analysis);
          
          console.log(`  ✅ ${pair} (${exchangeName}) - ${analysis.signal}`);
          
          // Задержка между запросами для избежания ограничений API
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`  ❌ Ошибка анализа ${pair} на ${exchangeName}:`, error);
          continue;
        }
      }
    }

    console.log(`\n📊 Общий результат: проанализировано ${analyses.length} пар`);
    return analyses;
  }

  async generateTradingSignals(analyses: MarketAnalysis[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const analysis of analyses) {
      if (analysis.signal !== 'HOLD' && analysis.confidence > 0.65) { // Повышенный порог уверенности
        const swingTargets = this.calculateSwingTargets(
          analysis.currentPrice, 
          analysis.indicators, 
          analysis.signal
        );

        signals.push({
          pair: analysis.pair,
          exchange: analysis.exchange,
          signal: analysis.signal,
          price: analysis.currentPrice,
          probability: analysis.probability,
          confidence: analysis.confidence,
          timestamp: Date.now(),
          analysis,
          swingTarget: swingTargets
        });
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  private performSwingAnalysis(data: {
    indicators1h: TechnicalIndicators;
    indicators4h: TechnicalIndicators;
    indicators1d: TechnicalIndicators;
    forecast: PythonAnalysisResult;
    currentPrice: number;
    ohlcvData: OHLCVData[];
  }): any {
    const { indicators1h, indicators4h, indicators1d, forecast, currentPrice, ohlcvData } = data;

    // Получаем последние значения индикаторов
    const rsi1h = indicators1h.rsi[indicators1h.rsi.length - 1];
    const rsi4h = indicators4h.rsi[indicators4h.rsi.length - 1];
    const rsi1d = indicators1d.rsi[indicators1d.rsi.length - 1];

    const macd1h = {
      macd: indicators1h.macd.macd[indicators1h.macd.macd.length - 1],
      signal: indicators1h.macd.signal[indicators1h.macd.signal.length - 1],
      histogram: indicators1h.macd.histogram[indicators1h.macd.histogram.length - 1]
    };

    const macd4h = {
      macd: indicators4h.macd.macd[indicators4h.macd.macd.length - 1],
      signal: indicators4h.macd.signal[indicators4h.macd.signal.length - 1],
      histogram: indicators4h.macd.histogram[indicators4h.macd.histogram.length - 1]
    };

    const bb1d = {
      upper: indicators1d.bollingerBands.upper[indicators1d.bollingerBands.upper.length - 1],
      middle: indicators1d.bollingerBands.middle[indicators1d.bollingerBands.middle.length - 1],
      lower: indicators1d.bollingerBands.lower[indicators1d.bollingerBands.lower.length - 1]
    };

    // Анализ тренда (последние 7 дней)
    const recentPrices = ohlcvData.slice(-168).map(d => d.close); // 7 дней * 24 часа
    const trendStrength = this.calculateTrendStrength(recentPrices);
    const volatility = forecast.garch_volatility;
    const forecastDiff = (forecast.arima_forecast - currentPrice) / currentPrice * 100;

    // Расчет позиции в BB канале
    const bbPosition = (currentPrice - bb1d.lower) / (bb1d.upper - bb1d.lower);

    // Дивергенция между таймфреймами
    const rsiDivergence = Math.abs(rsi1h - rsi4h) + Math.abs(rsi4h - rsi1d);
    
    // Confluence (схождение сигналов)
    let confluence = 0;
    if (rsi1h < 30 && rsi4h < 35 && rsi1d < 40) confluence += 3; // Бычья confluence
    if (rsi1h > 70 && rsi4h > 65 && rsi1d > 60) confluence -= 3; // Медвежья confluence
    
    if (macd1h.histogram > 0 && macd4h.histogram > 0) confluence += 2;
    if (macd1h.histogram < 0 && macd4h.histogram < 0) confluence -= 2;

    // Расчет вероятности для swing-торговли
    let probability = 50; // Базовая нейтральная вероятность

    // Мультитаймфрейм RSI
    if (rsi1d < 25) probability += 25;
    else if (rsi1d < 35) probability += 15;
    else if (rsi1d > 75) probability -= 25;
    else if (rsi1d > 65) probability -= 15;

    // MACD confluence
    if (confluence >= 3) probability += 20;
    else if (confluence <= -3) probability -= 20;

    // Bollinger Bands позиция
    if (bbPosition < 0.1) probability += 15;
    else if (bbPosition > 0.9) probability -= 15;

    // ARIMA прогноз
    if (forecastDiff > 5) probability += 20;
    else if (forecastDiff < -5) probability -= 20;

    // Тренд
    if (trendStrength > 0.7) probability += 10;
    else if (trendStrength < -0.7) probability -= 10;

    // Волатильность
    if (volatility > 2.0) probability -= 10; // Слишком высокая волатильность
    else if (volatility < 0.3) probability -= 5; // Слишком низкая волатильность    // Нормализация вероятности
    probability = Math.max(0, Math.min(100, probability));

    // Расчет уверенности
    let confidence = 0.5;
    if (Math.abs(confluence) >= 3) confidence += 0.2;
    if (rsiDivergence < 10) confidence += 0.1;
    if (volatility > 0.5 && volatility < 1.5) confidence += 0.1;
    if (Math.abs(forecastDiff) > 2) confidence += 0.1;

    confidence = Math.max(0, Math.min(1, confidence));

    return {
      probability: probability / 100, // Преобразуем в значение от 0 до 1
      confidence,
      rsi: { h1: rsi1h, h4: rsi4h, d1: rsi1d },
      macd: { h1: macd1h, h4: macd4h },
      bbPosition,
      trendStrength,
      volatility,
      forecastDiff,
      confluence,
      rsiDivergence
    };
  }
  private generateSwingSignal(analysis: any): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    const { probability, confidence, rsi, macd, bbPosition, trendStrength, volatility, forecastDiff, confluence } = analysis;

    // STRONG_BUY условия (очень строгие для swing)
    if (
      probability >= 0.85 &&
      confidence >= 0.8 &&
      rsi.d1 < 25 &&
      rsi.h4 < 30 &&
      confluence >= 4 &&
      bbPosition < 0.15 &&
      forecastDiff > 5 &&
      volatility < 1.5
    ) {
      return 'STRONG_BUY';
    }

    // BUY условия (строгие)
    if (
      probability >= 0.75 &&
      confidence >= 0.7 &&
      ((rsi.d1 < 35 && rsi.h4 < 40) || confluence >= 3) &&
      bbPosition < 0.3 &&
      forecastDiff > 2 &&
      volatility < 2.0
    ) {
      return 'BUY';
    }    // STRONG_SELL условия (очень строгие)
    if (
      probability <= 0.15 &&
      confidence >= 0.8 &&
      rsi.d1 > 75 &&
      rsi.h4 > 70 &&
      confluence <= -4 &&
      bbPosition > 0.85 &&
      forecastDiff < -5 &&
      volatility > 1.0
    ) {
      return 'STRONG_SELL';
    }

    // SELL условия (строгие)
    if (
      probability <= 0.25 &&
      confidence >= 0.7 &&
      ((rsi.d1 > 65 && rsi.h4 > 60) || confluence <= -3) &&
      bbPosition > 0.7 &&
      forecastDiff < -2 &&
      volatility > 0.8
    ) {
      return 'SELL';
    }

    return 'HOLD';
  }

  private generateReasoning(analysis: any, signal: string): any {
    const { rsi, macd, bbPosition, trendStrength, volatility, forecastDiff, confluence } = analysis;
    
    const technical: string[] = [];
    const fundamental: string[] = [];
    let risk = 'УМЕРЕННЫЙ';

    // Технический анализ
    if (rsi.d1 < 30) {
      technical.push(`📉 RSI дневной график перепродан (${rsi.d1.toFixed(1)})`);
    } else if (rsi.d1 > 70) {
      technical.push(`📈 RSI дневной график перекуплен (${rsi.d1.toFixed(1)})`);
    }

    if (confluence > 0) {
      technical.push(`✅ Мультитаймфрейм confluence: +${confluence}`);
    } else if (confluence < 0) {
      technical.push(`❌ Мультитаймфрейм confluence: ${confluence}`);
    }

    if (bbPosition < 0.2) {
      technical.push(`📊 Цена у нижней границы BB канала (${(bbPosition * 100).toFixed(1)}%)`);
    } else if (bbPosition > 0.8) {
      technical.push(`📊 Цена у верхней границы BB канала (${(bbPosition * 100).toFixed(1)}%)`);
    }

    if (Math.abs(trendStrength) > 0.6) {
      technical.push(`📈 Сильный тренд: ${trendStrength > 0 ? 'восходящий' : 'нисходящий'} (${(trendStrength * 100).toFixed(1)}%)`);
    }

    // Фундаментальный анализ
    if (Math.abs(forecastDiff) > 3) {
      fundamental.push(`🔮 ARIMA прогноз: ${forecastDiff > 0 ? 'рост' : 'падение'} на ${Math.abs(forecastDiff).toFixed(1)}%`);
    }

    fundamental.push(`📊 Волатильность GARCH: ${(volatility * 100).toFixed(1)}%`);

    // Оценка риска
    if (signal.includes('STRONG')) {
      risk = volatility > 1.5 ? 'ВЫСОКИЙ' : 'УМЕРЕННЫЙ';
    } else {
      risk = volatility > 2.0 ? 'ВЫСОКИЙ' : volatility < 0.5 ? 'НИЗКИЙ' : 'УМЕРЕННЫЙ';
    }

    return {
      technical,
      fundamental,
      risk,
      timeframe: '1-7 дней (swing торговля)'
    };
  }

  private calculateSwingTargets(currentPrice: number, indicators: TechnicalIndicators, signal: string): any {
    const bb = {
      upper: indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1],
      middle: indicators.bollingerBands.middle[indicators.bollingerBands.middle.length - 1],
      lower: indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1]
    };

    const volatility = (bb.upper - bb.lower) / bb.middle;

    if (signal === 'STRONG_BUY' || signal === 'BUY') {
      return {
        entry: currentPrice,
        stopLoss: currentPrice * (1 - volatility * 0.5), // Stop loss на основе волатильности
        takeProfit: currentPrice * (1 + volatility * 1.5), // Take profit 3:1 risk/reward
        timeframe: '3-7 дней'
      };
    } else if (signal === 'STRONG_SELL' || signal === 'SELL') {
      return {
        entry: currentPrice,
        stopLoss: currentPrice * (1 + volatility * 0.5),
        takeProfit: currentPrice * (1 - volatility * 1.5),
        timeframe: '3-7 дней'
      };
    }

    return {
      entry: currentPrice,
      stopLoss: currentPrice,
      takeProfit: currentPrice,
      timeframe: 'удержание'
    };
  }
  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 168) return 0; // Нужно минимум 168 точек для анализа
    
    const recentPrices = prices.slice(-48); // Последние 48 часов (2 дня)
    const oldPrices = prices.slice(-168, -120); // 5-7 дней назад

    // Дополнительная проверка на пустые массивы
    if (recentPrices.length === 0 || oldPrices.length === 0) {
      return 0;
    }

    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const oldAvg = oldPrices.reduce((a, b) => a + b, 0) / oldPrices.length;

    return oldAvg !== 0 ? (recentAvg - oldAvg) / oldAvg : 0;
  }

  // Вспомогательные методы для технического анализа (сохраняем совместимость)
  private calculateProbability(
    indicators: TechnicalIndicators, 
    forecast: PythonAnalysisResult, 
    currentPrice: number
  ): number {
    // Упрощенная версия для обратной совместимости
    return 0.5;
  }

  private calculateConfidence(
    indicators: TechnicalIndicators, 
    forecast: PythonAnalysisResult
  ): number {
    // Упрощенная версия для обратной совместимости
    return 0.7;
  }
}
