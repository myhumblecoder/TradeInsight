import { type PriceAnalysis } from '../utils/priceAnalysis'
import { Tooltip } from './Tooltip'

interface PriceAnalysisDisplayProps {
  analysis: PriceAnalysis | null
  isLoading?: boolean
  error?: string | null
  compact?: boolean
  className?: string
}

export function PriceAnalysisDisplay({
  analysis,
  isLoading = false,
  error = null,
  compact = false,
  className = ''
}: PriceAnalysisDisplayProps) {
  const baseClassName = `price-analysis-display rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${compact ? 'compact' : ''}`

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`
  }

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`
  }

  const PriceEntryWithTooltip = ({ 
    label, 
    price, 
    explanation, 
    colorClass 
  }: {
    label: string
    price: number
    explanation?: string
    colorClass: string
  }) => (
    <div className="flex justify-between items-center">
      <Tooltip content={explanation || 'No explanation available'} position="right">
        <span className={`${colorClass} flex-shrink-0 cursor-help flex items-center`}>
          {label}: {formatPrice(price)}
          <svg className="w-3 h-3 ml-1 opacity-60" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
      </Tooltip>
    </div>
  )

  // Loading state
  if (isLoading) {
    return (
      <div 
        data-testid="price-analysis-display" 
        className={`${baseClassName} ${className}`}
      >
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2"></div>
            <div className="text-sm">Analyzing price levels...</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div 
        data-testid="price-analysis-display" 
        className={`${baseClassName} ${className}`}
      >
        <div className="text-center text-red-500 py-8">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!analysis) {
    return (
      <div 
        data-testid="price-analysis-display" 
        className={`${baseClassName} ${className}`}
      >
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>Price analysis not available</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      data-testid="price-analysis-display" 
      className={`${baseClassName} ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Price Analysis
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Time Horizon: {analysis.timeHorizon}</span>
          <span>Confidence: {Math.round(analysis.confidence * 100)}%</span>
        </div>
      </div>

      <div className={`grid gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Entry Points */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Entry Points
          </h4>
          <div className="space-y-2">
            <PriceEntryWithTooltip
              label="Conservative"
              price={analysis.entryPoints.conservative}
              explanation={analysis.entryPoints.methods?.conservative}
              colorClass="text-green-600 dark:text-green-400"
            />
            <PriceEntryWithTooltip
              label="Moderate"
              price={analysis.entryPoints.moderate}
              explanation={analysis.entryPoints.methods?.moderate}
              colorClass="text-blue-600 dark:text-blue-400"
            />
            <PriceEntryWithTooltip
              label="Aggressive"
              price={analysis.entryPoints.aggressive}
              explanation={analysis.entryPoints.methods?.aggressive}
              colorClass="text-orange-600 dark:text-orange-400"
            />
          </div>
        </div>

        {/* Stop Loss */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Stop Loss
          </h4>
          <Tooltip content={analysis.stopLoss.explanation || 'Stop loss level calculated based on technical analysis'} position="right">
            <div className="text-red-600 dark:text-red-400 cursor-help flex items-center">
              {formatPrice(analysis.stopLoss.price)} ({formatPercentage(analysis.stopLoss.percentage)} below entry)
              <svg className="w-3 h-3 ml-1 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
          </Tooltip>
        </div>

        {/* Profit Targets */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            Profit Targets
          </h4>
          <div className="space-y-2">
            <PriceEntryWithTooltip
              label="Target 1"
              price={analysis.profitTargets.target1}
              explanation={analysis.profitTargets.methods?.target1}
              colorClass="text-green-600 dark:text-green-400"
            />
            <PriceEntryWithTooltip
              label="Target 2"
              price={analysis.profitTargets.target2}
              explanation={analysis.profitTargets.methods?.target2}
              colorClass="text-green-600 dark:text-green-400"
            />
            <PriceEntryWithTooltip
              label="Target 3"
              price={analysis.profitTargets.target3}
              explanation={analysis.profitTargets.methods?.target3}
              colorClass="text-green-600 dark:text-green-400"
            />
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Tooltip 
                content="For every $1 you risk, how much you could potentially gain. 1:2 = gain $2 for every $1 risked. Very high ratios indicate very tight stop losses." 
                position="right"
              >
                <span className="cursor-help flex items-center">
                  Risk-Reward: {
                    isNaN(analysis.profitTargets.riskRewardRatio) 
                      ? 'Unavailable' 
                      : analysis.profitTargets.riskRewardRatio > 50 
                        ? `1:${analysis.profitTargets.riskRewardRatio.toFixed(1)} (Very High)`
                        : `1:${analysis.profitTargets.riskRewardRatio}`
                  }
                  <svg className="w-3 h-3 ml-1 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Risk Assessment
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {analysis.riskAssessment}
          </div>
        </div>
      </div>

      {/* Confidence Indicator */}
      {!compact && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">Analysis Confidence:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">
                {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}