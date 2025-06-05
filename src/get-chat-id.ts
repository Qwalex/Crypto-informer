import axios from 'axios';
import * as readline from 'readline';

interface TelegramUpdate {
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

interface TelegramResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

async function getChatId() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Скрипт обнаружения Telegram Chat ID\n');
  
  // Получаем токен бота
  const botToken = await new Promise<string>((resolve) => {
    rl.question('📝 Введите токен вашего Telegram бота: ', (token) => {
      resolve(token.trim());
    });
  });

  if (!botToken) {
    console.log('❌ Токен бота не может быть пустым');
    rl.close();
    return;
  }

  // Проверяем валидность токена
  console.log('\n🔍 Проверка токена бота...');
  try {
    const botInfo = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!botInfo.data.ok) {
      console.log('❌ Неверный токен бота');
      rl.close();
      return;
    }
    console.log(`✅ Бот найден: @${botInfo.data.result.username}`);
  } catch (error) {
    console.log('❌ Ошибка при проверке токена:', error);
    rl.close();
    return;
  }

  console.log('\n📱 Теперь выполните следующие шаги:');
  console.log('1. Откройте Telegram');
  console.log(`2. Найдите вашего бота @${botToken.split(':')[0]} или по имени`);
  console.log('3. Нажмите /start или отправьте любое сообщение боту');
  console.log('4. Нажмите Enter в этом окне после отправки сообщения');

  await new Promise<void>((resolve) => {
    rl.question('\n⏳ Нажмите Enter после отправки сообщения боту...', () => {
      resolve();
    });
  });

  console.log('\n🔍 Поиск вашего chat_id...');

  try {
    // Получаем обновления
    const updatesResponse = await axios.get<TelegramResponse>(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=10&offset=-10`
    );

    if (!updatesResponse.data.ok || updatesResponse.data.result.length === 0) {
      console.log('❌ Не найдено сообщений. Убедитесь, что вы отправили сообщение боту.');
      rl.close();
      return;
    }

    console.log('\n📋 Найденные чаты:');
    const uniqueChats = new Map<number, any>();

    // Собираем уникальные чаты
    updatesResponse.data.result.forEach(update => {
      if (update.message) {
        const chat = update.message.chat;
        if (!uniqueChats.has(chat.id)) {
          uniqueChats.set(chat.id, {
            id: chat.id,
            name: chat.first_name || chat.username || 'Неизвестно',
            type: chat.type,
            username: chat.username,
            lastMessage: update.message.text
          });
        }
      }
    });

    if (uniqueChats.size === 0) {
      console.log('❌ Не найдено подходящих чатов.');
      rl.close();
      return;
    }

    // Показываем найденные чаты
    const chats = Array.from(uniqueChats.values());
    chats.forEach((chat, index) => {
      console.log(`\n${index + 1}. 💬 ${chat.name}`);
      console.log(`   📱 Chat ID: ${chat.id}`);
      console.log(`   📝 Тип: ${chat.type}`);
      if (chat.username) {
        console.log(`   👤 Username: @${chat.username}`);
      }
      console.log(`   💭 Последнее сообщение: "${chat.lastMessage}"`);
    });

    // Если один чат, используем его автоматически
    if (chats.length === 1) {
      const selectedChat = chats[0];
      console.log(`\n✅ Автоматически выбран единственный найденный чат:`);
      console.log(`📱 Chat ID: ${selectedChat.id}`);
      
      // Тестируем отправку сообщения
      console.log('\n🧪 Тестирование отправки сообщения...');
      try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: selectedChat.id,
          text: '🎉 Отлично! Chat ID успешно обнаружен и протестирован!',
          parse_mode: 'HTML'
        });
        console.log('✅ Тестовое сообщение отправлено успешно!');
      } catch (error) {
        console.log('❌ Ошибка при отправке тестового сообщения:', error);
      }

      console.log('\n📋 Добавьте эти строки в ваш .env файл:');
      console.log(`TELEGRAM_BOT_TOKEN=${botToken}`);
      console.log(`TELEGRAM_CHAT_ID=${selectedChat.id}`);
      
    } else {
      // Несколько чатов - просим выбрать
      const choice = await new Promise<string>((resolve) => {
        rl.question(`\n🎯 Выберите номер чата (1-${chats.length}): `, (answer) => {
          resolve(answer.trim());
        });
      });

      const chatIndex = parseInt(choice) - 1;
      if (isNaN(chatIndex) || chatIndex < 0 || chatIndex >= chats.length) {
        console.log('❌ Неверный выбор');
        rl.close();
        return;
      }

      const selectedChat = chats[chatIndex];
      console.log(`\n✅ Выбран чат: ${selectedChat.name}`);
      console.log(`📱 Chat ID: ${selectedChat.id}`);

      // Тестируем отправку сообщения
      console.log('\n🧪 Тестирование отправки сообщения...');
      try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: selectedChat.id,
          text: '🎉 Отлично! Chat ID успешно обнаружен и протестирован!',
          parse_mode: 'HTML'
        });
        console.log('✅ Тестовое сообщение отправлено успешно!');
      } catch (error) {
        console.log('❌ Ошибка при отправке тестового сообщения:', error);
      }

      console.log('\n📋 Добавьте эти строки в ваш .env файл:');
      console.log(`TELEGRAM_BOT_TOKEN=${botToken}`);
      console.log(`TELEGRAM_CHAT_ID=${selectedChat.id}`);
    }

  } catch (error) {
    console.log('❌ Ошибка при получении обновлений:', error);
  }

  rl.close();
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  getChatId().catch(console.error);
}

export { getChatId };
