import { describe, it, expect } from 'vitest'
import { convertCandlesToOHLCV, type CandleData } from '../dataConversion'

describe('Data Conversion Utils', () => {
  describe('convertCandlesToOHLCV', () => {
    it('should convert candle data to OHLCV format', () => {
      const candleData: CandleData[] = [
        [1000, 100, 105, 95, 102, 1000],
        [2000, 102, 108, 100, 106, 1200],
        [3000, 106, 110, 104, 108, 800],
      ]

      const result = convertCandlesToOHLCV(candleData)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        timestamp: 1000,
        open: 100,
        high: 105,
        low: 95,
        close: 102,
        volume: 1000,
      })
      expect(result[2]).toEqual({
        timestamp: 3000,
        open: 106,
        high: 110,
        low: 104,
        close: 108,
        volume: 800,
      })
    })

    it('should handle empty array', () => {
      const result = convertCandlesToOHLCV([])
      expect(result).toEqual([])
    })

    it('should handle malformed candle data', () => {
      const candleData: CandleData[] = [
        [1000, 100], // Incomplete data
        [2000, 102, 108, 100, 106, 1200], // Complete data
      ]

      const result = convertCandlesToOHLCV(candleData)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        timestamp: 1000,
        open: 100,
        high: 100,
        low: 100,
        close: 100,
        volume: 0,
      })
      expect(result[1]).toEqual({
        timestamp: 2000,
        open: 102,
        high: 108,
        low: 100,
        close: 106,
        volume: 1200,
      })
    })

    it('should sort by timestamp', () => {
      const candleData: CandleData[] = [
        [3000, 106, 110, 104, 108, 800],
        [1000, 100, 105, 95, 102, 1000],
        [2000, 102, 108, 100, 106, 1200],
      ]

      const result = convertCandlesToOHLCV(candleData)

      expect(result).toHaveLength(3)
      expect(result[0].timestamp).toBe(1000)
      expect(result[1].timestamp).toBe(2000)
      expect(result[2].timestamp).toBe(3000)
    })

    it('should handle CoinGecko price data format', () => {
      // CoinGecko sometimes returns [timestamp, price] format
      const priceData = [
        [1000, 102],
        [2000, 106],
        [3000, 108],
      ]

      const result = convertCandlesToOHLCV(priceData)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        timestamp: 1000,
        open: 102,
        high: 102,
        low: 102,
        close: 102,
        volume: 0,
      })
    })
  })
})
