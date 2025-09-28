import { describe, it, expect } from 'vitest'
import { calculateRSI, calculateEMA, calculateMACD } from '../indicators'

describe('indicators', () => {
  const prices = Array.from({ length: 50 }, (_, i) => 100 + i) // Longer array for MACD

  it('should calculate RSI', () => {
    const rsi = calculateRSI(prices, 14)
    expect(rsi).toBeDefined()
    expect(typeof rsi).toBe('number')
    // Add more specific assertions based on expected values
  })

  it('should calculate EMA', () => {
    const ema = calculateEMA(prices, 12)
    expect(ema).toBeDefined()
    expect(Array.isArray(ema)).toBe(true)
  })

  it('should calculate MACD', () => {
    const macd = calculateMACD(prices)
    expect(macd).toBeDefined()
    expect(macd).toHaveProperty('MACD')
    expect(macd).toHaveProperty('signal')
    expect(macd).toHaveProperty('histogram')
  })
})