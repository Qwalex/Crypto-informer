import express, { Request, Response } from 'express';
import cors from 'cors';
import { CacheService, CachedData } from './CacheService';

export class ApiService {
  private app: express.Application;
  private cacheService: CacheService;
  private port: number;
  private server: any;

  constructor(cacheService: CacheService, port: number = 3001) {
    this.app = express();
    this.cacheService = cacheService;
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Логирование запросов
    this.app.use((req, res, next) => {
      console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {    // Главная страница API
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Crypto Signal Bot API',
        version: '1.0.0',
        description: 'API для получения актуальных данных анализа криптовалютного рынка',
        endpoints: {
          '/api/analysis': 'Полный анализ рынка',
          '/api/signals': 'Активные торговые сигналы',
          '/api/market': 'Обзор рыночных условий',
          '/api/pairs': 'Анализ по отдельным парам',
          '/api/status': 'Статус системы',
          '/api/cache': 'Информация о кеше'
        },
        timestamp: new Date().toISOString()
      });
    });    // Полный анализ рынка
    this.app.get('/api/analysis', (req: Request, res: Response) => {
      try {
        const data = this.cacheService.getAnalysisData();
        
        if (!data) {
          return res.status(404).json({
            error: 'Данные анализа недоступны',
            message: 'Анализ еще не выполнялся или данные устарели'
          });
        }

        const responseData = {
          success: true,
          data: {
            analyses: data.analyses.map(analysis => ({
              pair: analysis.pair,
              signal: analysis.signal,
              confidence: Math.round(analysis.confidence * 100),
              probability: Math.round(analysis.probability * 100),
              currentPrice: analysis.currentPrice,
              reasoning: analysis.reasoning,
              timestamp: data.lastUpdate
            })),
            marketConditions: data.marketConditions,
            lastUpdate: new Date(data.lastUpdate).toISOString(),
            dataAge: Math.round((Date.now() - data.lastUpdate) / (1000 * 60)) // возраст в минутах
          }
        };

        res.json(responseData);
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения данных анализа',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Активные торговые сигналы
    this.app.get('/api/signals', (req: Request, res: Response) => {
      try {
        const data = this.cacheService.getAnalysisData();
        
        if (!data) {
          return res.status(404).json({
            error: 'Сигналы недоступны',
            message: 'Анализ еще не выполнялся или данные устарели'
          });
        }

        const activeSignals = data.signals.map(signal => ({
          pair: signal.pair,
          signal: signal.signal,
          confidence: Math.round(signal.confidence * 100),
          price: signal.price,
          swingTarget: signal.swingTarget,
          timestamp: signal.timestamp
        }));

        res.json({
          success: true,
          data: {
            signals: activeSignals,
            count: activeSignals.length,
            lastUpdate: new Date(data.lastUpdate).toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения сигналов',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Обзор рыночных условий
    this.app.get('/api/market', (req: Request, res: Response) => {
      try {
        const data = this.cacheService.getAnalysisData();
        
        if (!data) {
          return res.status(404).json({
            error: 'Данные рынка недоступны',
            message: 'Анализ еще не выполнялся или данные устарели'
          });
        }

        res.json({
          success: true,
          data: {
            ...data.marketConditions,
            averageConfidence: Math.round(data.marketConditions.averageConfidence * 100),
            activeSignals: data.signals.length,
            lastUpdate: new Date(data.lastUpdate).toISOString(),
            dataAge: Math.round((Date.now() - data.lastUpdate) / (1000 * 60))
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения данных рынка',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Анализ конкретной пары
    this.app.get('/api/pairs/:symbol', (req: Request, res: Response) => {
      try {
        const symbol = req.params.symbol.toUpperCase();
        const data = this.cacheService.getAnalysisData();
        
        if (!data) {
          return res.status(404).json({
            error: 'Данные недоступны',
            message: 'Анализ еще не выполнялся или данные устарели'
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
        );

        res.json({
          success: true,
          data: {
            pair: pairAnalysis.pair,
            signal: pairAnalysis.signal,
            confidence: Math.round(pairAnalysis.confidence * 100),
            probability: Math.round(pairAnalysis.probability * 100),
            currentPrice: pairAnalysis.currentPrice,
            reasoning: pairAnalysis.reasoning,
            tradingSignal: pairSignal ? {
              signal: pairSignal.signal,
              swingTarget: pairSignal.swingTarget,
              timestamp: pairSignal.timestamp
            } : null,
            lastUpdate: new Date(data.lastUpdate).toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения данных пары',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Статус системы
    this.app.get('/api/status', (req: Request, res: Response) => {
      try {
        const data = this.cacheService.getAnalysisData();
        const cacheStats = this.cacheService.getCacheStats();
        const lastUpdate = this.cacheService.getLastUpdateTime();
        const isFresh = this.cacheService.isDataFresh(30);

        res.json({
          success: true,
          data: {
            status: isFresh ? 'ACTIVE' : 'STALE',
            dataAvailable: !!data,
            lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
            dataAge: lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / (1000 * 60)) : null,
            cache: cacheStats,
            uptime: Math.round(process.uptime()),
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения статуса',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });    // Информация о кеше
    this.app.get('/api/cache', (req: Request, res: Response) => {
      try {
        const stats = this.cacheService.getCacheStats();
        const lastUpdate = this.cacheService.getLastUpdateTime();
        
        res.json({
          success: true,
          data: {
            stats,
            lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
            isFresh: this.cacheService.isDataFresh(30)
          }
        });
      } catch (error) {
        res.status(500).json({
          error: 'Ошибка получения информации о кеше',
          message: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    });

    // Обработка 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Эндпоинт не найден',
        message: `Путь ${req.originalUrl} не существует`,
        availableEndpoints: [
          '/api/analysis',
          '/api/signals', 
          '/api/market',
          '/api/pairs/:symbol',
          '/api/status',
          '/api/cache'
        ]
      });
    });
  }
  // Запуск сервера
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 API сервер запущен на порту ${this.port}`);
        console.log(`📋 Документация API: http://localhost:${this.port}`);
        console.log(`📊 Анализ рынка: http://localhost:${this.port}/api/analysis`);
        console.log(`🎯 Торговые сигналы: http://localhost:${this.port}/api/signals`);
        console.log(`📈 Обзор рынка: http://localhost:${this.port}/api/market`);
        resolve();
      });
    });
  }

  // Остановка сервера
  stop(): Promise<void> {
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
