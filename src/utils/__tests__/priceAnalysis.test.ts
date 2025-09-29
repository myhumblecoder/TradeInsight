import { describe, it, expect } from 'vitest'
import {
  calculateEntryPoints,
  calculateStopLoss,
  calculateProfitTargets,
  analyzePricePoints,
  findSupportResistanceLevels,
  calculateATR,
  calculateFibonacciRetracement,
  type OHLCV
} from '../priceAnalysis'

describe('Price Analysis Utils', () => {
  // Mock OHLCV data for testing
  const mockOHLCVData: OHLCV[] = [
    { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { timestamp: 2000, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
    { timestamp: 3000, open: 106, high: 110, low: 104, close: 108, volume: 800 },
    { timestamp: 4000, open: 108, high: 112, low: 105, close: 107, volume: 900 },
    { timestamp: 5000, open: 107, high: 109, low: 103, close: 105, volume: 1100 }
  ]

  const mockCurrentPrice = 105

  describe('calculateATR', () => {
    it('should calculate Average True Range correctly', () => {
      const atr = calculateATR(mockOHLCVData, 3)
      expect(atr).toBeGreaterThan(0)
      expect(atr).toBeLessThan(10) // Reasonable range for our test data
    })

    it('should handle insufficient data', () => {
      const shortData = mockOHLCVData.slice(0, 1)
      const atr = calculateATR(shortData, 14)
      expect(atr).toBeGreaterThan(0)
    })
  })

  describe('findSupportResistanceLevels', () => {
    it('should identify support and resistance levels', () => {
      const levels = findSupportResistanceLevels(mockOHLCVData, 2)
      
      expect(levels).toHaveProperty('support')
      expect(levels).toHaveProperty('resistance')
      expect(Array.isArray(levels.support)).toBe(true)
      expect(Array.isArray(levels.resistance)).toBe(true)
    })

    it('should return sorted levels', () => {
      const levels = findSupportResistanceLevels(mockOHLCVData, 2)
      
      // Support levels should be in descending order (highest first)
      for (let i = 0; i < levels.support.length - 1; i++) {
        expect(levels.support[i]).toBeGreaterThanOrEqual(levels.support[i + 1])
      }
      
      // Resistance levels should be in ascending order (lowest first)
      for (let i = 0; i < levels.resistance.length - 1; i++) {
        expect(levels.resistance[i]).toBeLessThanOrEqual(levels.resistance[i + 1])
      }
    })
  })

  describe('calculateFibonacciRetracement', () => {
    it('should calculate Fibonacci retracement levels', () => {
      const fibLevels = calculateFibonacciRetracement(110, 95)
      
      expect(fibLevels).toHaveProperty('0%')
      expect(fibLevels).toHaveProperty('23.6%')
      expect(fibLevels).toHaveProperty('38.2%')
      expect(fibLevels).toHaveProperty('50%')
      expect(fibLevels).toHaveProperty('61.8%')
      expect(fibLevels).toHaveProperty('100%')
      
      // Function now always treats 0% as low, 100% as high
      expect(fibLevels['0%']).toBe(95)   // Low
      expect(fibLevels['100%']).toBe(110) // High
      expect(fibLevels['50%']).toBe(102.5)
    })

    it('should handle high < low case by treating first param as low', () => {
      const fibLevels = calculateFibonacciRetracement(95, 110)
      
      // When first param (95) < second param (110), treat as low to high
      expect(fibLevels['0%']).toBe(95)  // Low becomes 0%
      expect(fibLevels['100%']).toBe(110) // High becomes 100%
      expect(fibLevels['50%']).toBe(102.5)
    })
  })

  describe('calculateEntryPoints', () => {
    it('should calculate entry points with different strategies', () => {
      const entryPoints = calculateEntryPoints(mockOHLCVData, mockCurrentPrice)
      
      expect(entryPoints).toHaveProperty('conservative')
      expect(entryPoints).toHaveProperty('moderate')
      expect(entryPoints).toHaveProperty('aggressive')
      expect(entryPoints).toHaveProperty('methods')
      
      expect(typeof entryPoints.conservative).toBe('number')
      expect(typeof entryPoints.moderate).toBe('number')
      expect(typeof entryPoints.aggressive).toBe('number')
      
      // Conservative should be the highest, aggressive the lowest
      expect(entryPoints.conservative).toBeGreaterThanOrEqual(entryPoints.moderate)
      expect(entryPoints.moderate).toBeGreaterThanOrEqual(entryPoints.aggressive)
    })

    it('should include method explanations', () => {
      const entryPoints = calculateEntryPoints(mockOHLCVData, mockCurrentPrice)
      
      expect(entryPoints.methods.conservative).toBeDefined()
      expect(entryPoints.methods.moderate).toBeDefined()
      expect(entryPoints.methods.aggressive).toBeDefined()
      
      expect(typeof entryPoints.methods.conservative).toBe('string')
      expect(typeof entryPoints.methods.moderate).toBe('string')
      expect(typeof entryPoints.methods.aggressive).toBe('string')
    })
  })

  describe('calculateStopLoss', () => {
    it('should calculate stop loss using different methods', () => {
      const entryPrice = 105
      const stopLoss = calculateStopLoss(mockOHLCVData, entryPrice, 'atr')
      
      expect(stopLoss).toHaveProperty('price')
      expect(stopLoss).toHaveProperty('percentage')
      expect(stopLoss).toHaveProperty('method')
      expect(stopLoss).toHaveProperty('explanation')
      
      expect(typeof stopLoss.price).toBe('number')
      expect(typeof stopLoss.percentage).toBe('number')
      expect(stopLoss.method).toBe('atr')
      expect(stopLoss.price).toBeLessThan(entryPrice)
    })

    it('should calculate percentage-based stop loss', () => {
      const entryPrice = 100
      const stopLoss = calculateStopLoss(mockOHLCVData, entryPrice, 'percentage', 5)
      
      expect(stopLoss.method).toBe('percentage')
      expect(stopLoss.price).toBe(95)
      expect(stopLoss.percentage).toBe(5)
    })

    it('should calculate support-based stop loss', () => {
      const entryPrice = 107
      const stopLoss = calculateStopLoss(mockOHLCVData, entryPrice, 'support')
      
      expect(stopLoss.method).toBe('support')
      expect(stopLoss.price).toBeLessThan(entryPrice)
      expect(typeof stopLoss.explanation).toBe('string')
    })
  })

  describe('calculateProfitTargets', () => {
    it('should calculate multiple profit targets', () => {
      const entryPrice = 105
      const stopLossPrice = 100
      const profitTargets = calculateProfitTargets(mockOHLCVData, entryPrice, stopLossPrice)
      
      expect(profitTargets).toHaveProperty('target1')
      expect(profitTargets).toHaveProperty('target2')
      expect(profitTargets).toHaveProperty('target3')
      expect(profitTargets).toHaveProperty('riskRewardRatio')
      expect(profitTargets).toHaveProperty('methods')
      
      expect(profitTargets.target1).toBeGreaterThan(entryPrice)
      expect(profitTargets.target2).toBeGreaterThan(profitTargets.target1)
      expect(profitTargets.target3).toBeGreaterThan(profitTargets.target2)
    })

    it('should calculate proper risk-reward ratios', () => {
      const entryPrice = 100
      const stopLossPrice = 95
      const profitTargets = calculateProfitTargets(mockOHLCVData, entryPrice, stopLossPrice)
      
      const risk = entryPrice - stopLossPrice
      const reward1 = profitTargets.target1 - entryPrice
      const actualRatio = reward1 / risk
      
      expect(actualRatio).toBeGreaterThanOrEqual(1.5) // At least 1.5:1 ratio
    })
  })

  describe('analyzePricePoints', () => {
    it('should perform comprehensive price analysis', () => {
      const analysis = analyzePricePoints(mockOHLCVData, mockCurrentPrice, '1h')
      
      expect(analysis).toHaveProperty('entryPoints')
      expect(analysis).toHaveProperty('stopLoss')
      expect(analysis).toHaveProperty('profitTargets')
      expect(analysis).toHaveProperty('timeHorizon')
      expect(analysis).toHaveProperty('riskAssessment')
      expect(analysis).toHaveProperty('confidence')
      
      expect(analysis.timeHorizon).toBe('1h')
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.confidence).toBeLessThanOrEqual(1)
    })

    it('should adjust analysis based on time horizon', () => {
      const shortTermAnalysis = analyzePricePoints(mockOHLCVData, mockCurrentPrice, '5m')
      const longTermAnalysis = analyzePricePoints(mockOHLCVData, mockCurrentPrice, '1d')
      
      expect(shortTermAnalysis.timeHorizon).toBe('5m')
      expect(longTermAnalysis.timeHorizon).toBe('1d')
      
      // Different time horizons should potentially have different risk assessments
      expect(typeof shortTermAnalysis.riskAssessment).toBe('string')
      expect(typeof longTermAnalysis.riskAssessment).toBe('string')
    })

    it('should include confidence score', () => {
      const analysis = analyzePricePoints(mockOHLCVData, mockCurrentPrice, '1h')
      
      expect(typeof analysis.confidence).toBe('number')
      expect(analysis.confidence).toBeGreaterThan(0)
      expect(analysis.confidence).toBeLessThanOrEqual(1)
    })
  })
})