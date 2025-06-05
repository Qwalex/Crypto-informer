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
    const { pair, signal: action, price, probability, confidence, analysis } = signal;
    const emoji = action === 'BUY' ? '🟢' : '🔴';
    
    return `
${emoji} <b>ТОРГОВЫЙ СИГНАЛ</b>

📊 <b>Пара:</b> ${pair}
📈 <b>Действие:</b> ${action}
💰 <b>Цена:</b> $${price.toFixed(6)}
📊 <b>Вероятность:</b> ${(probability * 100).toFixed(1)}%
🎯 <b>Уверенность:</b> ${(confidence * 100).toFixed(1)}%

📋 <b>Анализ:</b>
• RSI: ${analysis.indicators.rsi[analysis.indicators.rsi.length - 1]?.toFixed(2) || 'N/A'}
• MACD: ${analysis.indicators.macd.macd[analysis.indicators.macd.macd.length - 1]?.toFixed(4) || 'N/A'}
• Прогноз ARIMA: $${analysis.forecast.arima_forecast.toFixed(6)}
• Волатильность GARCH: ${(analysis.forecast.garch_volatility * 100).toFixed(2)}%

⏰ <b>Время:</b> ${new Date(signal.timestamp).toLocaleString('ru-RU')}
    `.trim();
  }

  async sendAnalysisReport(analyses: MarketAnalysis[]): Promise<void> {
    const message = this.formatAnalysisReport(analyses);
    await this.sendMessage(message);
  }

  private formatAnalysisReport(analyses: MarketAnalysis[]): string {
    let message = '📊 <b>ОТЧЕТ ПО АНАЛИЗУ РЫНКА</b>\n\n';
    
    analyses
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5) // Топ 5 пар
      .forEach((analysis, index) => {
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📈';
        message += `${emoji} <b>${analysis.pair}</b>\n`;
        message += `💰 $${analysis.currentPrice.toFixed(6)}\n`;
        message += `📊 Вероятность: ${(analysis.probability * 100).toFixed(1)}%\n`;
        message += `🎯 Сигнал: ${analysis.signal}\n\n`;
      });

    message += `⏰ ${new Date().toLocaleString('ru-RU')}`;
    return message;
  }
}
