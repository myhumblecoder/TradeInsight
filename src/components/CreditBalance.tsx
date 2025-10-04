import React from 'react'
import { useCredits } from '../hooks/useCredits'

interface CreditBalanceProps {
  className?: string
  showDetails?: boolean
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  className = '',
  showDetails = false,
}) => {
  const { credits, isLoading, error } = useCredits()

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Error loading credits
      </div>
    )
  }

  const balance = credits?.balance || 0
  const isLow = balance < 5

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <svg
          className={`w-5 h-5 ${isLow ? 'text-orange-500' : 'text-blue-500'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
        <span
          className={`font-medium ${isLow ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}
        >
          {balance} credits
        </span>
      </div>

      {isLow && (
        <span className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
          Low
        </span>
      )}

      {showDetails && credits && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Used: {credits.totalUsed} | Purchased: {credits.totalPurchased}
        </div>
      )}
    </div>
  )
}
