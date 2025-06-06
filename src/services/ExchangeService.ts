import * as ccxt from 'ccxt';
import { OHLCVData } from '../types';

export class ExchangeService {
  private exchanges: Map<string, ccxt.Exchange> = new Map();
  private currentExchange: string = 'bybit'; // По умолчанию

  constructor(selectedExchanges?: string[]) {
    this.initializeExchanges(selectedExchanges || ['bybit']);
  }  private initializeExchanges(selectedExchanges: string[]): void {
    console.log(`🏦 Инициализация бирж: ${selectedExchanges.join(', ')}`);
    
    for (const exchangeName of selectedExchanges) {
      try {
        let exchange: ccxt.Exchange;
        
        // Создаем биржи без API ключей для получения публичных данных
        switch (exchangeName.toLowerCase()) {
          case 'bybit':
            exchange = new ccxt.bybit({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'binance':
            exchange = new ccxt.binance({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'okx':
            exchange = new ccxt.okx({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'kraken':
            exchange = new ccxt.kraken({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'kucoin':
            exchange = new ccxt.kucoin({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'bitget':
            exchange = new ccxt.bitget({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'gate':
            exchange = new ccxt.gate({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
            
          case 'mexc':
            exchange = new ccxt.mexc({
              sandbox: false,
              enableRateLimit: true,
            });
            break;
              default:
            console.warn(`⚠️ Биржа ${exchangeName} не поддерживается напрямую, используем общий подход`);
            // Для неизвестных бирж пытаемся создать экземпляр динамически
            if ((ccxt as any)[exchangeName.toLowerCase()]) {
              exchange = new (ccxt as any)[exchangeName.toLowerCase()]({
                sandbox: false,
                enableRateLimit: true,
              });
            } else {
              console.warn(`⚠️ Биржа ${exchangeName} не найдена в ccxt, используем Bybit`);
              exchange = new ccxt.bybit({
                sandbox: false,
                enableRateLimit: true,
              });
            }
        }
        
        this.exchanges.set(exchangeName.toLowerCase(), exchange);
        console.log(`✅ Биржа ${exchangeName} инициализирована для работы с публичными данными`);
        
      } catch (error) {
        console.error(`❌ Ошибка инициализации биржи ${exchangeName}:`, error);
        // Если основная биржа не инициализировалась, добавляем Bybit как fallback
        if (exchangeName.toLowerCase() === 'bybit') {
          throw error;
        }
      }
    }
    
    // Устанавливаем первую успешно инициализированную биржу как текущую
    if (this.exchanges.size > 0) {
      this.currentExchange = Array.from(this.exchanges.keys())[0];
      console.log(`🎯 Установлена текущая биржа: ${this.currentExchange}`);
    } else {
      throw new Error('❌ Не удалось инициализировать ни одной биржи');
    }
  }

  getExchangeName(): string {
    const exchange = this.exchanges.get(this.currentExchange);
    return exchange?.name || this.currentExchange.charAt(0).toUpperCase() + this.currentExchange.slice(1);
  }

  setCurrentExchange(exchangeName: string): boolean {
    const normalizedName = exchangeName.toLowerCase();
    if (this.exchanges.has(normalizedName)) {
      this.currentExchange = normalizedName;
      return true;
    }
    return false;
  }

  getCurrentExchange(): string {
    return this.currentExchange;
  }

  getAvailableExchanges(): string[] {
    return Array.from(this.exchanges.keys());
  }

  async fetchOHLCVData(
    symbol: string, 
    timeframe: string = '1h', 
    limit: number = 100,
    exchangeName?: string
  ): Promise<OHLCVData[]> {
    const targetExchange = exchangeName || this.currentExchange;
    const exchange = this.exchanges.get(targetExchange);
    
    if (!exchange) {
      throw new Error(`Биржа ${targetExchange} не инициализирована`);
    }

    try {
      const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      
      return ohlcv.map((item: any) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5]
      }));
    } catch (error) {
      console.error(`Ошибка получения данных для ${symbol} на ${targetExchange}:`, error);
      throw error;
    }
  }

  async getCurrentPrice(symbol: string, exchangeName?: string): Promise<number> {
    const targetExchange = exchangeName || this.currentExchange;
    const exchange = this.exchanges.get(targetExchange);
    
    if (!exchange) {
      throw new Error(`Биржа ${targetExchange} не инициализирована`);
    }

    try {
      const ticker = await exchange.fetchTicker(symbol);
      return Number(ticker.last || ticker.close || 0);
    } catch (error) {
      console.error(`Ошибка получения текущей цены для ${symbol} на ${targetExchange}:`, error);
      throw error;
    }
  }

  async getMarketInfo(symbol: string, exchangeName?: string) {
    const targetExchange = exchangeName || this.currentExchange;
    const exchange = this.exchanges.get(targetExchange);
    
    if (!exchange) {
      throw new Error(`Биржа ${targetExchange} не инициализирована`);
    }

    try {
      const ticker = await exchange.fetchTicker(symbol);
      
      return {
        symbol,
        price: Number(ticker.last || ticker.close || 0),
        change24h: Number(ticker.percentage || 0),
        volume24h: Number(ticker.baseVolume || 0),
        high24h: Number(ticker.high || 0),
        low24h: Number(ticker.low || 0),
        exchange: targetExchange
      };
    } catch (error) {
      console.error(`Ошибка получения информации о рынке для ${symbol} на ${targetExchange}:`, error);
      throw error;
    }
  }
}
