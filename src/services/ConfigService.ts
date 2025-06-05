import fs from 'fs';
import path from 'path';

export interface BotConfiguration {
  // Telegram настройки
  telegramBotToken: string;
  telegramChatId: string;
  
  // Биржа настройки (опциональные)
  bybitApiKey?: string;
  bybitSecretKey?: string;
  
  // Анализ настройки
  analysisInterval: string;
  analysisPairs: string[];
}

export class ConfigService {
  private configPath: string;
  private envPath: string;
  
  constructor() {
    this.configPath = path.join(process.cwd(), 'bot-config.json');
    this.envPath = path.join(process.cwd(), '.env');
  }

  // Загрузить конфигурацию из JSON файла или .env
  loadConfiguration(): BotConfiguration {
    // Сначала пытаемся загрузить из JSON
    if (fs.existsSync(this.configPath)) {
      try {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      } catch (error) {
        console.warn('⚠️ Ошибка чтения bot-config.json, используем .env:', error);
      }
    }

    // Если JSON нет, загружаем из .env
    return this.loadFromEnv();
  }

  // Загрузить конфигурацию из .env файла
  private loadFromEnv(): BotConfiguration {
    // Читаем .env файл вручную
    const envVars: Record<string, string> = {};
    
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
    }

    return {
      telegramBotToken: envVars.TELEGRAM_BOT_TOKEN || '',
      telegramChatId: envVars.TELEGRAM_CHAT_ID || '',
      bybitApiKey: envVars.BYBIT_API_KEY || '',
      bybitSecretKey: envVars.BYBIT_SECRET_KEY || '',
      analysisInterval: envVars.ANALYSIS_INTERVAL || '4h',
      analysisPairs: envVars.ANALYSIS_PAIRS ? envVars.ANALYSIS_PAIRS.split(',') : [
        'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT'
      ]
    };
  }

  // Сохранить конфигурацию в JSON файл
  saveConfiguration(config: BotConfiguration): void {
    try {
      const configJson = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configPath, configJson, 'utf8');
      console.log('✅ Конфигурация сохранена в bot-config.json');
      
      // Также обновляем .env файл для совместимости
      this.updateEnvFile(config);
    } catch (error) {
      console.error('❌ Ошибка сохранения конфигурации:', error);
      throw error;
    }
  }

  // Обновить .env файл
  private updateEnvFile(config: BotConfiguration): void {
    try {
      let envContent = '';
      
      // Читаем существующий .env файл
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // Обновляем или добавляем значения
      const updates = {
        'TELEGRAM_BOT_TOKEN': config.telegramBotToken,
        'TELEGRAM_CHAT_ID': config.telegramChatId,
        'BYBIT_API_KEY': config.bybitApiKey || '',
        'BYBIT_SECRET_KEY': config.bybitSecretKey || '',
        'ANALYSIS_INTERVAL': config.analysisInterval,
        'ANALYSIS_PAIRS': config.analysisPairs.join(',')
      };

      // Обновляем существующие строки или добавляем новые
      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        const newLine = `${key}=${value}`;
        
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, newLine);
        } else {
          envContent += `\n${newLine}`;
        }
      }

      fs.writeFileSync(this.envPath, envContent, 'utf8');
      console.log('✅ .env файл обновлен');
    } catch (error) {
      console.error('❌ Ошибка обновления .env файла:', error);
    }
  }

  // Проверить валидность конфигурации
  validateConfiguration(config: BotConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.telegramBotToken) {
      errors.push('Telegram Bot Token обязателен');
    }

    if (!config.telegramChatId) {
      errors.push('Telegram Chat ID обязателен');
    }

    if (!config.analysisInterval) {
      errors.push('Интервал анализа обязателен');
    }

    if (!config.analysisPairs || config.analysisPairs.length === 0) {
      errors.push('Необходимо выбрать хотя бы одну валютную пару');
    }

    // Проверяем формат валютных пар
    const validPairRegex = /^[A-Z0-9]+\/[A-Z0-9]+$/;
    for (const pair of config.analysisPairs) {
      if (!validPairRegex.test(pair)) {
        errors.push(`Неверный формат валютной пары: ${pair}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Получить доступные валютные пары
  getAvailablePairs(): string[] {
    return [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT',
      'XRP/USDT', 'DOT/USDT', 'LINK/USDT', 'POL/USDT', 'UNI/USDT',
      'DOGE/USDT', 'PEPE/USDT', 'TRX/USDT', 'ONDO/USDT', 'ANIME/USDT',
      'SPX/USDT', 'BMT/USDT', 'AVAX/USDT', 'NEAR/USDT', 'APT/USDT',
      'SUI/USDT', 'INJ/USDT', 'WLD/USDT', 'FET/USDT', 'AR/USDT',
      'OP/USDT', 'ARB/USDT', 'LTC/USDT', 'BCH/USDT', 'ETC/USDT'
    ];
  }

  // Получить доступные интервалы
  getAvailableIntervals(): Array<{ value: string; label: string }> {
    return [
      { value: '15m', label: '15 минут' },
      { value: '30m', label: '30 минут' },
      { value: '1h', label: '1 час' },
      { value: '2h', label: '2 часа' },
      { value: '4h', label: '4 часа' },
      { value: '6h', label: '6 часов' },
      { value: '12h', label: '12 часов' },
      { value: '1d', label: '1 день' }
    ];
  }
}
