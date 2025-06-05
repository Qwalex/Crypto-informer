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
      console.log(`Анализ пары: ${pair}`);

      // Получаем исторические данные
      const ohlcvData = await this.exchangeService.fetchOHLCVData(pair, '1h', 100);
      const currentPrice = await this.exchangeService.getCurrentPrice(pair);

      // Рассчитываем технические индикаторы
      const indicators = this.technicalAnalysisService.calculateIndicators(ohlcvData);

      // Получаем прогноз от Python сервиса
      const forecast = await this.pythonAnalysisService.analyzeWithARIMAGARCH(ohlcvData, pair);

      // Рассчитываем вероятность и сигнал
      const probability = this.calculateProbability(indicators, forecast, currentPrice);
      const signal = this.generateSignal(probability, indicators, currentPrice);
      const confidence = this.calculateConfidence(indicators, forecast);

      return {
        pair,
        probability,
        indicators,
        forecast,
        currentPrice,
        signal,
        confidence
      };
    } catch (error) {
      console.error(`Ошибка анализа пары ${pair}:`, error);
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
        console.error(`Пропускаем пару ${pair} из-за ошибки:`, error);
      }
    }

    return analyses;
  }

  async generateTradingSignals(analyses: MarketAnalysis[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const analysis of analyses) {
      if (analysis.signal !== 'HOLD' && analysis.confidence > 0.6) {
        signals.push({
          pair: analysis.pair,
          signal: analysis.signal,
          price: analysis.currentPrice,
          probability: analysis.probability,
          confidence: analysis.confidence,
          timestamp: Date.now(),
          analysis
        });
      }
    }

    return signals.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateProbability(
    indicators: TechnicalIndicators, 
    forecast: PythonAnalysisResult, 
    currentPrice: number
  ): number {
    const weights = {
      rsi: 0.2,
      macd: 0.25,
      bollinger: 0.2,
      arima: 0.25,
      garch: 0.1
    };

    let probability = 0;

    // RSI анализ
    const latestRSI = this.technicalAnalysisService.getLatestRSI(indicators);
    if (latestRSI < 30) probability += weights.rsi; // Перепроданность
    else if (latestRSI > 70) probability -= weights.rsi; // Перекупленность
    else probability += (50 - Math.abs(latestRSI - 50)) / 50 * weights.rsi;

    // MACD анализ
    const latestMACD = this.technicalAnalysisService.getLatestMACD(indicators);
    if (latestMACD.macd > latestMACD.signal && latestMACD.histogram > 0) {
      probability += weights.macd;
    } else if (latestMACD.macd < latestMACD.signal && latestMACD.histogram < 0) {
      probability -= weights.macd;
    }

    // Bollinger Bands анализ
    const latestBB = this.technicalAnalysisService.getLatestBollingerBands(indicators);
    if (currentPrice < latestBB.lower) {
      probability += weights.bollinger; // Потенциал отскока
    } else if (currentPrice > latestBB.upper) {
      probability -= weights.bollinger; // Потенциал коррекции
    } else {
      // Цена в среднем диапазоне
      const position = (currentPrice - latestBB.lower) / (latestBB.upper - latestBB.lower);
      probability += (0.5 - position) * weights.bollinger;
    }

    // ARIMA прогноз
    const arimaDiff = (forecast.arima_forecast - currentPrice) / currentPrice;
    probability += Math.tanh(arimaDiff * 10) * weights.arima;

    // GARCH волатильность
    if (forecast.garch_volatility > 0.05) {
      probability += weights.garch; // Высокая волатильность может означать возможность
    }

    // Нормализация от -1 до 1, затем от 0 до 1
    return Math.max(0, Math.min(1, (probability + 1) / 2));
  }

  private generateSignal(
    probability: number, 
    indicators: TechnicalIndicators, 
    currentPrice: number
  ): 'BUY' | 'SELL' | 'HOLD' {
    const rsi = this.technicalAnalysisService.getLatestRSI(indicators);
    const macd = this.technicalAnalysisService.getLatestMACD(indicators);

    if (probability > 0.7 && rsi < 40 && macd.macd > macd.signal) {
      return 'BUY';
    } else if (probability < 0.3 && rsi > 60 && macd.macd < macd.signal) {
      return 'SELL';
    }

    return 'HOLD';
  }

  private calculateConfidence(
    indicators: TechnicalIndicators, 
    forecast: PythonAnalysisResult
  ): number {
    // Базовая уверенность на основе количества доступных данных
    let confidence = 0.5;

    // Увеличиваем уверенность если есть достаточно данных для RSI
    if (indicators.rsi.length >= 14) confidence += 0.1;

    // Увеличиваем уверенность если есть достаточно данных для MACD
    if (indicators.macd.macd.length >= 26) confidence += 0.1;

    // Увеличиваем уверенность если есть достаточно данных для Bollinger Bands
    if (indicators.bollingerBands.upper.length >= 20) confidence += 0.1;

    // Уменьшаем уверенность при высокой волатильности
    if (forecast.garch_volatility > 0.1) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }
}
