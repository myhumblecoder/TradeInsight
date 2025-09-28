import { RSI, EMA, MACD } from 'technicalindicators'

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