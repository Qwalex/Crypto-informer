import * as ccxt from 'ccxt';
import { OHLCVData } from '../types';

export class ExchangeService {
  private exchange: ccxt.Exchange;
  constructor() {
    this.exchange = new ccxt.bybit({
      apiKey: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_SECRET_KEY,
      sandbox: false, // Установить true для тестового режима
      enableRateLimit: true,
    });
  }

  async fetchOHLCVData(
    symbol: string, 
    timeframe: string = '1h', 
    limit: number = 100
  ): Promise<OHLCVData[]> {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      
      return ohlcv.map((item: any) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5]
      }));
    } catch (error) {
      console.error(`Ошибка получения данных для ${symbol}:`, error);
      throw error;
    }
  }
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return Number(ticker.last || ticker.close || 0);
    } catch (error) {
      console.error(`Ошибка получения текущей цены для ${symbol}:`, error);
      throw error;
    }
  }

  async getMarketInfo(symbol: string) {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);      return {
        symbol,
        price: Number(ticker.last || ticker.close || 0),
        change24h: Number(ticker.percentage || 0),
        volume24h: Number(ticker.baseVolume || 0),
        high24h: Number(ticker.high || 0),
        low24h: Number(ticker.low || 0)
      };
    } catch (error) {
      console.error(`Ошибка получения информации о рынке для ${symbol}:`, error);
      throw error;
    }
  }
}
