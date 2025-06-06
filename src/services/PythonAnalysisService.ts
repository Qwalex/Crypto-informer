import axios from 'axios';
import { OHLCVData, PythonAnalysisResult } from '../types';

export class PythonAnalysisService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async analyzeWithARIMAGARCH(data: OHLCVData[], pair: string): Promise<PythonAnalysisResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze`, {
        data: data,
        pair: pair
      }, {
        timeout: 30000 // 30 секунд таймаут
      });

      return response.data;
    } catch (error) {
      console.error(`Ошибка анализа ARIMA/GARCH для ${pair}:`, error);
      
      // Возвращаем значения по умолчанию при ошибке
      return {
        arima_forecast: data[data.length - 1].close,
        garch_volatility: 0.02,
        pair: pair
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Python сервис недоступен:', error);
      return false;
    }
  }
}
