import schedule from 'node-schedule';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';
import { CacheService } from './services/CacheService';
import { ApiService } from './services/ApiService';
import { BotConfig, MarketAnalysis, TradingSignal } from './types';

export class CryptoSignalBot {
  private config: BotConfig;
  private exchangeService!: ExchangeService;
  private technicalAnalysisService!: TechnicalAnalysisService;
  private pythonAnalysisService!: PythonAnalysisService;
  private telegramService!: TelegramService;
  private marketAnalysisService!: MarketAnalysisService;
  private cacheService!: CacheService;
  private apiService!: ApiService;
  
  private isRunning: boolean = false;
  private lastSignals: Map<string, TradingSignal> = new Map();

  constructor(config: BotConfig) {
    this.config = config;
    this.initializeServices();
  }
  private initializeServices(): void {
    this.exchangeService = new ExchangeService();
    this.technicalAnalysisService = new TechnicalAnalysisService();
    this.pythonAnalysisService = new PythonAnalysisService(this.config.pythonServiceUrl);
    this.telegramService = new TelegramService(this.config.telegramToken, this.config.telegramChatId);
    this.cacheService = new CacheService();
      this.marketAnalysisService = new MarketAnalysisService(
      this.exchangeService,
      this.technicalAnalysisService,
      this.pythonAnalysisService,
      this.telegramService
    );
    
    this.apiService = new ApiService(this.cacheService, 3001);
  }
  async start(): Promise<void> {
    console.log('🤖 Запуск криптовалютного сигнального бота...');
    
    try {
      // Проверяем доступность Python сервиса
      const pythonServiceHealth = await this.pythonAnalysisService.checkHealth();
      if (!pythonServiceHealth) {
        console.warn('⚠️ Python сервис недоступен. Бот будет работать без ARIMA/GARCH анализа.');
      }

      // Запускаем HTTP API сервер
      await this.apiService.start();
      console.log('🌐 HTTP API сервер запущен на порту 3000');

      // Отправляем стартовое сообщение
      await this.telegramService.sendMessage('🤖 Криптовалютный сигнальный бот запущен!\n🌐 HTTP API доступен на http://localhost:3000');

      this.isRunning = true;

      // Запускаем первоначальный анализ
      await this.performAnalysis();

      // Настраиваем расписание
      this.scheduleAnalysis();

      console.log('✅ Бот успешно запущен и настроен');
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error);
      throw error;
    }
  }
  private sendReportsScheduled = false; // Флаг для избежания дублирования

  private scheduleAnalysis(): void {
    // Анализ каждые 30 минут без отправки отчетов
    schedule.scheduleJob('*/30 * * * *', async () => {
      if (this.isRunning) {
        this.sendReportsScheduled = false; // Только анализ, без отчетов
        await this.performAnalysis();
      }
    });

    // Отчет каждые 4 часа
    schedule.scheduleJob('0 */4 * * *', async () => {
      if (this.isRunning) {
        this.sendReportsScheduled = true; // Полный анализ с отчетом
        await this.performAnalysis();
      }
    });

    console.log('📅 Расписание анализа настроено: каждые 30 минут');
    console.log('📊 Расписание отчетов настроено: каждые 4 часа');
  }
  private async performAnalysis(): Promise<void> {
    try {
      console.log('🔍 Начинаем анализ рынка...');
      
      const analyses = await this.marketAnalysisService.analyzeMultiplePairs(this.config.analysisPairs);
      console.log(`📊 Проанализировано ${analyses.length} валютных пар`);

      const signals = await this.marketAnalysisService.generateTradingSignals(analyses);
      console.log(`📈 Сгенерировано ${signals.length} торговых сигналов`);

      // Сохраняем данные в кеш для HTTP API
      this.cacheService.setAnalysisData(analyses, signals);
      console.log('📦 Данные сохранены в кеш для HTTP API');

      // Отправляем отчет по анализу только каждые 4 часа или при первом запуске
      if (this.sendReportsScheduled || this.lastSignals.size === 0) {
        await this.telegramService.sendAnalysisReport(analyses);
        console.log(`📤 Отправлен отчет по анализу всех ${analyses.length} пар`);
      }

      // Всегда отправляем активные торговые сигналы (если есть)
      const newSignals = this.filterNewSignals(signals);
      
      for (const signal of newSignals) {
        await this.telegramService.sendSignal(signal);
        this.lastSignals.set(signal.pair, signal);
        
        // Задержка между отправками
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (newSignals.length > 0) {
        console.log(`📤 Дополнительно отправлено ${newSignals.length} активных торговых сигналов`);
      }

    } catch (error) {
      console.error('❌ Ошибка при выполнении анализа:', error);
      
      try {
        await this.telegramService.sendMessage(
          `❌ Ошибка анализа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
        );
      } catch (telegramError) {
        console.error('❌ Не удалось отправить сообщение об ошибке в Telegram:', telegramError);
      }
    }
  }

  private filterNewSignals(signals: TradingSignal[]): TradingSignal[] {
    return signals.filter(signal => {
      const lastSignal = this.lastSignals.get(signal.pair);
      
      // Если сигнала для этой пары не было
      if (!lastSignal) return true;
      
      // Если изменился тип сигнала
      if (lastSignal.signal !== signal.signal) return true;
      
      // Если значительно изменилась уверенность (>10%)
      if (Math.abs(lastSignal.confidence - signal.confidence) > 0.1) return true;
      
      // Если прошло больше 4 часов с последнего сигнала
      if (signal.timestamp - lastSignal.timestamp > 4 * 60 * 60 * 1000) return true;
      
      return false;
    });
  }  async stop(): Promise<void> {
    console.log('🛑 Остановка бота...');
    
    this.isRunning = false;
    
    // Отменяем все запланированные задачи
    schedule.gracefulShutdown();
    
    // Останавливаем API сервер
    await this.apiService.stop();
    
    try {
      await this.telegramService.sendMessage('🛑 Криптовалютный сигнальный бот остановлен');
    } catch (error) {
      console.error('❌ Не удалось отправить сообщение об остановке:', error);
    }
    
    console.log('✅ Бот остановлен');
  }

  // Метод для ручного запуска анализа
  async runManualAnalysis(): Promise<void> {
    console.log('🔧 Запуск ручного анализа...');
    await this.performAnalysis();
  }

  // Метод для доступа к кешу извне
  public getCacheService(): CacheService {
    return this.cacheService;
  }

  // Метод для получения последних данных анализа
  public getLastAnalysisData() {
    return this.cacheService.getAnalysisData();
  }
}
