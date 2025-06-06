const ccxt = require('ccxt');

console.log('Количество поддерживаемых бирж:', ccxt.exchanges.length);
console.log('\nВсе доступные биржи:');
const exchanges = ccxt.exchanges;
exchanges.forEach((exchange, index) => {
    console.log(`${index + 1}. ${exchange}`);
});

// Популярные биржи
const popularExchanges = [
    'binance', 'bybit', 'okx', 'kucoin', 'gate', 'mexc', 'bitget', 
    'coinbase', 'kraken', 'huobi', 'bitfinex', 'bitmex', 'phemex',
    'bitmart', 'cryptocom', 'lbank', 'ascendex', 'digifinex', 'xt', 'whitebit'
];

console.log('\nПопулярные биржи из списка ccxt:');
popularExchanges.forEach(exchange => {
    if (exchanges.includes(exchange)) {
        console.log(`✓ ${exchange}`);
    } else {
        console.log(`✗ ${exchange} - НЕ НАЙДЕНА`);
    }
});
