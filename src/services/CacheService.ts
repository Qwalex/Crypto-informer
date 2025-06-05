import NodeCache from 'node-cache';
import { MarketAnalysis, TradingSignal } from '../types';

export interface CachedData {
  analyses: MarketAnalysis[];
  signals: TradingSignal[];
  lastUpdate: number;
  marketConditions: {
    totalPairs: number;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
    averageConfidence: number;
    marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
}

export class CacheService {
  private cache: NodeCache;
  private readonly CACHE_KEY = 'market_analysis';
  private readonly CACHE_TTL = 1800; // 30 минут

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 120 // Проверка каждые 2 минуты
    });
  }

  // Сохранить результаты анализа в кеш
  setAnalysisData(analyses: MarketAnalysis[], signals: TradingSignal[]): void {
    const marketConditions = this.calculateMarketConditions(analyses);
    
    const cachedData: CachedData = {
      analyses,
      signals,
      lastUpdate: Date.now(),
      marketConditions
    };

    this.cache.set(this.CACHE_KEY, cachedData);
    console.log(`📦 Кеш обновлен: ${analyses.length} пар, ${signals.length} сигналов`);
  }

  // Получить данные из кеша
  getAnalysisData(): CachedData | null {
    const data = this.cache.get<CachedData>(this.CACHE_KEY);
    return data || null;
  }

  // Проверить актуальность данных
  isDataFresh(maxAgeMinutes: number = 30): boolean {
    const data = this.getAnalysisData();
    if (!data) return false;
    
    const ageMinutes = (Date.now() - data.lastUpdate) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }

  // Получить время последнего обновления
  getLastUpdateTime(): Date | null {
    const data = this.getAnalysisData();
    return data ? new Date(data.lastUpdate) : null;
  }

  // Получить статистику по сигналам
  private calculateMarketConditions(analyses: MarketAnalysis[]) {
    const signalCounts = {
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0
    };

    let totalConfidence = 0;

    analyses.forEach(analysis => {
      switch (analysis.signal) {
        case 'STRONG_BUY': signalCounts.strongBuy++; break;
        case 'BUY': signalCounts.buy++; break;
        case 'HOLD': signalCounts.hold++; break;
        case 'SELL': signalCounts.sell++; break;
        case 'STRONG_SELL': signalCounts.strongSell++; break;
      }
      totalConfidence += analysis.confidence;
    });

    const averageConfidence = analyses.length > 0 ? totalConfidence / analyses.length : 0;
    
    // Определяем настроение рынка
    const bullishSignals = signalCounts.strongBuy + signalCounts.buy;
    const bearishSignals = signalCounts.strongSell + signalCounts.sell;
    
    let marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (bullishSignals > bearishSignals + 2) {
      marketSentiment = 'BULLISH';
    } else if (bearishSignals > bullishSignals + 2) {
      marketSentiment = 'BEARISH';
    } else {
      marketSentiment = 'NEUTRAL';
    }

    return {
      totalPairs: analyses.length,
      strongBuy: signalCounts.strongBuy,
      buy: signalCounts.buy,
      hold: signalCounts.hold,
      sell: signalCounts.sell,
      strongSell: signalCounts.strongSell,
      averageConfidence,
      marketSentiment
    };
  }

  // Очистить кеш
  clearCache(): void {
    this.cache.del(this.CACHE_KEY);
    console.log('🗑️ Кеш очищен');
  }

  // Получить статистику кеша
  getCacheStats() {
    const keys = this.cache.keys();
    const stats = this.cache.getStats();
    
    return {
      keys: keys.length,
      hits: stats.hits,
      misses: stats.misses,
      size: stats.ksize + stats.vsize
    };
  }
}
