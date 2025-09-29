import { useMemo } from 'react'
import { type OHLCV } from '../utils/priceAnalysis'
import { analyzeIndicators } from '../utils/indicators'
import { usePriceAnalysis } from '../hooks/usePriceAnalysis'
import { getTimeIntervalConfig, type TimeInterval } from '../utils/timeIntervals'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MarketAnalysisSummaryProps {
  ohlcvData: OHLCV[]
  currentPrice: number
  timeframe: TimeInterval
  cryptoName: string
  className?: string
  llmAnalysis?: string | null // Optional markdown content from LLM
  showLLMSection?: boolean
  llmAnalysisLoading?: boolean // Loading state for LLM section
}

interface OverallSentiment {
  direction: 'bullish' | 'bearish' | 'neutral'
  strength: 'strong' | 'moderate' | 'weak'
  confidence: number
  signals: string[]
}

export function MarketAnalysisSummary({
  ohlcvData,
  currentPrice,
  timeframe,
  cryptoName,
  className = '',
  llmAnalysis = null,
  showLLMSection = false,
  llmAnalysisLoading = false
}: MarketAnalysisSummaryProps) {
  const { analysis: priceAnalysis, isAnalyzing: isPriceAnalyzing } = usePriceAnalysis(
    ohlcvData,
    currentPrice,
    timeframe,
    ohlcvData.length > 0 && currentPrice > 0
  )

  const indicatorAnalysis = useMemo(() => {
    if (ohlcvData.length === 0) return null
    return analyzeIndicators(ohlcvData)
  }, [ohlcvData])

  const overallSentiment = useMemo((): OverallSentiment => {
    if (!indicatorAnalysis || !priceAnalysis) {
      return {
        direction: 'neutral',
        strength: 'weak',
        confidence: 0,
        signals: ['Insufficient data for analysis']
      }
    }

    const signals: string[] = []
    let bullishCount = 0
    let bearishCount = 0
    let totalConfidence = 0

    // Analyze technical indicators
    if (indicatorAnalysis.signals.rsi === 'overbought') {
      signals.push('RSI indicates overbought conditions')
      bearishCount++
    } else if (indicatorAnalysis.signals.rsi === 'oversold') {
      signals.push('RSI indicates oversold conditions')
      bullishCount++
    }

    if (indicatorAnalysis.signals.macd === 'bullish') {
      signals.push('MACD shows bullish momentum')
      bullishCount++
    } else if (indicatorAnalysis.signals.macd === 'bearish') {
      signals.push('MACD shows bearish momentum')
      bearishCount++
    }

    if (indicatorAnalysis.signals.bollinger === 'squeeze') {
      signals.push('Bollinger Bands indicate low volatility (potential breakout)')
    } else if (indicatorAnalysis.signals.bollinger === 'expansion') {
      signals.push('Bollinger Bands show high volatility')
    }

    if (indicatorAnalysis.signals.stochRSI === 'bullish') {
      signals.push('Stochastic RSI suggests bullish momentum')
      bullishCount++
    } else if (indicatorAnalysis.signals.stochRSI === 'bearish') {
      signals.push('Stochastic RSI suggests bearish momentum')
      bearishCount++
    }

    // Analyze price levels
    if (priceAnalysis.confidence > 0.7) {
      signals.push('High-confidence price analysis available')
      totalConfidence += 0.3
    }

    if (currentPrice < priceAnalysis.entryPoints.conservative) {
      signals.push('Price below conservative entry level')
      bullishCount++
    } else if (currentPrice > priceAnalysis.profitTargets.target1) {
      signals.push('Price above first profit target')
      bearishCount++
    }

    // Calculate overall sentiment
    const totalSignals = bullishCount + bearishCount
    let direction: OverallSentiment['direction'] = 'neutral'
    let strength: OverallSentiment['strength'] = 'weak'

    if (totalSignals > 0) {
      if (bullishCount > bearishCount) {
        direction = 'bullish'
      } else if (bearishCount > bullishCount) {
        direction = 'bearish'
      }

      const dominance = Math.abs(bullishCount - bearishCount) / totalSignals
      if (dominance > 0.6) strength = 'strong'
      else if (dominance > 0.3) strength = 'moderate'
    }

    // Calculate confidence
    const baseConfidence = Math.min(ohlcvData.length / 20, 1) * 0.4 // Data quality
    const analysisConfidence = priceAnalysis.confidence * 0.4
    const signalConfidence = Math.min(totalSignals / 5, 1) * 0.2 // Signal diversity
    totalConfidence = baseConfidence + analysisConfidence + signalConfidence

    if (signals.length === 0) {
      signals.push('No significant trading signals detected')
    }

    return {
      direction,
      strength,
      confidence: Math.round(totalConfidence * 100) / 100,
      signals: signals.slice(0, 5) // Limit to top 5 signals
    }
  }, [indicatorAnalysis, priceAnalysis, currentPrice, ohlcvData.length])

  const formatPrice = (price: number): string => `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const getSentimentColor = () => {
    switch (overallSentiment.direction) {
      case 'bullish': return 'text-green-600 dark:text-green-400'
      case 'bearish': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSentimentIcon = () => {
    switch (overallSentiment.direction) {
      case 'bullish':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        )
      case 'bearish':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  if (isPriceAnalyzing || !indicatorAnalysis) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const timeConfig = getTimeIntervalConfig(timeframe)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Market Analysis Summary
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {timeConfig.label} • {cryptoName}
        </div>
      </div>

      {/* Current Price & Overall Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(currentPrice)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Sentiment</div>
          <div className="flex items-center space-x-3">
            {getSentimentIcon()}
            <div>
              <div className={`text-lg font-semibold capitalize ${getSentimentColor()}`}>
                {overallSentiment.strength} {overallSentiment.direction}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(overallSentiment.confidence * 100)}% confidence
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Key Market Insights</h3>
        <div className="space-y-2">
          {overallSentiment.signals.map((signal, index) => (
            <div key={index} className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">{signal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {priceAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Entry (Moderate)</div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {formatPrice(priceAnalysis.entryPoints.moderate)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Stop Loss</div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatPrice(priceAnalysis.stopLoss.price)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Target 1</div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatPrice(priceAnalysis.profitTargets.target1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Risk:Reward</div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              1:{priceAnalysis.profitTargets.riskRewardRatio}
            </div>
          </div>
        </div>
      )}

      {/* LLM Analysis Section */}
      {showLLMSection && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V12a1 1 0 11-2 0v-1.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.277l1.246.855a1 1 0 01-.372 1.364l-1.75-1A.996.996 0 013 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a.996.996 0 01-.504.868l-1.75 1a1 1 0 01-.992-1.736L16 13.277V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364.372l.254.145V16a1 1 0 112 0v1.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
              </svg>
              AI Market Insights
            </h3>
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full">
              Enhanced Analysis
            </div>
          </div>
          
          {llmAnalysisLoading ? (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                  Generating Market Insights...
                </span>
              </div>
            </div>
          ) : llmAnalysis ? (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
              <MarkdownRenderer 
                content={llmAnalysis} 
                className="text-sm leading-relaxed"
              />
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enable AI Enhanced mode for deeper market insights
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Analysis Confidence</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(overallSentiment.confidence * 100, 100)}%` }}
              ></div>
            </div>
            <span className="text-gray-900 dark:text-white font-medium">
              {Math.round(overallSentiment.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}