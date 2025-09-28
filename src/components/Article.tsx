interface ArticleProps {
  text: string
  confidence: number
}

export const Article = ({ text, confidence }: ArticleProps) => {
  return (
    <div className="w-full max-w-none mx-0 p-4 sm:max-w-sm sm:mx-auto sm:p-5 md:max-w-none md:mx-0 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Market Analysis
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4 text-base sm:text-lg leading-relaxed">{text}</p>
      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
        Confidence Score: {confidence}%
      </p>
    </div>
  )
}