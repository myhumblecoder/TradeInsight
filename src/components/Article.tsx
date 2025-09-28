interface ArticleProps {
  text: string
  confidence: number
}

export const Article = ({ text, confidence }: ArticleProps) => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Market Analysis
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{text}</p>
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        Confidence Score: {confidence}%
      </p>
    </div>
  )
}