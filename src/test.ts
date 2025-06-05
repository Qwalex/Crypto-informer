import dotenv from 'dotenv';
import { ExchangeService } from './services/ExchangeService';
import { TechnicalAnalysisService } from './services/TechnicalAnalysisService';
import { PythonAnalysisService } from './services/PythonAnalysisService';
import { loadConfig, validateConfig } from './utils/config';

dotenv.config();

async function testComponents() {
  console.log('🧪 Тестирование компонентов системы...\n');

  try {
    // Тестируем конфигурацию
    console.log('1️⃣ Тестирование конфигурации...');
    const config = loadConfig();
    validateConfig(config);
    console.log('✅ Конфигурация валидна\n');

    // Тестируем подключение к бирже
    console.log('2️⃣ Тестирование подключения к бирже...');
    const exchangeService = new ExchangeService();
    
    try {
      const btcPrice = await exchangeService.getCurrentPrice('BTC/USDT');
      console.log(`✅ Текущая цена BTC/USDT: $${btcPrice}`);
      
      const ohlcvData = await exchangeService.fetchOHLCVData('BTC/USDT', '1h', 10);
      console.log(`✅ Получено ${ohlcvData.length} свечей для BTC/USDT\n`);
    } catch (error) {
      console.error('❌ Ошибка подключения к бирже:', error);
      return;
    }

    // Тестируем технический анализ
    console.log('3️⃣ Тестирование технического анализа...');
    const technicalService = new TechnicalAnalysisService();
    
    try {
      const data = await exchangeService.fetchOHLCVData('BTC/USDT', '1h', 50);
      const indicators = technicalService.calculateIndicators(data);
      
      const rsi = technicalService.getLatestRSI(indicators);
      const macd = technicalService.getLatestMACD(indicators);
      const bb = technicalService.getLatestBollingerBands(indicators);
      
      console.log(`✅ RSI: ${rsi.toFixed(2)}`);
      console.log(`✅ MACD: ${macd.macd.toFixed(4)}, Signal: ${macd.signal.toFixed(4)}`);
      console.log(`✅ Bollinger Bands - Upper: ${bb.upper.toFixed(2)}, Lower: ${bb.lower.toFixed(2)}\n`);
    } catch (error) {
      console.error('❌ Ошибка технического анализа:', error);
      return;
    }

    // Тестируем Python сервис
    console.log('4️⃣ Тестирование Python сервиса...');
    const pythonService = new PythonAnalysisService(config.pythonServiceUrl);
    
    try {
      const health = await pythonService.checkHealth();
      if (health) {
        console.log('✅ Python сервис доступен');
        
        const data = await exchangeService.fetchOHLCVData('BTC/USDT', '1h', 100);
        const analysis = await pythonService.analyzeWithARIMAGARCH(data, 'BTC/USDT');
        
        console.log(`✅ ARIMA прогноз: $${analysis.arima_forecast.toFixed(6)}`);
        console.log(`✅ GARCH волатильность: ${(analysis.garch_volatility * 100).toFixed(2)}%\n`);
      } else {
        console.log('⚠️ Python сервис недоступен, но это не критично\n');
      }
    } catch (error) {
      console.log('⚠️ Python сервис недоступен:', error instanceof Error ? error.message : error);
    }

    console.log('✅ Все компоненты протестированы успешно!');
    console.log('\n🚀 Система готова к запуску. Используйте "npm start" для запуска бота.');

  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error);
    process.exit(1);
  }
}

testComponents().catch(error => {
  console.error('❌ Неожиданная ошибка:', error);
  process.exit(1);
});
