import { RSI, EMA, MACD } from 'technicalindicators'
import { 
  calculateBollingerBands, 
  calculateStochasticRSI, 
  calculateVolumeProfile,
  calculateFibonacciExtensions,
  type BollingerBands,
  type StochasticRSI,
  type VolumeProfile,
  type FibonacciExtensions
} from './advancedIndicators'
import { type OHLCV } from './priceAnalysis'

export const calculateRSI = (prices: number[], period: number = 14): number => {
  const rsi = new RSI({ period, values: prices })
  const result = rsi.getResult()
  return result[result.length - 1] || 0
}

export const calculateEMA = (prices: number[], period: number = 12): number[] => {
  const ema = new EMA({ period, values: prices })
  return ema.getResult()
}

export const calculateMACD = (prices: number[]) => {
  const macd = new MACD({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
  const result = macd.getResult()
  return result.length > 0 ? result[result.length - 1] : null
}

// Re-export advanced indicators for convenience
export {
  calculateBollingerBands,
  calculateStochasticRSI,
  calculateVolumeProfile,
  calculateFibonacciExtensions,
  type BollingerBands,
  type StochasticRSI,
  type VolumeProfile,
  type FibonacciExtensions
}

export { type OHLCV }

// Enhanced indicator analysis function
export interface IndicatorAnalysis {
  rsi: number
  ema12: number | null
  ema26: number | null
  macd: { MACD: number; signal: number; histogram: number } | null
  bollingerBands: BollingerBands
  stochasticRSI: StochasticRSI
  volumeProfile: VolumeProfile
  signals: {
    rsi: 'overbought' | 'oversold' | 'neutral'
    macd: 'bullish' | 'bearish' | 'neutral'
    bollinger: 'squeeze' | 'expansion' | 'normal'
    stochRSI: 'bullish' | 'bearish' | 'neutral'
    overall: 'bullish' | 'bearish' | 'neutral'
  }
}

export function analyzeIndicators(data: OHLCV[]): IndicatorAnalysis {
  if (data.length === 0) {
    const emptyAnalysis: IndicatorAnalysis = {
      rsi: 50,
      ema12: null,
      ema26: null,
      macd: null,
      bollingerBands: { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0 },
      stochasticRSI: { k: 50, d: 50, signal: 'neutral', overbought: false, oversold: false },
      volumeProfile: { levels: [], poc: 0, valueAreaHigh: 0, valueAreaLow: 0, totalVolume: 0 },
      signals: {
        rsi: 'neutral',
        macd: 'neutral',
        bollinger: 'normal',
        stochRSI: 'neutral',
        overall: 'neutral'
      }
    }
    return emptyAnalysis
  }

  const prices = data.map(candle => candle.close)
  
  // Calculate basic indicators
  const rsi = calculateRSI(prices)
  const ema12Array = calculateEMA(prices, 12)
  const ema26Array = calculateEMA(prices, 26)
  const ema12 = ema12Array.length > 0 ? ema12Array[ema12Array.length - 1] : null
  const ema26 = ema26Array.length > 0 ? ema26Array[ema26Array.length - 1] : null
  const macd = calculateMACD(prices)
  
  // Calculate advanced indicators
  const bollingerBands = calculateBollingerBands(data)
  const stochasticRSI = calculateStochasticRSI(data)
  const volumeProfile = calculateVolumeProfile(data)
  
  // Generate signals
  const rsiSignal = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
  
  const macdSignal = macd && macd.MACD && macd.signal ? 
    (macd.MACD > macd.signal ? 'bullish' : 'bearish') : 'neutral'
  
  const bollingerSignal = bollingerBands.bandwidth < 0.1 ? 'squeeze' : 
                         bollingerBands.bandwidth > 0.2 ? 'expansion' : 'normal'
  
  const stochRSISignal = stochasticRSI.signal
  
  // Overall signal - simple majority vote
  const signals = [rsiSignal, macdSignal, stochRSISignal].filter(s => s !== 'neutral')
  const bullishCount = signals.filter(s => s === 'bullish').length
  const bearishCount = signals.filter(s => s === 'bearish' || s === 'overbought').length
  
  let overallSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (bullishCount > bearishCount) overallSignal = 'bullish'
  else if (bearishCount > bullishCount) overallSignal = 'bearish'
  
  return {
    rsi,
    ema12,
    ema26,
    macd,
    bollingerBands,
    stochasticRSI,
    volumeProfile,
    signals: {
      rsi: rsiSignal,
      macd: macdSignal,
      bollinger: bollingerSignal,
      stochRSI: stochRSISignal,
      overall: overallSignal
    }
  }
}