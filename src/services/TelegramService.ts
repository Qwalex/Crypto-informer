import axios from 'axios';
import { TradingSignal, MarketAnalysis } from '../types';

export class TelegramService {
  private botToken: string;
  private chatId: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async sendSignal(signal: TradingSignal): Promise<void> {
    const message = this.formatSignalMessage(signal);
    await this.sendMessage(message);
  }

  async sendMessage(message: string): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения в Telegram:', error);
      throw error;
    }
  }
  private formatSignalMessage(signal: TradingSignal): string {
    const { pair, signal: action, price, probability, confidence, analysis, swingTarget } = signal;
    
    // Эмодзи для разных типов сигналов
    const getSignalEmoji = (signal: string) => {
      switch (signal) {
        case 'STRONG_BUY': return '🚀';
        case 'BUY': return '🟢';
        case 'SELL': return '🔴';
        case 'STRONG_SELL': return '💥';
        default: return '⚪';
      }
    };

    const getSignalText = (signal: string) => {
      switch (signal) {
        case 'STRONG_BUY': return 'СРОЧНО КУПИТЬ';
        case 'BUY': return 'КУПИТЬ';
        case 'SELL': return 'ПРОДАТЬ';
        case 'STRONG_SELL': return 'СРОЧНО ПРОДАТЬ';
        default: return 'ДЕРЖАТЬ';
      }
    };

    const emoji = getSignalEmoji(action);
    const actionText = getSignalText(action);
    
    let message = `${emoji} <b>SWING СИГНАЛ</b>\n\n`;
    message += `📊 <b>Пара:</b> ${pair}\n`;
    message += `🎯 <b>Действие:</b> ${actionText}\n`;
    message += `💰 <b>Текущая цена:</b> $${price.toFixed(6)}\n`;
    message += `📈 <b>Уверенность:</b> ${(confidence * 100).toFixed(1)}%\n\n`;    // Swing цели
    if (swingTarget && (action === 'STRONG_BUY' || action === 'BUY' || action === 'SELL' || action === 'STRONG_SELL')) {
      message += `🎯 <b>SWING ЦЕЛИ:</b>\n`;
      message += `📍 Вход: $${swingTarget.entry.toFixed(6)}\n`;
      message += `🛑 Stop Loss: $${swingTarget.stopLoss.toFixed(6)}\n`;
      message += `🎪 Take Profit: $${swingTarget.takeProfit.toFixed(6)}\n`;
      message += `⏱ Временные рамки: ${swingTarget.timeframe}\n\n`;
    }

    // Техническое обоснование
    if (analysis.reasoning?.technical?.length > 0) {
      message += `🔧 <b>ТЕХНИЧЕСКОЕ ОБОСНОВАНИЕ:</b>\n`;
      analysis.reasoning.technical.forEach(reason => {
        message += `• ${reason}\n`;
      });
      message += '\n';
    }

    // Фундаментальное обоснование
    if (analysis.reasoning?.fundamental?.length > 0) {
      message += `📊 <b>ФУНДАМЕНТАЛЬНЫЙ АНАЛИЗ:</b>\n`;
      analysis.reasoning.fundamental.forEach(reason => {
        message += `• ${reason}\n`;
      });
      message += '\n';
    }

    // Оценка риска
    if (analysis.reasoning?.risk) {
      const riskEmoji = analysis.reasoning.risk === 'ВЫСОКИЙ' ? '🔴' : 
                       analysis.reasoning.risk === 'НИЗКИЙ' ? '🟢' : '🟡';
      message += `⚠️ <b>РИСК:</b> ${riskEmoji} ${analysis.reasoning.risk}\n`;
    }

    // Временные рамки
    if (analysis.reasoning?.timeframe) {
      message += `⏰ <b>Горизонт:</b> ${analysis.reasoning.timeframe}\n`;
    }

    message += `\n🕐 <b>Время:</b> ${new Date(signal.timestamp).toLocaleString('ru-RU')}`;
    
    return message.trim();
  }

  async sendAnalysisReport(analyses: MarketAnalysis[]): Promise<void> {
    const message = this.formatAnalysisReport(analyses);
    await this.sendMessage(message);
  }  private formatAnalysisReport(analyses: MarketAnalysis[]): string {
    let message = '📊 <b>SWING АНАЛИЗ РЫНКА</b>\n\n';
    
    // Подсчет сигналов
    const signals = {
      STRONG_BUY: analyses.filter(a => a.signal === 'STRONG_BUY').length,
      BUY: analyses.filter(a => a.signal === 'BUY').length,
      HOLD: analyses.filter(a => a.signal === 'HOLD').length,
      SELL: analyses.filter(a => a.signal === 'SELL').length,
      STRONG_SELL: analyses.filter(a => a.signal === 'STRONG_SELL').length
    };

    message += `📈 <b>СВОДКА СИГНАЛОВ:</b>\n`;
    if (signals.STRONG_BUY > 0) message += `🚀 Срочно купить: ${signals.STRONG_BUY}\n`;
    if (signals.BUY > 0) message += `🟢 Купить: ${signals.BUY}\n`;
    if (signals.HOLD > 0) message += `⚪ Держать: ${signals.HOLD}\n`;
    if (signals.SELL > 0) message += `🔴 Продать: ${signals.SELL}\n`;
    if (signals.STRONG_SELL > 0) message += `💥 Срочно продать: ${signals.STRONG_SELL}\n`;
    message += '\n';

    // Активные торговые сигналы (не HOLD)
    const activeSignals = analyses.filter(a => a.signal !== 'HOLD');
    if (activeSignals.length > 0) {
      message += `🎯 <b>АКТИВНЫЕ СИГНАЛЫ:</b>\n`;
      activeSignals.forEach((analysis) => {
        const emoji = analysis.signal === 'STRONG_BUY' ? '🚀' : 
                     analysis.signal === 'BUY' ? '🟢' : 
                     analysis.signal === 'SELL' ? '🔴' : '💥';
        
        message += `${emoji} <b>${analysis.pair}</b> → ${analysis.signal}\n`;
        message += `   💰 $${analysis.currentPrice.toFixed(6)}\n`;
        message += `   🎯 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%\n`;
        
        if (analysis.reasoning?.technical && analysis.reasoning.technical.length > 0) {
          message += `   📊 ${analysis.reasoning.technical[0]}\n`;
        }
        
        if (analysis.reasoning?.risk) {
          const riskEmoji = analysis.reasoning.risk === 'ВЫСОКИЙ' ? '🔴' : 
                           analysis.reasoning.risk === 'НИЗКИЙ' ? '🟢' : '🟡';
          message += `   ⚠️ Риск: ${riskEmoji} ${analysis.reasoning.risk}\n`;
        }
        message += '\n';
      });
    }    // Детали по парам в состоянии HOLD
    const holdSignals = analyses.filter(a => a.signal === 'HOLD');
    if (holdSignals.length > 0) {
      message += `⚪ <b>ПАРЫ В ОЖИДАНИИ (HOLD):</b>\n`;
      holdSignals.forEach((analysis) => {
        message += `• <b>${analysis.pair}</b> - $${analysis.currentPrice.toFixed(6)}\n`;
        
        // Анализируем confluence и объясняем простыми словами
        const confluenceValue = this.extractConfluenceValue(analysis);
        let confluenceExplanation = '';
        
        if (confluenceValue >= 3) {
          confluenceExplanation = '🟢 Все индикаторы говорят "ПОКУПАТЬ" - ждем подтверждения';
        } else if (confluenceValue >= 1) {
          confluenceExplanation = '🟡 Слабые сигналы роста - можно готовиться к покупке';
        } else if (confluenceValue === 0) {
          confluenceExplanation = '⚪ Индикаторы не определились - полная неопределенность';
        } else if (confluenceValue >= -2) {
          confluenceExplanation = '🟡 Слабые сигналы падения - лучше не покупать';
        } else {
          confluenceExplanation = '🔴 Все индикаторы говорят "ПРОДАВАТЬ" - ждем подтверждения';
        }
        
        message += `  📊 ${confluenceExplanation}\n`;
        
        // Объясняем риск понятно
        if (analysis.reasoning?.risk) {
          let riskExplanation = '';
          if (analysis.reasoning.risk === 'ВЫСОКИЙ') {
            riskExplanation = '🔴 ВЫСОКИЙ риск потерь - цена сильно колеблется';
          } else if (analysis.reasoning.risk === 'НИЗКИЙ') {
            riskExplanation = '🟢 НИЗКИЙ риск потерь - цена стабильна';
          } else {
            riskExplanation = '🟡 УМЕРЕННЫЙ риск потерь - обычные колебания';
          }
          message += `  ⚠️ ${riskExplanation}\n`;
        }
        
        // Добавляем практический совет
        message += `  💡 <b>Совет:</b> `;
        if (confluenceValue >= 1) {
          message += `Готовьтесь к покупке, но ждите более сильных сигналов\n`;
        } else if (confluenceValue <= -1) {
          message += `Не покупайте сейчас, лучше подождать или продать\n`;
        } else {
          message += `Просто наблюдайте, рынок еще не определился\n`;
        }
        
        message += '\n';
      });
      
      message += `💡 <b>ПРОСТЫМИ СЛОВАМИ:</b>\n`;
      message += `⚪ <b>HOLD (ДЕРЖАТЬ)</b> = Сейчас НЕ время покупать или продавать\n`;
      message += `📊 Ждем, когда рынок покажет четкое направление\n`;
      message += `🎯 Для swing-торговли нужны сильные и надежные сигналы\n\n`;
    }

    // Рыночные условия
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    const bullishSignals = signals.STRONG_BUY + signals.BUY;
    const bearishSignals = signals.STRONG_SELL + signals.SELL;
    
    message += `🌡️ <b>РЫНОЧНЫЕ УСЛОВИЯ:</b>\n`;
    if (bullishSignals > bearishSignals) {
      message += `📈 Преобладают бычьи настроения\n`;
    } else if (bearishSignals > bullishSignals) {
      message += `📉 Преобладают медвежьи настроения\n`;
    } else {
      message += `⚖️ Сбалансированный рынок\n`;
    }
    message += `🎯 Средняя уверенность: ${(avgConfidence * 100).toFixed(1)}%\n\n`;

    message += `⏰ ${new Date().toLocaleString('ru-RU')}`;
    return message;
  }

  // Вспомогательный метод для извлечения значения confluence
  private extractConfluenceValue(analysis: any): number {
    if (analysis.reasoning?.technical) {
      for (const reason of analysis.reasoning.technical) {
        const match = reason.match(/confluence:\s*([+-]?\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    return 0; // По умолчанию нейтральное значение
  }
}
