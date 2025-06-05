import { BotConfig } from '../types';

export function loadConfig(): BotConfig {
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Отсутствует обязательная переменная окружения: ${envVar}`);
    }
  }

  const analysisPairs = (process.env.ANALYSIS_PAIRS || 'BTC/USDT,ETH/USDT,BNB/USDT,ADA/USDT,SOL/USDT')
    .split(',')
    .map(pair => pair.trim());

  return {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,
    analysisInterval: process.env.ANALYSIS_INTERVAL || '1h',
    analysisPairs,
    pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
  };
}

export function validateConfig(config: BotConfig): void {
  if (!config.telegramToken || config.telegramToken.trim() === '') {
    throw new Error('Telegram bot token не может быть пустым');
  }
  
  if (!config.telegramChatId || config.telegramChatId.trim() === '') {
    throw new Error('Telegram chat ID не может быть пустым');
  }
  
  if (config.analysisPairs.length === 0) {
    throw new Error('Должна быть указана хотя бы одна валютная пара для анализа');
  }
  
  // Проверяем формат валютных пар
  const pairRegex = /^[A-Z]{2,10}\/[A-Z]{2,10}$/;
  for (const pair of config.analysisPairs) {
    if (!pairRegex.test(pair)) {
      throw new Error(`Неверный формат валютной пары: ${pair}. Ожидается формат: BTC/USDT`);
    }
  }
  
  console.log('✅ Конфигурация валидна');
}
