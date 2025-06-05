export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number[];
  macd: {
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  bollingerBands: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
}

export interface PythonAnalysisResult {
  arima_forecast: number;
  garch_volatility: number;
  pair: string;
}

export interface MarketAnalysis {
  pair: string;
  probability: number;
  indicators: TechnicalIndicators;
  forecast: PythonAnalysisResult;
  currentPrice: number;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: {
    technical: string[];
    fundamental: string[];
    risk: string;
    timeframe: string;
  };
}

export interface TradingSignal {
  pair: string;
  signal: 'STRONG_BUY' | 'BUY' | 'SELL' | 'STRONG_SELL';
  price: number;
  probability: number;
  confidence: number;
  timestamp: number;
  analysis: MarketAnalysis;
  swingTarget: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    timeframe: string;
  };
}

export interface BotConfig {
  telegramToken: string;
  telegramChatId: string;
  analysisInterval: string;
  analysisPairs: string[];
  pythonServiceUrl: string;
}
