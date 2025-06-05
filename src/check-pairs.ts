import { ExchangeService } from './services/ExchangeService';

async function checkPairs() {
  const exchangeService = new ExchangeService();
  
  const pairsToCheck = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT',
    'XRP/USDT', 'DOT/USDT', 'LINK/USDT', 'POL/USDT', 'UNI/USDT',
    'DOGE/USDT', 'PEPE/USDT', 'TRX/USDT', 'ONDO/USDT', 'ANIME/USDT',
    'BMX/USDT', 'SPX/USDT' // BMT может быть BMX на Bybit
  ];

  console.log('🔍 Проверка доступности торговых пар на Bybit...\n');

  const availablePairs: string[] = [];
  const unavailablePairs: string[] = [];

  for (const pair of pairsToCheck) {
    try {
      const price = await exchangeService.getCurrentPrice(pair);
      console.log(`✅ ${pair}: $${price}`);
      availablePairs.push(pair);
    } catch (error) {
      console.log(`❌ ${pair}: недоступна`);
      unavailablePairs.push(pair);
    }
    
    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Итог:');
  console.log(`✅ Доступно: ${availablePairs.length} пар`);
  console.log(`❌ Недоступно: ${unavailablePairs.length} пар`);
  
  console.log('\n✅ Доступные пары:');
  console.log(availablePairs.join(','));
  
  if (unavailablePairs.length > 0) {
    console.log('\n❌ Недоступные пары:');
    console.log(unavailablePairs.join(','));
  }
}

checkPairs().catch(console.error);
