import { MarketAnalysis } from '../types';
import { TelegramTemplates } from './TelegramTemplates';

interface GroupedHoldSignals {
  [key: string]: {
    analyses: MarketAnalysis[];
    confluenceExplanation: string;
    advice: string;
  };
}

export class TelegramFormatter {
  private static readonly MAX_MESSAGE_LENGTH = 4000;

  // Вспомогательный метод для извлечения значения confluence
  private static extractConfluenceValue(analysis: MarketAnalysis): number {
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

  public static formatAnalysisReport(analyses: MarketAnalysis[]): string[] {
    const messages: string[] = [];
    
    // 1. Заголовок и сводка
    let headerMessage = TelegramTemplates.formatHeader(analyses);
    headerMessage += TelegramTemplates.formatSignalsSummary(analyses);
    headerMessage += TelegramTemplates.formatMarketConditions(analyses);
    messages.push(headerMessage);

    // 2. Активные сигналы
    const activeSignals = analyses.filter(a => a.signal !== 'HOLD');
    if (activeSignals.length > 0) {
      const activeMessages = this.formatActiveSignals(activeSignals);
      messages.push(...activeMessages);
    }

    // 3. HOLD сигналы с оптимизированной группировкой
    const holdSignals = analyses.filter(a => a.signal === 'HOLD');
    if (holdSignals.length > 0) {
      const holdMessages = this.formatOptimizedHoldSignals(holdSignals);
      messages.push(...holdMessages);
    }

    return messages;
  }

  private static formatActiveSignals(activeSignals: MarketAnalysis[]): string[] {
    const messages: string[] = [];
    let currentMessage = '🎯 <b>АКТИВНЫЕ СИГНАЛЫ:</b>\n';
    
    for (const analysis of activeSignals) {
      const signalText = TelegramTemplates.formatActiveSignal(analysis);
      
      if (currentMessage.length + signalText.length > this.MAX_MESSAGE_LENGTH) {
        messages.push(currentMessage);
        currentMessage = `🎯 <b>АКТИВНЫЕ СИГНАЛЫ (продолжение):</b>\n${signalText}`;
      } else {
        currentMessage += signalText;
      }
    }
    
    if (currentMessage.length > `🎯 <b>АКТИВНЫЕ СИГНАЛЫ (продолжение):</b>\n`.length) {
      messages.push(currentMessage);
    }

    return messages;
  }

  private static formatOptimizedHoldSignals(holdSignals: MarketAnalysis[]): string[] {
    const messages: string[] = [];
    
    // Группируем HOLD сигналы по статусу (confluence + риск + совет)
    const groupedSignals = this.groupHoldSignalsByStatus(holdSignals);
    
    // Формируем оптимизированные сообщения
    let currentMessage = '⚪ <b>ПАРЫ В ОЖИДАНИИ (HOLD) - ОПТИМИЗИРОВАННЫЙ ОТЧЕТ:</b>\n\n';
    
    const statusKeys = Object.keys(groupedSignals);
    for (let i = 0; i < statusKeys.length; i++) {
      const statusKey = statusKeys[i];
      const group = groupedSignals[statusKey];
      
      // Заголовок группы
      let groupText = `📊 <b>${group.confluenceExplanation}</b>\n`;
      groupText += `💡 <b>Совет:</b> ${group.advice}\n`;
      
      // Количество пар в группе
      const pairCount = group.analyses.length;
      groupText += `📈 <b>Количество пар:</b> ${pairCount}\n\n`;
      
      // Список пар (показываем первые 10, остальные суммарно)
      const maxPairsToShow = 10;
      const pairsToShow = group.analyses.slice(0, maxPairsToShow);
      
      for (const analysis of pairsToShow) {
        const exchangeEmoji = TelegramTemplates.getExchangeEmoji(analysis.exchange);
        groupText += `• <b>${analysis.pair}</b> (${exchangeEmoji}) - $${analysis.currentPrice.toFixed(6)}`;
        
        if (analysis.reasoning?.risk) {
          const riskEmoji = TelegramTemplates.getRiskEmoji(analysis.reasoning.risk);
          groupText += ` - Риск: ${riskEmoji}`;
        }
        groupText += '\n';
      }
      
      // Если пар больше 10, показываем количество оставшихся
      if (group.analyses.length > maxPairsToShow) {
        const remaining = group.analyses.length - maxPairsToShow;
        groupText += `... и еще ${remaining} пар с таким же статусом\n`;
      }
      
      groupText += '\n';
      
      // Проверяем, не превысит ли добавление этой группы лимит
      if (currentMessage.length + groupText.length > this.MAX_MESSAGE_LENGTH) {
        messages.push(currentMessage);
        currentMessage = `⚪ <b>ПАРЫ В ОЖИДАНИИ (продолжение):</b>\n\n${groupText}`;
      } else {
        currentMessage += groupText;
      }
    }
    
    // Добавляем общее объяснение в конец
    const explanation = TelegramTemplates.formatHoldExplanation();
    if (currentMessage.length + explanation.length > this.MAX_MESSAGE_LENGTH) {
      messages.push(currentMessage);
      messages.push(explanation);
    } else {
      currentMessage += explanation;
      messages.push(currentMessage);
    }

    return messages;
  }

  private static groupHoldSignalsByStatus(holdSignals: MarketAnalysis[]): GroupedHoldSignals {
    const grouped: GroupedHoldSignals = {};
    
    for (const analysis of holdSignals) {
      const confluenceValue = this.extractConfluenceValue(analysis);
      const confluenceExplanation = TelegramTemplates.getConfluenceExplanation(confluenceValue);
      const advice = TelegramTemplates.getAdvice(confluenceValue);
      const risk = analysis.reasoning?.risk || 'НЕИЗВЕСТНЫЙ';
      
      // Создаем ключ для группировки: confluence + риск
      const statusKey = `${confluenceValue}_${risk}`;
      
      if (!grouped[statusKey]) {
        grouped[statusKey] = {
          analyses: [],
          confluenceExplanation,
          advice,
        };
      }
      
      grouped[statusKey].analyses.push(analysis);
    }
    
    return grouped;
  }
}
