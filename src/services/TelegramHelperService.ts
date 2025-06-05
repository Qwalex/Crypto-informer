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
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  // Поиск Chat ID по последним сообщениям
  async findChatId(): Promise<ChatIdSearchResult> {
    if (!this.botToken) {
      return { found: false, error: 'Bot Token не указан' };
    }

    try {
      // Получаем последние обновления
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getUpdates`,
        { 
          params: { limit: 10 },
          timeout: 5000 
        }
      );

      if (!response.data.ok) {
        return { found: false, error: 'Неверный Bot Token' };
      }

      const updates: TelegramUpdate[] = response.data.result;
      
      if (updates.length === 0) {
        return { 
          found: false, 
          error: 'Нет сообщений. Отправьте любое сообщение боту и попробуйте снова' 
        };
      }

      // Берем последнее сообщение
      const lastUpdate = updates[updates.length - 1];
      if (!lastUpdate.message) {
        return { 
          found: false, 
          error: 'Последнее обновление не содержит сообщения' 
        };
      }

      return {
        found: true,
        chatId: lastUpdate.message.chat.id.toString(),
        username: lastUpdate.message.from.username,
        firstName: lastUpdate.message.from.first_name
      };

    } catch (error) {
      console.error('Ошибка поиска Chat ID:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { found: false, error: 'Превышено время ожидания. Проверьте интернет-соединение' };
        }
        if (error.response?.status === 401) {
          return { found: false, error: 'Неверный Bot Token' };
        }
        if (error.response?.status === 400) {
          return { found: false, error: 'Неверный формат Bot Token' };
        }
      }

      return { 
        found: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  // Отправить тестовое сообщение
  async sendTestMessage(chatId: string, message: string = '🤖 Тестовое сообщение от криптовалютного бота!'): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken || !chatId) {
      return { success: false, error: 'Bot Token или Chat ID не указаны' };
    }

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        },
        { timeout: 5000 }
      );

      if (response.data.ok) {
        return { success: true };
      } else {
        return { success: false, error: response.data.description || 'Неизвестная ошибка' };
      }

    } catch (error) {
      console.error('Ошибка отправки тестового сообщения:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { success: false, error: 'Превышено время ожидания' };
        }
        if (error.response?.status === 403) {
          return { success: false, error: 'Бот заблокирован пользователем или неверный Chat ID' };
        }
        if (error.response?.status === 400) {
          return { success: false, error: 'Неверный Chat ID' };
        }
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }

  // Проверить валидность Bot Token
  async validateBotToken(): Promise<{ valid: boolean; botInfo?: any; error?: string }> {
    if (!this.botToken) {
      return { valid: false, error: 'Bot Token не указан' };
    }

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getMe`,
        { timeout: 5000 }
      );

      if (response.data.ok) {
        return { 
          valid: true, 
          botInfo: {
            id: response.data.result.id,
            username: response.data.result.username,
            first_name: response.data.result.first_name,
            can_join_groups: response.data.result.can_join_groups,
            can_read_all_group_messages: response.data.result.can_read_all_group_messages,
            supports_inline_queries: response.data.result.supports_inline_queries
          }
        };
      } else {
        return { valid: false, error: response.data.description || 'Неверный Bot Token' };
      }

    } catch (error) {
      console.error('Ошибка проверки Bot Token:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { valid: false, error: 'Превышено время ожидания' };
        }
        if (error.response?.status === 401) {
          return { valid: false, error: 'Неверный Bot Token' };
        }
      }

      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      };
    }
  }
}
