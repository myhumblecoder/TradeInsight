import { MarkdownRenderer } from './MarkdownRenderer'

interface ArticleProps {
  text: string
  confidence: number
  isEnhanced?: boolean
  showTitle?: boolean
  showAIBadge?: boolean
}

export const Article = ({ text, confidence, isEnhanced, showTitle = true, showAIBadge = true }: ArticleProps) => {
  // Check if text appears to be markdown (contains markdown indicators)
  const isMarkdown = isEnhanced && (
    text.includes('#') || 
    text.includes('**') || 
    text.includes('*') || 
    text.includes('- ') ||
    text.includes('1. ') ||
    text.includes('`') ||
    text.includes('>')
  )

  return (
    <div className="w-full max-w-none mx-0 p-0">
      {(showTitle || (isEnhanced && showAIBadge)) && (
        <div className="flex items-center justify-between mb-4">
          {showTitle && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Technical Analysis
            </h2>
          )}
          {isEnhanced && showAIBadge && (
            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
              AI Enhanced
            </span>
          )}
        </div>
      )}
      
      <div className="mb-4">
        {isMarkdown ? (
          <MarkdownRenderer 
            content={text} 
            className="text-sm leading-relaxed"
          />
        ) : (
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {text}
          </p>
        )}
      </div>
      
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Confidence Score: {confidence}%
          </p>
          <div className="relative group">
            <svg 
              className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-6 left-0 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="font-medium mb-2">Confidence Score Breakdown:</div>
              <div className="space-y-1 text-gray-300">
                <div>• Base Score: 50%</div>
                <div>• RSI Signal: +10% (strong overbought/oversold)</div>
                <div>• EMA Data: +15% (when available)</div>
                <div>• MACD Signal: +15% (when available)</div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
                Higher scores indicate more reliable signals based on multiple technical indicators.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}