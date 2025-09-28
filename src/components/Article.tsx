interface ArticleProps {
  text: string
  confidence: number
  isEnhanced?: boolean
}

export const Article = ({ text, confidence, isEnhanced }: ArticleProps) => {
  return (
    <div className="w-full max-w-none mx-0 p-4 sm:max-w-sm sm:mx-auto sm:p-5 md:max-w-none md:mx-0 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Market Analysis
        </h2>
        {isEnhanced && (
          <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
            AI Enhanced
          </span>
        )}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4 text-base sm:text-lg leading-relaxed">{text}</p>
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        Confidence Score: {confidence}%
      </p>
    </div>
  )
}