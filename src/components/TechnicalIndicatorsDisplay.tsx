import { useMemo } from 'react'
import { type OHLCV } from '../utils/priceAnalysis'
import { analyzeIndicators } from '../utils/indicators'
import { calculateFibonacciExtensions } from '../utils/advancedIndicators'

interface TechnicalIndicatorsDisplayProps {
  ohlcvData: OHLCV[]
  currentPrice: number
  isLoading?: boolean
  className?: string
}

export function TechnicalIndicatorsDisplay({
  ohlcvData,
  currentPrice,
  isLoading = false,
  className = ''
}: TechnicalIndicatorsDisplayProps) {
  const analysis = useMemo(() => {
    if (!ohlcvData || ohlcvData.length === 0) return null
    return analyzeIndicators(ohlcvData)
  }, [ohlcvData])

  const fibonacciExtensions = useMemo(() => {
    if (!ohlcvData || ohlcvData.length < 20) return null
    
    const recentData = ohlcvData.slice(-20)
    const high = Math.max(...recentData.map(d => d.high))
    const low = Math.min(...recentData.map(d => d.low))
    
    return calculateFibonacciExtensions(high, low, currentPrice)
  }, [ohlcvData, currentPrice])

  const formatValue = (value: number | null | undefined, decimals: number = 2): string => {
    return (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)) 
      ? value.toFixed(decimals) 
      : 'N/A'
  }

  const formatPrice = (value: number | null | undefined): string => {
    return (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value)) 
      ? `$${value.toFixed(2)}` 
      : 'N/A'
  }

  const getSignalColor = (signal: string): string => {
    switch (signal) {
      case 'bullish': return 'text-green-600 dark:text-green-400'
      case 'bearish': return 'text-red-600 dark:text-red-400'
      case 'overbought': return 'text-orange-600 dark:text-orange-400'
      case 'oversold': return 'text-blue-600 dark:text-blue-400'
      case 'squeeze': return 'text-purple-600 dark:text-purple-400'
      case 'expansion': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSignalBadge = (signal: string): string => {
    switch (signal) {
      case 'bullish': return '📈 Bullish'
      case 'bearish': return '📉 Bearish'
      case 'overbought': return '🔥 Overbought'
      case 'oversold': return '❄️ Oversold'
      case 'squeeze': return '🔒 Squeeze'
      case 'expansion': return '💥 Expansion'
      default: return '➖ Neutral'
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Indicators</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Indicators</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>Insufficient data for technical analysis</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technical Indicators</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSignalColor(analysis?.signals?.overall || 'neutral')}`}>
          {getSignalBadge(analysis?.signals?.overall || 'neutral')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Indicators */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Basic Indicators</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</span>
              <div className="text-right">
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatValue(analysis?.rsi)}
                </span>
                <div className={`text-xs ${getSignalColor(analysis?.signals?.rsi || 'neutral')}`}>
                  {getSignalBadge(analysis?.signals?.rsi || 'neutral')}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">EMA 12</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPrice(analysis?.ema12)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">EMA 26</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPrice(analysis?.ema26)}
              </span>
            </div>

            {analysis?.macd && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MACD</span>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatValue(analysis?.macd?.MACD, 4)}
                    </span>
                    <div className={`text-xs ${getSignalColor(analysis?.signals?.macd || 'neutral')}`}>
                      {getSignalBadge(analysis?.signals?.macd || 'neutral')}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MACD Signal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatValue(analysis?.macd?.signal, 4)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">MACD Histogram</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatValue(analysis?.macd?.histogram, 4)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Advanced Indicators */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Advanced Indicators</h4>
          
          <div className="space-y-3">
            {/* Bollinger Bands */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bollinger Upper</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis?.bollingerBands?.upper)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bollinger Middle</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis?.bollingerBands?.middle)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bollinger Lower</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(analysis?.bollingerBands?.lower)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">BB Bandwidth</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatValue(analysis?.bollingerBands?.bandwidth, 3)}
                  </span>
                  <div className={`text-xs ${getSignalColor(analysis?.signals?.bollinger || 'neutral')}`}>
                    {getSignalBadge(analysis?.signals?.bollinger || 'neutral')}
                  </div>
                </div>
              </div>
            </div>

            {/* Stochastic RSI */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Stoch RSI K</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatValue(analysis.stochasticRSI?.k || analysis.stochasticRSI?.K)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Stoch RSI D</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatValue(analysis.stochasticRSI?.d || analysis.stochasticRSI?.D)}
                  </span>
                  <div className={`text-xs ${getSignalColor(analysis.signals?.stochRSI || 'neutral')}`}>
                    {getSignalBadge(analysis.signals?.stochRSI || 'neutral')}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Profile */}
            {analysis?.volumeProfile && analysis?.volumeProfile?.levels?.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Volume POC</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(analysis?.volumeProfile?.poc)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Value Area High</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(analysis?.volumeProfile?.valueAreaHigh)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Value Area Low</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(analysis?.volumeProfile?.valueAreaLow)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fibonacci Extensions */}
      {fibonacciExtensions && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Fibonacci Extensions</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fibonacciExtensions.targets.map((target, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">{target.level}</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(target.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}