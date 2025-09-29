import { useState, useEffect, useCallback, useRef } from 'react'
import { analyzePricePoints, type PriceAnalysis, type OHLCV } from '../utils/priceAnalysis'
import { type TimeInterval } from '../utils/timeIntervals'

interface UsePriceAnalysisReturn {
  analysis: PriceAnalysis | null
  isAnalyzing: boolean
  error: string | null
  refresh: () => void
}

export function usePriceAnalysis(
  data: OHLCV[], 
  currentPrice: number, 
  timeframe: TimeInterval,
  enabled: boolean = true
): UsePriceAnalysisReturn {
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  
  const performAnalysis = useCallback(() => {
    if (!enabled) return
    
    // Check for minimum data requirements
    if (!data || data.length < 5) {
      setAnalysis(null)
      setError('Insufficient data for analysis')
      setIsAnalyzing(false)
      return
    }
    
    if (!currentPrice || currentPrice <= 0) {
      setAnalysis(null)
      setError('Invalid current price')
      setIsAnalyzing(false)
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const result = analyzePricePoints(data, currentPrice, timeframe)
      setAnalysis(result)
    } catch (err) {
      console.error('Price analysis failed:', err)
      setAnalysis(null)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [data, currentPrice, timeframe, enabled])
  
  const debouncedAnalysis = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    debounceTimer.current = setTimeout(() => {
      performAnalysis()
    }, 300) // 300ms debounce
  }, [performAnalysis])
  
  // Trigger analysis when dependencies change
  useEffect(() => {
    if (!enabled) {
      setAnalysis(null)
      setError(null)
      setIsAnalyzing(false)
      return
    }
    
    // Handle error conditions immediately without debouncing
    if (!data || data.length < 5) {
      setAnalysis(null)
      setError('Insufficient data for analysis')
      setIsAnalyzing(false)
      return
    }
    
    if (!currentPrice || currentPrice <= 0) {
      setAnalysis(null)
      setError('Invalid current price')
      setIsAnalyzing(false)
      return
    }
    
    // Use debounced analysis for valid conditions
    debouncedAnalysis()
    
    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [data, currentPrice, enabled, debouncedAnalysis])
  
  const refresh = useCallback(() => {
    performAnalysis()
  }, [performAnalysis])
  
  return {
    analysis,
    isAnalyzing,
    error,
    refresh
  }
}