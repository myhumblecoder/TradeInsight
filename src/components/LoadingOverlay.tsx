interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export function LoadingOverlay({ isVisible, message = "Loading..." }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 mx-4 max-w-sm w-full transform scale-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 flex-shrink-0"></div>
          <div className="text-gray-700 dark:text-gray-300 font-medium">{message}</div>
        </div>
      </div>
    </div>
  )
}