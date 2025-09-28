import { describe, it, expect } from 'vitest'
import { generateArticle } from '../article'

describe('generateArticle', () => {
  it('should generate article text and confidence score', () => {
    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    }

    const result = generateArticle(data)

    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('confidence')
    expect(typeof result.text).toBe('string')
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should handle missing data', () => {
    const data = { price: null, rsi: null, ema12: null, ema26: null, macd: null }

    const result = generateArticle(data)

    expect(result.text).toContain('Data unavailable')
    expect(result.confidence).toBe(0)
  })
})