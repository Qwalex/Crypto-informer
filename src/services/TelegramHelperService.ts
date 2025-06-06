import axios from 'axios';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text: string;
  };
}

export interface ChatIdSearchResult {
  found: boolean;
  chatId?: string;
  username?: string;
  firstName?: string;
  error?: string;
}

export class TelegramHelperService {
  constructor() {
    // Конструктор пустой, так как botToken передается в методы
  }

  // Проверка валидности Bot Token
  async validateBotToken(botToken: string): Promise<{ valid: boolean; botInfo?: any; error?: string }> {
    if (!botToken) {
      return { valid: false, error: 'Bot Token не указан' };
    }

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${botToken}/getMe`,
        { timeout: 10000 }
      );

      if (response.data.ok) {
        return {
          valid: true,
          botInfo: response.data.result
        };
      } else {
        return {
          valid: false,
          error: 'Невалидный Bot Token'
        };
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { valid: false, error: 'Неверный Bot Token' };
      }
      return { 
        valid: false, 
        error: `Ошибка проверки токена: ${error.message}` 
      };
    }
  }

  // Поиск Chat ID по последним сообщениям
  async findChatId(botToken: string): Promise<ChatIdSearchResult> {
    if (!botToken) {
      return { found: false, error: 'Bot Token не указан' };
    }

    try {
      // Получаем последние обновления
      const response = await axios.get(
        `https://api.telegram.org/bot${botToken}/getUpdates`,
        { 
          params: { limit: 10 },
          timeout: 10000 
        }
      );

      if (!response.data.ok) {
        return { found: false, error: 'Ошибка получения обновлений от Telegram' };
      }

      const updates: TelegramUpdate[] = response.data.result;

      if (updates.length === 0) {
        return { 
          found: false, 
          error: 'Нет сообщений. Отправьте любое сообщение боту в Telegram и попробуйте снова.' 
        };
      }

      // Ищем последнее сообщение от пользователя (не от бота)
      const userMessage = updates
        .reverse()
        .find(update => 
          update.message && 
          !update.message.from.is_bot &&
          update.message.chat.type === 'private'
        );

      if (!userMessage?.message) {
        return { 
          found: false, 
          error: 'Не найдено сообщений от пользователей. Отправьте сообщение боту в личные сообщения.' 
        };
      }

      return {
        found: true,
        chatId: userMessage.message.chat.id.toString(),
        username: userMessage.message.from.username,
        firstName: userMessage.message.from.first_name
      };

    } catch (error: any) {
      if (error.response?.status === 401) {
        return { found: false, error: 'Неверный Bot Token' };
      }
      return { 
        found: false, 
        error: `Ошибка поиска Chat ID: ${error.message}` 
      };
    }
  }

  // Отправка тестового сообщения
  async sendTestMessage(botToken: string, chatId: string, message: string = '🤖 Тестовое сообщение от криптовалютного бота!'): Promise<{ success: boolean; error?: string }> {
    if (!botToken) {
      return { success: false, error: 'Bot Token не указан' };
    }

    if (!chatId) {
      return { success: false, error: 'Chat ID не указан' };
    }

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        },
        { timeout: 10000 }
      );

      if (response.data.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `Ошибка отправки: ${response.data.description || 'Неизвестная ошибка'}` 
        };
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        return { success: false, error: 'Неверный Chat ID или бот заблокирован' };
      }
      if (error.response?.status === 401) {
        return { success: false, error: 'Неверный Bot Token' };
      }
      return { 
        success: false, 
        error: `Ошибка отправки сообщения: ${error.message}` 
      };
    }
  }
}