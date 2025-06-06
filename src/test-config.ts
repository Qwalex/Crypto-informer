import { loadConfig } from './utils/config';

console.log('🔍 Проверяем конфигурацию...');

try {
  const config = loadConfig();
  
  console.log('📋 Конфигурация загружена:');
  console.log('- Telegram Token:', config.telegramToken ? '✅ Установлен' : '❌ Отсутствует');
  console.log('- Telegram Chat ID:', config.telegramChatId ? '✅ Установлен' : '❌ Отсутствует');
  console.log('- Python Service URL:', config.pythonServiceUrl);
  console.log('- Analysis Interval:', config.analysisInterval);
  console.log('- Analysis Pairs:', config.analysisPairs.length, 'пар');
  console.log('- Selected Exchanges:', config.selectedExchanges);
  
  if (config.selectedExchanges && config.selectedExchanges.length > 1) {
    console.log('✅ Настроено несколько бирж:', config.selectedExchanges.join(', '));
  } else {
    console.log('⚠️ Настроена только одна биржа или биржи не настроены');
  }

} catch (error) {
  console.error('❌ Ошибка загрузки конфигурации:', error);
}
