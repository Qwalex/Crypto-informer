import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import { CacheService, CachedData } from './CacheService';
import { ConfigService, BotConfiguration } from './ConfigService';
import { TelegramHelperService } from './TelegramHelperService';

export class ApiService {
  private app: express.Application;
  private cacheService: CacheService;
  private configService: ConfigService;
  private telegramHelper: TelegramHelperService;
  private port: number;
  private server: any;

  constructor(cacheService: CacheService, port: number = 3001) {
    this.app = express();
    this.cacheService = cacheService;
    this.configService = new ConfigService();
    this.telegramHelper = new TelegramHelperService();
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Настройка EJS шаблонизатора
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(process.cwd(), 'views'));
    
    // Статические файлы
    this.app.use(express.static(path.join(process.cwd(), 'public')));
  }

  private setupRoutes(): void {
    // Главная страница админки
    this.app.get('/admin', (req: Request, res: Response) => {
      res.render('admin');
    });

    // API для получения конфигурации
    this.app.get('/api/admin/config', async (req: Request, res: Response) => {
      try {
        const config = await this.configService.loadConfiguration();
        res.json(config);
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка загрузки конфигурации',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // API для сохранения конфигурации
    this.app.post('/api/admin/config', async (req: Request, res: Response) => {
      try {
        const config = req.body as BotConfiguration;
        await this.configService.saveConfiguration(config);
        res.json({ success: true, message: 'Конфигурация сохранена успешно' });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Ошибка сохранения конфигурации',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // API для получения доступных валютных пар
    this.app.get('/api/admin/available-pairs', async (req: Request, res: Response) => {
      try {
        const exchanges = req.query.exchanges as string;
        const selectedExchanges = exchanges ? exchanges.split(',') : ['bybit'];
        
        console.log('Запрос пар для бирж:', selectedExchanges);
        
        // Получаем реальные данные с биржи через кеш
        const cachedData = this.cacheService.getAnalysisData();
        let availablePairs: string[] = [];

        if (cachedData && cachedData.analyses && cachedData.analyses.length > 0) {
          // Если есть кешированные данные, используем их
          availablePairs = [...new Set(cachedData.analyses.map(a => a.pair))].sort();        } else {
          // Если нет кешированных данных, используем популярные пары как fallback
          // Базовые пары для всех бирж
          const basePairs = [
            'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'SOL/USDT',
            'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'SHIB/USDT', 'AVAX/USDT', 'LINK/USDT',
            'UNI/USDT', 'LTC/USDT', 'BCH/USDT', 'ATOM/USDT', 'FIL/USDT', 'TRX/USDT',
            'ETC/USDT', 'XMR/USDT', 'ALGO/USDT', 'VET/USDT', 'ICP/USDT', 'THETA/USDT',
            'MANA/USDT', 'SAND/USDT', 'AXS/USDT', 'NEAR/USDT', 'GRT/USDT', 'ENJ/USDT',
            'CHZ/USDT', 'SUSHI/USDT', 'BAT/USDT', 'CRV/USDT', 'COMP/USDT', 'YFI/USDT'
          ];          availablePairs = [...basePairs];

          // Добавляем специфичные токены для различных бирж
          const exchangeSpecificTokens: Record<string, string[]> = {
            'binance': ['BNB/USDT', 'BUSD/USDT', 'TUSD/USDT', 'FDUSD/USDT'],
            'bybit': ['BYB/USDT'],
            'okx': ['OKB/USDT', 'OKT/USDT'],
            'kucoin': ['KCS/USDT'],
            'gate': ['GT/USDT'],
            'mexc': ['MEXC/USDT', 'MX/USDT'],
            'bitget': ['BGB/USDT'],
            'huobi': ['HT/USDT'],
            'htx': ['HT/USDT'],
            'bitfinex': ['LEO/USDT'],
            'cryptocom': ['CRO/USDT'],
            'lbank': ['LBK/USDT'],
            'coinbase': ['USDC/USDT'],
            'kraken': ['XBT/USDT'],
            'bitmex': ['XBT/USDT'],
            'phemex': ['PHEMEX/USDT'],
            'bitmart': ['BMX/USDT'],
            'ascendex': ['ASD/USDT'],
            'digifinex': ['DGT/USDT'],
            'xt': ['XT/USDT'],
            'whitebit': ['WBT/USDT'],
            'probit': ['PROB/USDT'],
            'latoken': ['LA/USDT'],
            'poloniex': ['TRX/USDT'],
            'deribit': ['BTC/USD', 'ETH/USD'],
            'bithumb': ['KRW/USDT'],
            'upbit': ['KRW/USDT'],
            'coinone': ['KRW/USDT'],
            'bitflyer': ['JPY/USDT'],
            'zaif': ['JPY/USDT'],
            'btcmarkets': ['AUD/USDT'],
            'coinspot': ['AUD/USDT'],
            'independentreserve': ['AUD/USDT'],
            'mercado': ['BRL/USDT'],
            'novadax': ['BRL/USDT'],
            'btcturk': ['TRY/USDT'],
            'bit2c': ['ILS/USDT'],
            'indodax': ['IDR/USDT'],
            'tokocrypto': ['IDR/USDT'],
            'coinsph': ['PHP/USDT'],
            'ndax': ['CAD/USDT'],
            'bitso': ['MXN/USDT'],
            'luno': ['ZAR/USDT']
          };

          selectedExchanges.forEach(exchange => {
            if (exchangeSpecificTokens[exchange]) {
              availablePairs.push(...exchangeSpecificTokens[exchange]);
            }
          });
          
          availablePairs = [...new Set(availablePairs)].sort();
        }
        
        console.log(`Возвращаем ${availablePairs.length} пар для бирж: ${selectedExchanges.join(', ')}`);
        res.json(availablePairs);
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения списка пар',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Проверка Bot Token
    this.app.post('/api/admin/telegram/validate', async (req: Request, res: Response) => {
      try {
        const { botToken } = req.body;
        
        if (!botToken) {
          return res.status(400).json({
            valid: false,
            error: 'Bot Token не указан'
          });
        }

        const result = await this.telegramHelper.validateBotToken(botToken);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          valid: false,
          error: 'Ошибка проверки токена',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Поиск Chat ID
    this.app.post('/api/admin/telegram/find-chat', async (req: Request, res: Response) => {
      try {
        const { botToken } = req.body;
        
        if (!botToken) {
          return res.status(400).json({
            found: false,
            error: 'Bot Token не указан'
          });
        }

        const result = await this.telegramHelper.findChatId(botToken);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          found: false,
          error: 'Ошибка поиска Chat ID',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Отправка тестового сообщения
    this.app.post('/api/admin/telegram/test', async (req: Request, res: Response) => {
      try {
        const { botToken, chatId } = req.body;
        
        if (!botToken || !chatId) {
          return res.status(400).json({
            success: false,
            error: 'Bot Token и Chat ID обязательны'
          });
        }

        const result = await this.telegramHelper.sendTestMessage(botToken, chatId);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Ошибка отправки сообщения',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Проверка статуса системы
    this.app.get('/api/admin/status', async (req: Request, res: Response) => {
      try {
        const cachedData = this.cacheService.getAnalysisData();
        const config = await this.configService.loadConfiguration();
        
        // Получаем информацию о поддерживаемых биржах
        const supportedExchanges = [
          'alpaca', 'apex', 'ascendex', 'bequant', 'bigone', 'binance', 'binancecoinm', 'binanceus', 'binanceusdm', 'bingx',
          'bit2c', 'bitbank', 'bitbns', 'bitfinex', 'bitflyer', 'bitget', 'bithumb', 'bitmart', 'bitmex', 'bitopro',
          'bitrue', 'bitso', 'bitstamp', 'bitteam', 'bittrade', 'bitvavo', 'blockchaincom', 'blofin', 'btcalpha', 'btcbox',
          'btcmarkets', 'btcturk', 'bybit', 'cex', 'coinbase', 'coinbaseadvanced', 'coinbaseexchange', 'coinbaseinternational', 'coincatch', 'coincheck',
          'coinex', 'coinlist', 'coinmate', 'coinmetro', 'coinone', 'coinsph', 'coinspot', 'cryptocom', 'cryptomus', 'defx',
          'delta', 'deribit', 'derive', 'digifinex', 'ellipx', 'exmo', 'fmfwio', 'gate', 'gateio', 'gemini',
          'hashkey', 'hitbtc', 'hollaex', 'htx', 'huobi', 'hyperliquid', 'independentreserve', 'indodax', 'kraken', 'krakenfutures',
          'kucoin', 'kucoinfutures', 'latoken', 'lbank', 'luno', 'mercado', 'mexc', 'modetrade', 'myokx', 'ndax',
          'novadax', 'oceanex', 'okcoin', 'okx', 'okxus', 'onetrading', 'oxfun', 'p2b', 'paradex', 'paymium',
          'phemex', 'poloniex', 'probit', 'timex', 'tokocrypto', 'tradeogre', 'upbit', 'vertex', 'wavesexchange', 'whitebit',
          'woo', 'woofipro', 'xt', 'yobit', 'zaif', 'zonda'
        ];
        
        const status = {
          api: true, // API работает, раз мы отвечаем
          cache: cachedData !== null,
          exchange: cachedData?.analyses && cachedData.analyses.length > 0,
          python: false, // TODO: проверить доступность Python сервиса
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
          },          exchanges: {
            supported: supportedExchanges.length,
            configured: config.selectedExchanges || [],
            availablePairs: cachedData?.analyses ? cachedData.analyses.length : 0
          },
          version: '2.0.0',
          features: [
            'Поддержка 106 бирж ccxt',
            'Технический анализ',
            'Swing торговля', 
            'Telegram уведомления',
            'Веб админ-панель',
            'API для интеграций'
          ]
        };

        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка проверки статуса',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Существующие API маршруты
    this.app.get('/api/analysis', (req: Request, res: Response) => {
      try {
        const data = this.cacheService.getAnalysisData();
        
        if (!data) {
          return res.status(503).json({
            error: 'Данные анализа недоступны',
            message: 'Система еще не получила данные от Python сервиса'
          });
        }        const analyses = data.analyses.map(analysis => ({
          pair: analysis.pair,
          signal: analysis.signal,
          probability: Math.round(analysis.probability * 100),
          currentPrice: analysis.currentPrice
        }));        const signals = data.signals.map(signal => ({
          pair: signal.pair,
          action: signal.signal,
          entryPrice: signal.swingTarget.entry,
          stopLoss: signal.swingTarget.stopLoss,
          takeProfit: signal.swingTarget.takeProfit,
          swingTarget: signal.swingTarget,
          timestamp: signal.timestamp
        }));

        const summary = {
          totalPairs: data.analyses.length,
          activeSignals: data.signals.length,
          dataAge: Math.round((Date.now() - data.lastUpdate) / (1000 * 60))
        };

        res.json({
          success: true,
          data: {
            analyses,
            signals,
            summary,
            lastUpdate: new Date(data.lastUpdate).toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения данных анализа',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    this.app.get('/api/analysis/:symbol', (req: Request, res: Response) => {
      try {
        const symbol = req.params.symbol.toUpperCase();
        const data = this.cacheService.getAnalysisData();

        if (!data) {
          return res.status(503).json({
            error: 'Данные анализа недоступны',
            message: 'Система еще не получила данные от Python сервиса'
          });
        }

        const pairAnalysis = data.analyses.find(analysis => 
          analysis.pair.replace('/', '') === symbol || 
          analysis.pair === symbol
        );

        if (!pairAnalysis) {
          return res.status(404).json({
            error: 'Пара не найдена',
            message: `Анализ для пары ${symbol} не найден`,
            availablePairs: data.analyses.map(a => a.pair)
          });
        }

        const pairSignal = data.signals.find(signal => 
          signal.pair.replace('/', '') === symbol || 
          signal.pair === symbol
        );        res.json({
          success: true,
          data: {
            pair: pairAnalysis.pair,
            signal: pairAnalysis.signal,
            probability: Math.round(pairAnalysis.probability * 100),
            currentPrice: pairAnalysis.currentPrice,
            activeSignal: pairSignal ? {
              action: pairSignal.signal,
              entryPrice: pairSignal.swingTarget.entry,
              stopLoss: pairSignal.swingTarget.stopLoss,
              takeProfit: pairSignal.swingTarget.takeProfit,
              swingTarget: pairSignal.swingTarget,
              timestamp: pairSignal.timestamp
            } : null
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения данных пары',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Обработка 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Маршрут не найден',
        availableRoutes: [
          '/api/analysis',
          '/api/analysis/:symbol',
          '/admin'
        ]
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 API сервер запущен на порту ${this.port}`);
        console.log(`📊 API доступно: http://localhost:${this.port}/api/analysis`);
        console.log(`⚙️ Админ-панель: http://localhost:${this.port}/admin`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🌐 API сервер остановлен');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
