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
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          Confidence Score: {confidence}%
        </p>
      </div>
    </div>
  )
}