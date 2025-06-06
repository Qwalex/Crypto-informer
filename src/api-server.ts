// API Server Entry Point
import dotenv from 'dotenv';
import { CacheService } from './services/CacheService';
import { ApiService } from './services/ApiService';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { TelegramService } from './services/TelegramService';
import { MarketAnalysisService } from './services/MarketAnalysisService';

// Загружаем переменные окружения
dotenv.config();

// Функция для выполнения анализа и заполнения кеша
async function performInitialAnalysis(marketAnalysisService: MarketAnalysisService, cacheService: CacheService) {
  console.log('🔍 Выполняем анализ рынка для заполнения кеша...');
  
  try {
    // Список пар для анализа (из .env или по умолчанию)
    const analysisPairs = (process.env.ANALYSIS_PAIRS || 'BTC/USDT,ETH/USDT,BNB/USDT,XRP/USDT,ADA/USDT,SOL/USDT,DOGE/USDT,DOT/USDT,MATIC/USDT,SHIB/USDT').split(',');
    
    console.log(`📊 Анализируем ${analysisPairs.length} валютных пар...`);
    
    // Выполняем анализ
    const analyses = await marketAnalysisService.analyzeMultiplePairs(analysisPairs);
    console.log(`✅ Проанализировано ${analyses.length} пар`);
    
    // Генерируем торговые сигналы
    const signals = await marketAnalysisService.generateTradingSignals(analyses);
    console.log(`🎯 Сгенерировано ${signals.length} торговых сигналов`);
    
    // Сохраняем в кеш
    cacheService.setAnalysisData(analyses, signals);
    console.log('📦 Данные успешно сохранены в кеш');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении анализа:', error);
    throw error;
  }
}

async function startApiServer() {
  console.log('🌐 Запуск HTTP API сервера...');
    try {
    // Создаем сервисы
    const cacheService = new CacheService();
    const apiService = new ApiService(cacheService, 3003);
    
    // Создаем сервисы для анализа рынка
    const exchangeService = new ExchangeService();
    const technicalAnalysisService = new TechnicalAnalysisService();
    const pythonAnalysisService = new PythonAnalysisService(process.env.PYTHON_SERVICE_URL || 'http://localhost:8000');
    
    // TelegramService не нужен для API, поэтому создаем заглушку
    const telegramService = null;
    
    const marketAnalysisService = new MarketAnalysisService(
      exchangeService,
      technicalAnalysisService,
      pythonAnalysisService,
      telegramService as any // временная заглушка
    );
    
    // Запускаем сервер
    await apiService.start();
    
    console.log('✅ HTTP API сервер успешно запущен');
    console.log('📋 Доступные эндпоинты:');
    console.log('  GET / - Документация API');
    console.log('  GET /api/analysis - Полный анализ рынка');
    console.log('  GET /api/signals - Активные торговые сигналы');
    console.log('  GET /api/market - Обзор рыночных условий');
    console.log('  GET /api/pairs/:symbol - Анализ конкретной пары');
    console.log('  GET /api/status - Статус системы');
    console.log('  GET /api/cache - Информация о кеше');
    
    // Выполняем первоначальный анализ для заполнения кеша
    await performInitialAnalysis(marketAnalysisService, cacheService);
    
    // Настраиваем периодическое обновление данных каждые 30 минут
    setInterval(async () => {
      try {
        console.log('🔄 Автоматическое обновление данных...');
        await performInitialAnalysis(marketAnalysisService, cacheService);
      } catch (error) {
        console.error('❌ Ошибка автоматического обновления:', error);
      }
    }, 30 * 60 * 1000); // 30 минут
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Получен сигнал остановки...');
      await apiService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Получен сигнал завершения...');
      await apiService.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска API сервера:', error);
    process.exit(1);
  }
}

// Запускаем сервер
startApiServer().catch(console.error);
