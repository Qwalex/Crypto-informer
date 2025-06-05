from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from arch import arch_model
import warnings
import logging
from typing import Dict, Any, List

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Подавляем предупреждения
warnings.filterwarnings('ignore')

app = Flask(__name__)

class CryptoAnalyzer:
    """Класс для анализа криптовалютных данных с помощью ARIMA и GARCH моделей"""
    
    @staticmethod
    def prepare_data(ohlcv_data: List[Dict]) -> pd.Series:
        """Подготавливает данные для анализа"""
        try:
            df = pd.DataFrame(ohlcv_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df = df.set_index('timestamp')
            df = df.sort_index()
            
            # Используем цены закрытия
            prices = df['close'].astype(float)
            
            # Удаляем NaN и нулевые значения
            prices = prices.dropna()
            prices = prices[prices > 0]
            
            return prices
        except Exception as e:
            logger.error(f"Ошибка подготовки данных: {e}")
            raise
    
    @staticmethod
    def calculate_returns(prices: pd.Series) -> pd.Series:
        """Рассчитывает логарифмические доходности"""
        try:
            returns = np.log(prices / prices.shift(1)).dropna()
            return returns
        except Exception as e:
            logger.error(f"Ошибка расчета доходностей: {e}")
            raise
    
    @staticmethod
    def apply_arima(prices: pd.Series, order: tuple = (5, 1, 0)) -> float:
        """Применяет модель ARIMA для прогнозирования цен"""
        try:
            if len(prices) < 50:
                logger.warning("Недостаточно данных для ARIMA, возвращаем последнюю цену")
                return float(prices.iloc[-1])
            
            # Пробуем разные порядки модели
            orders_to_try = [
                (5, 1, 0), (1, 1, 1), (2, 1, 2), 
                (3, 1, 0), (0, 1, 1), (1, 1, 0)
            ]
            
            best_model = None
            best_aic = float('inf')
            
            for test_order in orders_to_try:
                try:
                    model = ARIMA(prices, order=test_order)
                    fitted_model = model.fit()
                    
                    if fitted_model.aic < best_aic:
                        best_aic = fitted_model.aic
                        best_model = fitted_model
                        
                except Exception as e:
                    logger.debug(f"Не удалось подогнать ARIMA{test_order}: {e}")
                    continue
            
            if best_model is None:
                logger.warning("Не удалось подогнать ни одну ARIMA модель")
                return float(prices.iloc[-1])
            
            # Делаем прогноз на 1 период вперед
            forecast = best_model.forecast(steps=1)
            return float(forecast.iloc[0])
            
        except Exception as e:
            logger.error(f"Ошибка ARIMA анализа: {e}")
            return float(prices.iloc[-1])
    
    @staticmethod
    def apply_garch(returns: pd.Series) -> float:
        """Применяет модель GARCH для прогнозирования волатильности"""
        try:
            if len(returns) < 50:
                logger.warning("Недостаточно данных для GARCH")
                return float(returns.std())
            
            # Убираем выбросы (более 5 стандартных отклонений)
            std = returns.std()
            mean = returns.mean()
            filtered_returns = returns[
                (returns >= mean - 5 * std) & 
                (returns <= mean + 5 * std)
            ]
            
            if len(filtered_returns) < 30:
                filtered_returns = returns
            
            # Пробуем разные спецификации GARCH
            specs_to_try = [
                {'vol': 'Garch', 'p': 1, 'q': 1},
                {'vol': 'Garch', 'p': 1, 'q': 2},
                {'vol': 'Garch', 'p': 2, 'q': 1},
                {'vol': 'Garch', 'p': 2, 'q': 2}
            ]
            
            best_model = None
            best_loglik = float('-inf')
            
            for spec in specs_to_try:
                try:
                    # Масштабируем доходности для численной стабильности
                    scaled_returns = filtered_returns * 100
                    
                    model = arch_model(scaled_returns, **spec)
                    fitted_model = model.fit(disp='off', show_warning=False)
                    
                    if fitted_model.loglikelihood > best_loglik:
                        best_loglik = fitted_model.loglikelihood
                        best_model = fitted_model
                        
                except Exception as e:
                    logger.debug(f"Не удалось подогнать GARCH{spec}: {e}")
                    continue
            
            if best_model is None:
                logger.warning("Не удалось подогнать GARCH модель")
                return float(filtered_returns.std())
            
            # Прогнозируем волатильность на 1 период вперед
            forecast = best_model.forecast(horizon=1)
            volatility = np.sqrt(forecast.variance.values[-1, 0]) / 100  # Возвращаем к исходному масштабу
            
            return float(volatility)
            
        except Exception as e:
            logger.error(f"Ошибка GARCH анализа: {e}")
            return float(returns.std()) if len(returns) > 0 else 0.02

@app.route('/health', methods=['GET'])
def health_check():
    """Проверка состояния сервиса"""
    return jsonify({'status': 'healthy', 'message': 'Python Analysis Service is running'})

@app.route('/analyze', methods=['POST'])
def analyze():
    """Основной endpoint для анализа данных"""
    try:
        data = request.get_json()
        
        if not data or 'data' not in data or 'pair' not in data:
            return jsonify({'error': 'Отсутствуют необходимые данные'}), 400
        
        ohlcv_data = data['data']
        pair = data['pair']
        
        logger.info(f"Анализ данных для пары: {pair}")
        
        # Подготавливаем данные
        analyzer = CryptoAnalyzer()
        prices = analyzer.prepare_data(ohlcv_data)
        
        if len(prices) < 10:
            return jsonify({'error': 'Недостаточно данных для анализа'}), 400
        
        # Рассчитываем доходности
        returns = analyzer.calculate_returns(prices)
        
        # Применяем ARIMA для прогнозирования цены
        arima_forecast = analyzer.apply_arima(prices)
        
        # Применяем GARCH для прогнозирования волатильности
        garch_volatility = analyzer.apply_garch(returns)
        
        result = {
            'arima_forecast': arima_forecast,
            'garch_volatility': garch_volatility,
            'pair': pair,
            'current_price': float(prices.iloc[-1]),
            'data_points': len(prices),
            'forecast_date': pd.Timestamp.now().isoformat()
        }
        
        logger.info(f"Анализ завершен для {pair}: прогноз={arima_forecast:.6f}, волатильность={garch_volatility:.4f}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Ошибка анализа: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/bulk-analyze', methods=['POST'])
def bulk_analyze():
    """Анализ нескольких пар одновременно"""
    try:
        data = request.get_json()
        
        if not data or 'pairs_data' not in data:
            return jsonify({'error': 'Отсутствуют данные для анализа'}), 400
        
        pairs_data = data['pairs_data']
        results = []
        
        analyzer = CryptoAnalyzer()
        
        for pair_data in pairs_data:
            try:
                pair = pair_data['pair']
                ohlcv_data = pair_data['data']
                
                logger.info(f"Анализ пары: {pair}")
                
                prices = analyzer.prepare_data(ohlcv_data)
                
                if len(prices) < 10:
                    logger.warning(f"Недостаточно данных для {pair}")
                    continue
                
                returns = analyzer.calculate_returns(prices)
                arima_forecast = analyzer.apply_arima(prices)
                garch_volatility = analyzer.apply_garch(returns)
                
                results.append({
                    'arima_forecast': arima_forecast,
                    'garch_volatility': garch_volatility,
                    'pair': pair,
                    'current_price': float(prices.iloc[-1]),
                    'data_points': len(prices)
                })
                
            except Exception as e:
                logger.error(f"Ошибка анализа пары {pair_data.get('pair', 'unknown')}: {e}")
                continue
        
        return jsonify({
            'results': results,
            'processed_pairs': len(results),
            'analysis_date': pd.Timestamp.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Ошибка массового анализа: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Запуск Python Analysis Service...")
    app.run(host='0.0.0.0', port=8000, debug=False)
