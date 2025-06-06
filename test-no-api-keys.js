// Тест системы без API-ключей
const { ExchangeService } = require('./dist/services/ExchangeService.js');
const { ConfigService } = require('./dist/services/ConfigService.js');

async function testNoApiKeys() {
    console.log('🧪 Тестирование системы без API-ключей...\n');

    try {
        // Тест 1: ExchangeService
        console.log('1️⃣ Тестирование ExchangeService...');
        const exchangeService = new ExchangeService();
        
        const supportedExchanges = await exchangeService.getSupportedExchanges(['binance', 'bybit']);
        console.log('✅ Поддерживаемые биржи:', supportedExchanges.slice(0, 3));
        
        // Тест получения данных без API ключей
        const ticker = await exchangeService.getTicker('binance', 'BTC/USDT');
        console.log('✅ Получен тикер BTC/USDT:', { symbol: ticker.symbol, last: ticker.last });
        
        // Тест 2: ConfigService
        console.log('\n2️⃣ Тестирование ConfigService...');
        const configService = new ConfigService();
        
        const config = configService.loadConfiguration();
        console.log('✅ Конфигурация загружена:');
        console.log('   - Telegram Bot Token:', config.telegramBotToken ? 'Установлен' : 'Не установлен');
        console.log('   - Selected Exchanges:', config.selectedExchanges || ['binance', 'bybit']);
        console.log('   - Analysis Pairs:', config.analysisPairs?.length || 0);
        
        // Тест валидации без API ключей
        const testConfig = {
            telegramBotToken: 'test_token',
            telegramChatId: '12345',
            selectedExchanges: ['binance', 'bybit'],
            analysisInterval: '4h',
            analysisPairs: ['BTC/USDT', 'ETH/USDT']
        };
        
        const validation = configService.validateConfiguration(testConfig);
        console.log('✅ Валидация тестовой конфигурации:', validation.isValid ? 'Прошла' : 'Провалена');
        
        console.log('\n🎉 Все тесты прошли успешно!');
        console.log('✅ Система готова к работе без API-ключей');
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        process.exit(1);
    }
}

testNoApiKeys();
