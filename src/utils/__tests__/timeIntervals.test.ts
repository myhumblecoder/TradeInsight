import { describe, it, expect } from 'vitest'
import { TimeInterval, getTimeIntervalConfig, formatTimeInterval, getGranularityFromInterval } from '../timeIntervals'

describe('Time Intervals Utils', () => {
  describe('getTimeIntervalConfig', () => {
    it('should return correct config for all supported intervals', () => {
      const intervals: TimeInterval[] = ['5m', '15m', '30m', '1h', '4h', '1d', '1w']
      
      intervals.forEach(interval => {
        const config = getTimeIntervalConfig(interval)
        expect(config).toBeDefined()
        expect(config.label).toBeDefined()
        expect(config.seconds).toBeGreaterThan(0)
        expect(config.category).toMatch(/^(Short-term|Medium-term|Long-term)$/)
      })
    })

    it('should throw error for unsupported interval', () => {
      expect(() => getTimeIntervalConfig('invalid' as TimeInterval)).toThrow('Unsupported time interval')
    })

    it('should return correct seconds for each interval', () => {
      expect(getTimeIntervalConfig('5m').seconds).toBe(300)
      expect(getTimeIntervalConfig('15m').seconds).toBe(900)
      expect(getTimeIntervalConfig('30m').seconds).toBe(1800)
      expect(getTimeIntervalConfig('1h').seconds).toBe(3600)
      expect(getTimeIntervalConfig('4h').seconds).toBe(14400)
      expect(getTimeIntervalConfig('1d').seconds).toBe(86400)
      expect(getTimeIntervalConfig('1w').seconds).toBe(604800)
    })

    it('should categorize intervals correctly', () => {
      expect(getTimeIntervalConfig('5m').category).toBe('Short-term')
      expect(getTimeIntervalConfig('15m').category).toBe('Short-term')
      expect(getTimeIntervalConfig('30m').category).toBe('Medium-term')
      expect(getTimeIntervalConfig('1h').category).toBe('Medium-term')
      expect(getTimeIntervalConfig('4h').category).toBe('Medium-term')
      expect(getTimeIntervalConfig('1d').category).toBe('Long-term')
      expect(getTimeIntervalConfig('1w').category).toBe('Long-term')
    })
  })

  describe('formatTimeInterval', () => {
    it('should format intervals with readable labels', () => {
      expect(formatTimeInterval('5m')).toBe('5 Minutes')
      expect(formatTimeInterval('15m')).toBe('15 Minutes')
      expect(formatTimeInterval('30m')).toBe('30 Minutes')
      expect(formatTimeInterval('1h')).toBe('1 Hour')
      expect(formatTimeInterval('4h')).toBe('4 Hours')
      expect(formatTimeInterval('1d')).toBe('1 Day')
      expect(formatTimeInterval('1w')).toBe('1 Week')
    })
  })

  describe('getGranularityFromInterval', () => {
    it('should return correct granularity seconds', () => {
      expect(getGranularityFromInterval('5m')).toBe(300)
      expect(getGranularityFromInterval('15m')).toBe(900)
      expect(getGranularityFromInterval('30m')).toBe(1800)
      expect(getGranularityFromInterval('1h')).toBe(3600)
      expect(getGranularityFromInterval('4h')).toBe(14400)
      expect(getGranularityFromInterval('1d')).toBe(86400)
      expect(getGranularityFromInterval('1w')).toBe(604800)
    })
  })
})