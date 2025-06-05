import { RSI, MACD, BollingerBands } from 'technicalindicators';
import { OHLCVData, TechnicalIndicators } from '../types';

export class TechnicalAnalysisService {
  
  calculateIndicators(data: OHLCVData[]): TechnicalIndicators {
    const closePrices = data.map(item => item.close);
    const highPrices = data.map(item => item.high);
    const lowPrices = data.map(item => item.low);

    // RSI
    const rsi = RSI.calculate({
      values: closePrices,
      period: 14
    });

    // MACD
    const macd = MACD.calculate({
      values: closePrices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    // Bollinger Bands
    const bollingerBands = BollingerBands.calculate({
      values: closePrices,
      period: 20,
      stdDev: 2
    });

    return {
      rsi,
      macd: {
        macd: macd.map(m => m.MACD || 0),
        signal: macd.map(m => m.signal || 0),
        histogram: macd.map(m => m.histogram || 0)
      },
      bollingerBands: {
        upper: bollingerBands.map(bb => bb.upper),
        middle: bollingerBands.map(bb => bb.middle),
        lower: bollingerBands.map(bb => bb.lower)
      }
    };
  }

  getLatestRSI(indicators: TechnicalIndicators): number {
    return indicators.rsi[indicators.rsi.length - 1] || 50;
  }

  getLatestMACD(indicators: TechnicalIndicators): { macd: number; signal: number; histogram: number } {
    const macdLength = indicators.macd.macd.length;
    return {
      macd: indicators.macd.macd[macdLength - 1] || 0,
      signal: indicators.macd.signal[macdLength - 1] || 0,
      histogram: indicators.macd.histogram[macdLength - 1] || 0
    };
  }

  getLatestBollingerBands(indicators: TechnicalIndicators): { upper: number; middle: number; lower: number } {
    const bbLength = indicators.bollingerBands.upper.length;
    return {
      upper: indicators.bollingerBands.upper[bbLength - 1] || 0,
      middle: indicators.bollingerBands.middle[bbLength - 1] || 0,
      lower: indicators.bollingerBands.lower[bbLength - 1] || 0
    };
  }
}
