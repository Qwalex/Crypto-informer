import { MarketAnalysis } from '../types';

export interface ExchangeEmoji {
  [key: string]: string;
}

export interface SignalEmoji {
  [key: string]: string;
}

export interface RiskEmoji {
  [key: string]: string;
}

export class TelegramTemplates {
  public static readonly EXCHANGE_EMOJIS: ExchangeEmoji = {
    'bybit': '🟧 BYBIT',
    'binance': '🟨 BINANCE',
    'okx': '🟦 OKX',
    'kraken': '🟪 KRAKEN',
    'bitget': '🟩 BITGET',
  };

  public static readonly SIGNAL_EMOJIS: SignalEmoji = {
    'STRONG_BUY': '🚀',
    'BUY': '🟢',
    'HOLD': '⚪',
    'SELL': '🔴',
    'STRONG_SELL': '💥',
  };

  public static readonly RISK_EMOJIS: RiskEmoji = {
    'ВЫСОКИЙ': '🔴',
    'НИЗКИЙ': '🟢',
    'УМЕРЕННЫЙ': '🟡',
  };

  public static getExchangeEmoji(exchange: string): string {
    return this.EXCHANGE_EMOJIS[exchange.toLowerCase()] || `🔵 ${exchange.toUpperCase()}`;
  }

  public static getSignalEmoji(signal: string): string {
    return this.SIGNAL_EMOJIS[signal] || '⚪';
  }

  public static getRiskEmoji(risk: string): string {
    return this.RISK_EMOJIS[risk] || '🟡';
  }

  public static formatHeader(analyses: MarketAnalysis[]): string {
    const exchanges = [...new Set(analyses.map(a => a.exchange))];
    const exchangeEmojis = exchanges.map(exchange => this.getExchangeEmoji(exchange));

    let header = '📊 <b>SWING АНАЛИЗ РЫНКА</b>\n\n';
    header += `🏦 <b>БИРЖИ:</b> ${exchangeEmojis.join(', ')}\n`;
    header += `📈 <b>Валютных пар:</b> ${analyses.length}\n\n`;

    return header;
  }

  public static formatSignalsSummary(analyses: MarketAnalysis[]): string {
    const signals = {
      STRONG_BUY: analyses.filter(a => a.signal === 'STRONG_BUY').length,
      BUY: analyses.filter(a => a.signal === 'BUY').length,
      HOLD: analyses.filter(a => a.signal === 'HOLD').length,
      SELL: analyses.filter(a => a.signal === 'SELL').length,
      STRONG_SELL: analyses.filter(a => a.signal === 'STRONG_SELL').length,
    };

    let summary = '📈 <b>СВОДКА СИГНАЛОВ:</b>\n';
    if (signals.STRONG_BUY > 0) summary += `🚀 Срочно купить: ${signals.STRONG_BUY}\n`;
    if (signals.BUY > 0) summary += `🟢 Купить: ${signals.BUY}\n`;
    if (signals.HOLD > 0) summary += `⚪ Держать: ${signals.HOLD}\n`;
    if (signals.SELL > 0) summary += `🔴 Продать: ${signals.SELL}\n`;
    if (signals.STRONG_SELL > 0) summary += `💥 Срочно продать: ${signals.STRONG_SELL}\n`;
    summary += '\n';

    return summary;
  }

  public static formatMarketConditions(analyses: MarketAnalysis[]): string {
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    const bullishSignals = analyses.filter(a => ['STRONG_BUY', 'BUY'].includes(a.signal)).length;
    const bearishSignals = analyses.filter(a => ['STRONG_SELL', 'SELL'].includes(a.signal)).length;

    let conditions = '🌡️ <b>РЫНОЧНЫЕ УСЛОВИЯ:</b>\n';
    if (bullishSignals > bearishSignals) {
      conditions += '📈 Преобладают бычьи настроения\n';
    } else if (bearishSignals > bullishSignals) {
      conditions += '📉 Преобладают медвежьи настроения\n';
    } else {
      conditions += '⚖️ Сбалансированный рынок\n';
    }
    conditions += `🎯 Средняя уверенность: ${(avgConfidence * 100).toFixed(1)}%\n\n`;
    conditions += `⏰ ${new Date().toLocaleString('ru-RU')}\n\n`;

    return conditions;
  }

  public static formatActiveSignal(analysis: MarketAnalysis): string {
    const signalEmoji = this.getSignalEmoji(analysis.signal);
    const exchangeEmoji = this.getExchangeEmoji(analysis.exchange);

    let signal = `${signalEmoji} <b>${analysis.pair}</b> (${exchangeEmoji}) → ${analysis.signal}\n`;
    signal += `   💰 $${analysis.currentPrice.toFixed(6)}\n`;
    signal += `   🎯 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%\n`;

    if (analysis.reasoning?.technical && analysis.reasoning.technical.length > 0) {
      signal += `   📊 ${analysis.reasoning.technical[0]}\n`;
    }

    if (analysis.reasoning?.risk) {
      const riskEmoji = this.getRiskEmoji(analysis.reasoning.risk);
      signal += `   ⚠️ Риск: ${riskEmoji} ${analysis.reasoning.risk}\n`;
    }
    signal += '\n';

    return signal;
  }

  public static getConfluenceExplanation(confluenceValue: number): string {
    if (confluenceValue >= 3) {
      return '🟢 Все индикаторы говорят "ПОКУПАТЬ" - ждем подтверждения';
    } else if (confluenceValue >= 1) {
      return '🟡 Слабые сигналы роста - можно готовиться к покупке';
    } else if (confluenceValue === 0) {
      return '⚪ Индикаторы не определились - полная неопределенность';
    } else if (confluenceValue >= -2) {
      return '🟡 Слабые сигналы падения - лучше не покупать';
    } else {
      return '🔴 Все индикаторы говорят "ПРОДАВАТЬ" - ждем подтверждения';
    }
  }

  public static getRiskExplanation(risk: string): string {
    if (risk === 'ВЫСОКИЙ') {
      return '🔴 ВЫСОКИЙ риск потерь - цена сильно колеблется';
    } else if (risk === 'НИЗКИЙ') {
      return '🟢 НИЗКИЙ риск потерь - цена стабильна';
    } else {
      return '🟡 УМЕРЕННЫЙ риск потерь - обычные колебания';
    }
  }

  public static getAdvice(confluenceValue: number): string {
    if (confluenceValue >= 1) {
      return 'Готовьтесь к покупке, но ждите более сильных сигналов';
    } else if (confluenceValue <= -1) {
      return 'Не покупайте сейчас, лучше подождать или продать';
    } else {
      return 'Просто наблюдайте, рынок еще не определился';
    }
  }

  public static formatHoldExplanation(): string {
    let explanation = '💡 <b>ПРОСТЫМИ СЛОВАМИ:</b>\n';
    explanation += '⚪ <b>HOLD (ДЕРЖАТЬ)</b> = Сейчас НЕ время покупать или продавать\n';
    explanation += '📊 Ждем, когда рынок покажет четкое направление\n';
    explanation += '🎯 Для swing-торговли нужны сильные и надежные сигналы\n';
    return explanation;
  }
}
