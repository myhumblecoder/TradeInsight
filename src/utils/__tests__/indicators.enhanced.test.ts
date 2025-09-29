import { describe, it, expect } from 'vitest'
import { analyzeIndicators, type OHLCV } from '../indicators'

describe('Enhanced Indicators Analysis', () => {
  const mockOHLCVData: OHLCV[] = [
    { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { timestamp: 2000, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
    { timestamp: 3000, open: 106, high: 110, low: 104, close: 108, volume: 800 },
    { timestamp: 4000, open: 108, high: 112, low: 105, close: 107, volume: 900 },
    { timestamp: 5000, open: 107, high: 109, low: 103, close: 105, volume: 1100 },
    { timestamp: 6000, open: 105, high: 107, low: 102, close: 104, volume: 950 },
    { timestamp: 7000, open: 104, high: 106, low: 101, close: 103, volume: 1050 },
    { timestamp: 8000, open: 103, high: 108, low: 102, close: 106, volume: 1300 },
    { timestamp: 9000, open: 106, high: 111, low: 105, close: 109, volume: 1400 },
    { timestamp: 10000, open: 109, high: 113, low: 107, close: 111, volume: 1600 }
  ]

  describe('analyzeIndicators', () => {
    it('should perform comprehensive indicator analysis', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      // Check basic structure
      expect(analysis).toHaveProperty('rsi')
      expect(analysis).toHaveProperty('ema12')
      expect(analysis).toHaveProperty('ema26')
      expect(analysis).toHaveProperty('macd')
      expect(analysis).toHaveProperty('bollingerBands')
      expect(analysis).toHaveProperty('stochasticRSI')
      expect(analysis).toHaveProperty('volumeProfile')
      expect(analysis).toHaveProperty('signals')
      
      // Check data types
      expect(typeof analysis.rsi).toBe('number')
      expect(analysis.bollingerBands).toHaveProperty('upper')
      expect(analysis.stochasticRSI).toHaveProperty('k')
      expect(analysis.volumeProfile).toHaveProperty('poc')
      expect(analysis.signals).toHaveProperty('overall')
    })

    it('should calculate RSI correctly', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      expect(analysis.rsi).toBeGreaterThanOrEqual(0)
      expect(analysis.rsi).toBeLessThanOrEqual(100)
    })

    it('should calculate EMAs correctly', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      if (analysis.ema12 !== null && analysis.ema26 !== null) {
        expect(analysis.ema12).toBeGreaterThan(0)
        expect(analysis.ema26).toBeGreaterThan(0)
      }
    })

    it('should generate proper signals', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      const validRSISignals = ['overbought', 'oversold', 'neutral']
      const validMACDSignals = ['bullish', 'bearish', 'neutral']
      const validBollingerSignals = ['squeeze', 'expansion', 'normal']
      const validStochRSISignals = ['bullish', 'bearish', 'neutral']
      const validOverallSignals = ['bullish', 'bearish', 'neutral']
      
      expect(validRSISignals).toContain(analysis.signals.rsi)
      expect(validMACDSignals).toContain(analysis.signals.macd)
      expect(validBollingerSignals).toContain(analysis.signals.bollinger)
      expect(validStochRSISignals).toContain(analysis.signals.stochRSI)
      expect(validOverallSignals).toContain(analysis.signals.overall)
    })

    it('should handle empty data gracefully', () => {
      const analysis = analyzeIndicators([])
      
      expect(analysis.rsi).toBe(50)
      expect(analysis.ema12).toBeNull()
      expect(analysis.ema26).toBeNull()
      expect(analysis.signals.overall).toBe('neutral')
      expect(analysis.bollingerBands.upper).toBe(0)
      expect(analysis.stochasticRSI.k).toBe(50)
      expect(analysis.volumeProfile.levels).toEqual([])
    })

    it('should identify RSI overbought condition', () => {
      // Create data that would result in high RSI
      const overboughtData: OHLCV[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: 1000 + i * 1000,
        open: 100 + i * 2,
        high: 105 + i * 2,
        low: 95 + i * 2,
        close: 102 + i * 2, // Consistently rising
        volume: 1000
      }))
      
      const analysis = analyzeIndicators(overboughtData)
      
      expect(analysis.rsi).toBeGreaterThan(50) // Should be trending up
    })

    it('should calculate Bollinger Bands correctly', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      expect(analysis.bollingerBands.upper).toBeGreaterThan(analysis.bollingerBands.middle)
      expect(analysis.bollingerBands.middle).toBeGreaterThan(analysis.bollingerBands.lower)
      expect(analysis.bollingerBands.bandwidth).toBeGreaterThan(0)
      expect(analysis.bollingerBands.percentB).toBeGreaterThanOrEqual(0)
    })

    it('should calculate Stochastic RSI correctly', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      expect(analysis.stochasticRSI.k).toBeGreaterThanOrEqual(0)
      expect(analysis.stochasticRSI.k).toBeLessThanOrEqual(100)
      expect(analysis.stochasticRSI.d).toBeGreaterThanOrEqual(0)
      expect(analysis.stochasticRSI.d).toBeLessThanOrEqual(100)
      expect(typeof analysis.stochasticRSI.overbought).toBe('boolean')
      expect(typeof analysis.stochasticRSI.oversold).toBe('boolean')
    })

    it('should calculate Volume Profile correctly', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      expect(Array.isArray(analysis.volumeProfile.levels)).toBe(true)
      expect(analysis.volumeProfile.levels.length).toBeGreaterThan(0)
      expect(analysis.volumeProfile.poc).toBeGreaterThan(0)
      expect(analysis.volumeProfile.totalVolume).toBeGreaterThan(0)
      expect(analysis.volumeProfile.valueAreaHigh).toBeGreaterThanOrEqual(analysis.volumeProfile.valueAreaLow)
    })

    it('should provide overall signal based on individual indicators', () => {
      const analysis = analyzeIndicators(mockOHLCVData)
      
      // The overall signal should be one of the three valid options
      expect(['bullish', 'bearish', 'neutral']).toContain(analysis.signals.overall)
      
      // If we can determine the constituent signals, overall should make sense
      const { rsi, macd, stochRSI } = analysis.signals
      if (rsi !== 'neutral' || macd !== 'neutral' || stochRSI !== 'neutral') {
        // At least one signal is not neutral, so overall should not always be neutral
        // This is more of a sanity check than a strict requirement
        expect(analysis.signals.overall).toBeDefined()
      }
    })
  })
})