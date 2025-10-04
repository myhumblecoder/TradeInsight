import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePriceAnalysis } from '../usePriceAnalysis'
import type { OHLCV } from '../../utils/priceAnalysis'

describe('usePriceAnalysis - Simple Tests', () => {
  const mockOHLCVData: OHLCV[] = [
    {
      timestamp: 1000,
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      volume: 1000,
    },
    {
      timestamp: 2000,
      open: 102,
      high: 108,
      low: 100,
      close: 106,
      volume: 1200,
    },
    {
      timestamp: 3000,
      open: 106,
      high: 110,
      low: 104,
      close: 108,
      volume: 800,
    },
    {
      timestamp: 4000,
      open: 108,
      high: 112,
      low: 105,
      close: 107,
      volume: 900,
    },
    {
      timestamp: 5000,
      open: 107,
      high: 109,
      low: 103,
      close: 105,
      volume: 1100,
    },
  ]

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePriceAnalysis([], 0, '1h', false))

    expect(result.current.analysis).toBeNull()
    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.refresh).toBe('function')
  })

  it('should handle insufficient data', () => {
    const { result } = renderHook(() =>
      usePriceAnalysis([mockOHLCVData[0]], 105, '1h', true)
    )

    expect(result.current.analysis).toBeNull()
    expect(result.current.error).toBe('Insufficient data for analysis')
    expect(result.current.isAnalyzing).toBe(false)
  })

  it('should handle invalid price', () => {
    const { result } = renderHook(() =>
      usePriceAnalysis(mockOHLCVData, 0, '1h', true)
    )

    expect(result.current.analysis).toBeNull()
    expect(result.current.error).toBe('Invalid current price')
    expect(result.current.isAnalyzing).toBe(false)
  })

  it('should not analyze when disabled', () => {
    const { result } = renderHook(() =>
      usePriceAnalysis(mockOHLCVData, 105, '1h', false)
    )

    expect(result.current.analysis).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isAnalyzing).toBe(false)
  })

  it('should perform analysis with valid data', () => {
    const { result } = renderHook(() =>
      usePriceAnalysis(mockOHLCVData, 105, '1h', true)
    )

    // Analysis should complete and return results
    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.analysis).toBeDefined()

    if (result.current.analysis) {
      expect(result.current.analysis.timeHorizon).toBe('1h')
      expect(result.current.analysis.entryPoints).toBeDefined()
      expect(result.current.analysis.stopLoss).toBeDefined()
      expect(result.current.analysis.profitTargets).toBeDefined()
    }
  })
})
