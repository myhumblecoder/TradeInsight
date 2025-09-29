import { describe, it, expect } from 'vitest'
import {
  calculateBollingerBands,
  calculateStochasticRSI,
  calculateVolumeProfile,
  calculateFibonacciExtensions,
  type OHLCV
} from '../advancedIndicators'

describe('Advanced Technical Indicators', () => {
  // Mock OHLCV data for testing
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

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const bands = calculateBollingerBands(mockOHLCVData, 5, 2)
      
      expect(bands).toHaveProperty('upper')
      expect(bands).toHaveProperty('middle')
      expect(bands).toHaveProperty('lower')
      expect(bands).toHaveProperty('bandwidth')
      expect(bands).toHaveProperty('percentB')
      
      expect(typeof bands.upper).toBe('number')
      expect(typeof bands.middle).toBe('number')
      expect(typeof bands.lower).toBe('number')
      expect(bands.upper).toBeGreaterThan(bands.middle)
      expect(bands.middle).toBeGreaterThan(bands.lower)
    })

    it('should handle insufficient data', () => {
      const shortData = mockOHLCVData.slice(0, 2)
      const bands = calculateBollingerBands(shortData, 5, 2)
      
      expect(bands.upper).toBeGreaterThan(0)
      expect(bands.middle).toBeGreaterThan(0)
      expect(bands.lower).toBeGreaterThan(0)
    })

    it('should calculate bandwidth correctly', () => {
      const bands = calculateBollingerBands(mockOHLCVData, 5, 2)
      const expectedBandwidth = (bands.upper - bands.lower) / bands.middle
      
      expect(bands.bandwidth).toBeCloseTo(expectedBandwidth, 4)
    })

    it('should calculate %B correctly', () => {
      const bands = calculateBollingerBands(mockOHLCVData, 5, 2)
      
      expect(bands.percentB).toBeGreaterThanOrEqual(0)
      expect(bands.percentB).toBeLessThanOrEqual(1)
    })
  })

  describe('calculateStochasticRSI', () => {
    it('should calculate Stochastic RSI correctly', () => {
      const stochRSI = calculateStochasticRSI(mockOHLCVData, 14, 14, 3, 3)
      
      expect(stochRSI).toHaveProperty('k')
      expect(stochRSI).toHaveProperty('d')
      expect(stochRSI).toHaveProperty('signal')
      expect(stochRSI).toHaveProperty('overbought')
      expect(stochRSI).toHaveProperty('oversold')
      
      expect(typeof stochRSI.k).toBe('number')
      expect(typeof stochRSI.d).toBe('number')
      expect(stochRSI.k).toBeGreaterThanOrEqual(0)
      expect(stochRSI.k).toBeLessThanOrEqual(100)
      expect(stochRSI.d).toBeGreaterThanOrEqual(0)
      expect(stochRSI.d).toBeLessThanOrEqual(100)
    })

    it('should identify overbought/oversold conditions', () => {
      const stochRSI = calculateStochasticRSI(mockOHLCVData, 14, 14, 3, 3)
      
      expect(stochRSI.overbought).toBe(stochRSI.k > 80 && stochRSI.d > 80)
      expect(stochRSI.oversold).toBe(stochRSI.k < 20 && stochRSI.d < 20)
    })

    it('should generate trading signals', () => {
      const stochRSI = calculateStochasticRSI(mockOHLCVData, 14, 14, 3, 3)
      
      expect(['bullish', 'bearish', 'neutral']).toContain(stochRSI.signal)
    })
  })

  describe('calculateVolumeProfile', () => {
    it('should calculate Volume Profile correctly', () => {
      const volumeProfile = calculateVolumeProfile(mockOHLCVData, 10)
      
      expect(volumeProfile).toHaveProperty('levels')
      expect(volumeProfile).toHaveProperty('poc')
      expect(volumeProfile).toHaveProperty('valueAreaHigh')
      expect(volumeProfile).toHaveProperty('valueAreaLow')
      expect(volumeProfile).toHaveProperty('totalVolume')
      
      expect(Array.isArray(volumeProfile.levels)).toBe(true)
      expect(volumeProfile.levels.length).toBeGreaterThan(0)
      expect(typeof volumeProfile.poc).toBe('number')
      expect(typeof volumeProfile.totalVolume).toBe('number')
    })

    it('should identify Point of Control (POC)', () => {
      const volumeProfile = calculateVolumeProfile(mockOHLCVData, 10)
      
      // POC should be the price level with highest volume
      const maxVolumeLevel = volumeProfile.levels.reduce((max, level) => 
        level.volume > max.volume ? level : max
      )
      
      expect(volumeProfile.poc).toBe(maxVolumeLevel.price)
    })

    it('should calculate Value Area correctly', () => {
      const volumeProfile = calculateVolumeProfile(mockOHLCVData, 10)
      
      expect(volumeProfile.valueAreaHigh).toBeGreaterThanOrEqual(volumeProfile.valueAreaLow)
      expect(volumeProfile.valueAreaHigh).toBeGreaterThanOrEqual(volumeProfile.poc)
      expect(volumeProfile.valueAreaLow).toBeLessThanOrEqual(volumeProfile.poc)
    })

    it('should sort volume levels by price', () => {
      const volumeProfile = calculateVolumeProfile(mockOHLCVData, 10)
      
      for (let i = 1; i < volumeProfile.levels.length; i++) {
        expect(volumeProfile.levels[i].price).toBeGreaterThanOrEqual(volumeProfile.levels[i - 1].price)
      }
    })
  })

  describe('calculateFibonacciExtensions', () => {
    it('should calculate Fibonacci Extensions correctly', () => {
      const swing1Start = 100
      const swing1End = 110
      const swing2End = 105
      
      const extensions = calculateFibonacciExtensions(swing1Start, swing1End, swing2End)
      
      expect(extensions).toHaveProperty('levels')
      expect(extensions).toHaveProperty('targets')
      expect(extensions).toHaveProperty('projection')
      
      expect(extensions.levels).toHaveProperty('61.8%')
      expect(extensions.levels).toHaveProperty('100%')
      expect(extensions.levels).toHaveProperty('161.8%')
      expect(extensions.levels).toHaveProperty('261.8%')
      
      expect(Array.isArray(extensions.targets)).toBe(true)
      expect(extensions.targets.length).toBeGreaterThan(0)
    })

    it('should handle uptrend projections', () => {
      const extensions = calculateFibonacciExtensions(100, 110, 105)
      
      // In an uptrend continuation, extensions should be above the swing high
      extensions.targets.forEach(target => {
        expect(target.price).toBeGreaterThan(105)
      })
    })

    it('should handle downtrend projections', () => {
      const extensions = calculateFibonacciExtensions(110, 100, 105)
      
      // In a downtrend continuation, extensions should be below the swing low
      extensions.targets.forEach(target => {
        expect(target.price).toBeLessThan(105)
      })
    })

    it('should provide trading context', () => {
      const extensions = calculateFibonacciExtensions(100, 110, 105)
      
      expect(['uptrend_continuation', 'downtrend_continuation', 'reversal']).toContain(extensions.projection)
      
      extensions.targets.forEach(target => {
        expect(typeof target.level).toBe('string')
        expect(typeof target.price).toBe('number')
        expect(['target', 'strong_resistance', 'extreme_extension']).toContain(target.significance)
      })
    })

    it('should sort targets by price', () => {
      const extensions = calculateFibonacciExtensions(100, 110, 105)
      
      for (let i = 1; i < extensions.targets.length; i++) {
        if (extensions.projection === 'uptrend_continuation') {
          expect(extensions.targets[i].price).toBeGreaterThanOrEqual(extensions.targets[i - 1].price)
        } else {
          expect(extensions.targets[i].price).toBeLessThanOrEqual(extensions.targets[i - 1].price)
        }
      }
    })
  })
})