import axios from 'axios';
import { TradingSignal, MarketAnalysis } from '../types';
import { TelegramFormatter } from '../templates/TelegramFormatter';
import { TelegramTemplates } from '../templates/TelegramTemplates';

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
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения в Telegram:', error);
      throw error;
    }
  }

  async sendAnalysisReport(analyses: MarketAnalysis[]): Promise<void> {
    const messages = TelegramFormatter.formatAnalysisReport(analyses);
    
    for (let i = 0; i < messages.length; i++) {
      await this.sendMessage(messages[i]);
      
      // Добавляем небольшую задержку между сообщениями для соблюдения лимитов Telegram
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private formatSignalMessage(signal: TradingSignal): string {
    const {
      pair,
      exchange,
      signal: action,
      price,
      probability,
      confidence,
      analysis,
      swingTarget,
    } = signal;

    // Используем шаблоны для эмодзи
    const signalEmoji = TelegramTemplates.getSignalEmoji(action);
    const exchangeEmoji = TelegramTemplates.getExchangeEmoji(exchange);

    let message = `${signalEmoji} <b>SWING СИГНАЛ</b>\n\n`;
    message += `📊 <b>Пара:</b> ${pair}\n`;
    message += `🏦 <b>Биржа:</b> ${exchangeEmoji}\n`;
    message += `🚦 <b>Сигнал:</b> ${action}\n`;
    message += `💰 <b>Цена:</b> $${price.toFixed(6)}\n`;
    message += `🎯 <b>Вероятность:</b> ${(probability * 100).toFixed(1)}%\n`;
    message += `💪 <b>Уверенность:</b> ${(confidence * 100).toFixed(1)}%\n\n`;    if (swingTarget) {
      message += `🎯 <b>Цель для swing-трейдинга:</b>\n`;
      message += `   💵 Вход: $${swingTarget.entry.toFixed(6)}\n`;
      message += `   🛑 Stop Loss: $${swingTarget.stopLoss.toFixed(6)}\n`;
      message += `   🎪 Take Profit: $${swingTarget.takeProfit.toFixed(6)}\n`;
      message += `   📈 Потенциал: ${((swingTarget.takeProfit / price - 1) * 100).toFixed(2)}%\n`;
      message += `   ⏰ Горизонт: ${swingTarget.timeframe}\n\n`;
    }

    if (analysis) {
      message += `📈 <b>Анализ:</b> ${analysis}\n\n`;
    }

    message += `⏰ ${new Date().toLocaleString('ru-RU')}`;

    return message.trim();
  }
}
