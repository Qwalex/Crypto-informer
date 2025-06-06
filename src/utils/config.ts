import { BotConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export function loadConfig(): BotConfig {
  // Сначала пытаемся загрузить из bot-config.json
  const configPath = path.join(process.cwd(), 'bot-config.json');
  
  if (fs.existsSync(configPath)) {
    console.log('📋 Загружаем конфигурацию из bot-config.json...');
    
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
        telegramToken: configData.telegramBotToken,
        telegramChatId: configData.telegramChatId,
        selectedExchanges: configData.selectedExchanges || ['bybit'],
        analysisInterval: configData.analysisInterval || '4h',
        analysisPairs: configData.analysisPairs || ['BTC/USDT', 'ETH/USDT'],
        pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
      };
    } catch (error) {
      console.error('❌ Ошибка чтения bot-config.json:', error);
      console.log('📋 Переходим к загрузке из переменных окружения...');
    }
  }

  // Fallback к переменным окружения
  console.log('📋 Загружаем конфигурацию из переменных окружения...');
  
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Отсутствует обязательная переменная окружения: ${envVar}`);
    }
  }

  const analysisPairs = (process.env.ANALYSIS_PAIRS || 'BTC/USDT,ETH/USDT,BNB/USDT,ADA/USDT,SOL/USDT')
    .split(',')
    .map(pair => pair.trim());

  const selectedExchanges = (process.env.SELECTED_EXCHANGES || 'bybit,binance')
    .split(',')
    .map(exchange => exchange.trim().toLowerCase());

  return {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,
    selectedExchanges,
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

  if (config.selectedExchanges.length === 0) {
    throw new Error('Должна быть указана хотя бы одна биржа для анализа');
  }
  
  // Проверяем формат валютных пар
  const pairRegex = /^[A-Z]{2,10}\/[A-Z]{2,10}$/;
  for (const pair of config.analysisPairs) {
    if (!pairRegex.test(pair)) {
      throw new Error(`Неверный формат валютной пары: ${pair}. Ожидается формат: BTC/USDT`);
    }
  }

  // Проверяем поддерживаемые биржи
  const supportedExchanges = ['bybit', 'binance', 'okx', 'kraken', 'bitget'];
  for (const exchange of config.selectedExchanges) {
    if (!supportedExchanges.includes(exchange.toLowerCase())) {
      console.warn(`⚠️ Биржа ${exchange} может не поддерживаться полностью`);
    }
  }
  
  console.log('✅ Конфигурация валидна');
}
