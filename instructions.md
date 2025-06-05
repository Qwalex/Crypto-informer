Техническое задание (ТЗ) для разработки криптовалютного сигнального бота с использованием технического анализа и математических моделей
1. Введение
Целью данного проекта является разработка криптовалютного сигнального бота, который будет использовать данные о нескольких валютных парах, рассчитывать технические индикаторы (RSI, MACD, Bollinger Bands) и прогнозировать волатильность с помощью моделей ARIMA и GARCH. На основе полученных результатов бот будет оценивать вероятность движения рынка и выбирать наиболее перспективные валютные пары для торговли.
2. Задачи

Собирать данные о криптовалютных парах с API биржи.
Рассчитывать технические индикаторы (RSI, MACD, Bollinger Bands) для каждой валютной пары.
Применять математическое моделирование с использованием ARIMA и GARCH для оценки волатильности.
Оценивать вероятность роста рынка на основе индикаторов.
Выбирать наиболее перспективную валютную пару на основе вероятности.
Отправлять сигналы на основе анализа.

3. Требования к системе

Технический анализ:

Рассчитывать индикаторы RSI, MACD и Bollinger Bands.
Для этого использовать библиотеку TA-Lib или аналоги на Node.js.

Математическое моделирование:

Реализовать модели ARIMA и GARCH для прогнозирования цен и волатильности.
Для ARIMA можно использовать библиотеку statsmodels (через Python-скрипты).
Для GARCH использовать arch (Python) или аналогичную библиотеку.

Функциональные требования:

Подключение к API криптовалютной биржи для получения исторических данных по валютным парам.
Подсчет технических индикаторов для каждой валютной пары.
Прогнозирование волатильности и тренда на основе ARIMA и GARCH.
Генерация торговых сигналов (покупка/продажа) на основе результатов.
Отправка уведомлений о сигналах через Telegram или Email.

Программная среда:

Node.js (для реализации бота).
Python (для использования ARIMA/GARCH).
API криптовалютных бирж (например, Bybit через ccxt).

Программные библиотеки:

ccxt (для получения рыночных данных с биржи).
TA-Lib (или аналоги) для расчета технических индикаторов.
node-fetch или axios для отправки запросов.
child_process для запуска Python-скриптов.
node-schedule для планирования периодических задач.
Telegram API для отправки уведомлений.

4. Архитектура

Получение данных с биржи:

Подключение к API с использованием ccxt.
Получение исторических данных (OHLCV) по нескольким валютным парам (например, BTC/USDT, ETH/USDT).

Анализ с помощью технических индикаторов:

Расчет индикаторов RSI, MACD, Bollinger Bands с помощью TA-Lib или аналогичной библиотеки.
Применение модели ARIMA для прогнозирования цен.
Применение модели GARCH для прогнозирования волатильности.

Прогнозирование и выбор валютной пары:

Рассчитывать вероятность роста или падения рынка на основе вышеупомянутых факторов.
Оценка валютных пар и выбор самой перспективной для торговли.

Отправка сигналов:

Если сигнал на покупку, отправить уведомление через Telegram.
Если сигнал на продажу, отправить уведомление через Telegram.

5. Этапы разработки
1. Сбор данных

Получить исторические данные (OHLCV) с помощью API криптовалютной биржи.

Пример на Node.js с использованием ccxt:
const ccxt = require('ccxt');

async function getData(symbol = 'BTC/USDT', timeframe = '1h', limit = 100) {
const exchange = new ccxt.bybit();
const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
return ohlcv.map(item => ({
timestamp: item[0],
open: item[1],
high: item[2],
low: item[3],
close: item[4],
volume: item[5]
}));
}
2. Расчет технических индикаторов

Использование TA-Lib для расчета RSI, MACD, и Bollinger Bands.

Пример на Node.js:
const talib = require('talib-binding');

function calculateIndicators(data) {
const closePrices = data.map(item => item.close);

// RSI
const rsi = talib.execute({
name: 'RSI',
startIdx: 0,
endIdx: closePrices.length - 1,
inReal: closePrices,
optInTimePeriod: 14
}).result.outReal;

// MACD
const macd = talib.execute({
name: 'MACD',
startIdx: 0,
endIdx: closePrices.length - 1,
inReal: closePrices,
optInFastPeriod: 12,
optInSlowPeriod: 26,
optInSignalPeriod: 9
});

// Bollinger Bands
const bollingerBands = talib.execute({
name: 'BBANDS',
startIdx: 0,
endIdx: closePrices.length - 1,
inReal: closePrices,
optInTimePeriod: 20,
optInNbDevUp: 2,
optInNbDevDn: 2,
optInMAType: 0
});

return {
rsi,
macd,
bollingerBands
};
}
3. Прогнозирование с использованием ARIMA и GARCH (Python)
Создайте Python-скрипт, который будет обрабатывать данные и возвращать прогнозы на основе ARIMA и GARCH.
Пример на Python:
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from arch import arch_model

def apply_arima(data):
model = ARIMA(data, order=(5, 1, 0))
model_fit = model.fit()
forecast = model_fit.forecast(steps=1)
return forecast[0]

def apply_garch(data):
model = arch_model(data, vol='Garch', p=1, q=1)
model_fit = model.fit()
forecast = model_fit.forecast(horizon=1)
return forecast.variance.values[-1, :][0]
4. Выбор валютной пары и отправка сигнала

Используя рассчитанные индикаторы и прогнозы ARIMA/GARCH, вычисляется вероятность роста для каждой валютной пары.
На основе этой вероятности выбирается наиболее перспективная валютная пара.

Пример вычисления вероятности (Node.js):
function calculateProbability(indicators) {
// Весовые коэффициенты для индикаторов (пример)
const weights = {
rsi: 0.2,
macd: 0.3,
bollinger: 0.2,
arima: 0.2,
garch: 0.1
};

let probability = 0;
probability += (indicators.rsi < 30 ? 1 : 0) * weights.rsi;
probability += (indicators.macd > 0 ? 1 : 0) * weights.macd;
probability += (indicators.bollinger.lower < indicators.close ? 1 : 0) * weights.bollinger;
probability += (indicators.arima > indicators.close ? 1 : 0) * weights.arima;
probability += (indicators.garch > 0.02 ? 1 : 0) * weights.garch;

return probability;
}
Пример отправки сигнала через Telegram:
const axios = require('axios');

async function sendSignalToTelegram(message) {
const token = 'YOUR_BOT_TOKEN';
const chatId = 'YOUR_CHAT_ID';
const url = `https://api.telegram.org/bot${token}/sendMessage`;

await axios.post(url, {
chat_id: chatId,
text: message
});
}
5. Развертывание и мониторинг

Использовать node-schedule для запуска бота с заданной периодичностью.
Использовать VPS или Heroku для развертывания бота.

6. Заключение
Техническое задание описывает разработку бота, который использует технический анализ (RSI, MACD, Bollinger Bands) и математические модели (ARIMA, GARCH) для анализа криптовалютных рынков. Бот будет оценивать вероятность роста валютных пар и отправлять торговые сигналы через Telegram.
Для реализации бота вам нужно будет интегрировать все эти компоненты в единую систему, используя Node.js для обработки данных и Python для математического моделирования.