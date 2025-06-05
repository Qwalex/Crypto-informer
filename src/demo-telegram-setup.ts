import { getChatId } from './get-chat-id';

// Демонстрационный пример работы скрипта
async function demoScript() {
  console.log('🎬 Демонстрация скрипта получения Chat ID');
  console.log('📝 В реальном использовании запустите: npm run get-chat-id');
  console.log('\n🔧 Функциональность скрипта:');
  console.log('✅ Проверка токена бота');
  console.log('✅ Поиск чатов с ботом');
  console.log('✅ Выбор нужного чата');
  console.log('✅ Тестирование отправки сообщений');
  console.log('✅ Генерация настроек для .env файла');
  console.log('\n💡 Для запуска реального скрипта используйте:');
  console.log('   Windows: setup-telegram.bat');
  console.log('   Linux/Mac: ./setup-telegram.sh');
  console.log('   NPM: npm run get-chat-id');
}

if (require.main === module) {
  demoScript().catch(console.error);
}
