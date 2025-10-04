import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'

interface BuyCreditButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  requiredCredits?: number
  coinSymbol?: string
  onPurchaseComplete?: () => void
}

export const BuyCreditButton: React.FC<BuyCreditButtonProps> = ({
  className = '',
  size = 'md',
  variant = 'primary',
  requiredCredits = 1,
  coinSymbol,
  onPurchaseComplete,
}) => {
  const { isAuthenticated, login } = useAuth()
  const { purchaseCredits } = useCredits()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPackages, setShowPackages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white',
    secondary:
      'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700',
  }

  const handleClick = async () => {
    if (!isAuthenticated) {
      await login()
      return
    }

    setShowPackages(true)
  }

  const handlePurchase = async (packageType: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const success = await purchaseCredits(packageType)
      if (success) {
        setShowPackages(false)
        onPurchaseComplete?.()
      } else {
        setError('Failed to purchase credits')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className={`text-center ${className}`}>
        {coinSymbol && (
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Unlock {coinSymbol} Analysis
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {requiredCredits} credit{requiredCredits > 1 ? 's' : ''} required
              • $0.25 each
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={isProcessing}
          className={`${sizeClasses[size]} ${variantClasses[variant]} font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${className}`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span>Processing...</span>
            </div>
          ) : !isAuthenticated ? (
            'Sign In to Buy Credits'
          ) : (
            'Buy Credits'
          )}
        </button>

        {/* Features list */}
        {!coinSymbol && (
          <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-3 h-3 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Pay with crypto</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-3 h-3 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Instant activation</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-3 h-3 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No subscription</span>
            </div>
          </div>
        )}
      </div>

      {/* Credit Packages Modal */}
      {showPackages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Choose Credit Package
              </h3>
              <button
                onClick={() => setShowPackages(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Starter Package */}
              <div
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => handlePurchase('starter')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Starter
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      20 credits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      $5.00
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      $0.25 per credit
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular Package */}
              <div
                className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors relative"
                onClick={() => handlePurchase('popular')}
              >
                <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  POPULAR
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Popular
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      40 + 10 bonus = 50 credits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      $10.00
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      $0.20 per credit
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Package */}
              <div
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => handlePurchase('premium')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Premium
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      80 + 20 bonus = 100 credits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      $20.00
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      $0.20 per credit
                    </div>
                  </div>
                </div>
              </div>

              {/* Whale Package */}
              <div
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => handlePurchase('whale')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Whale
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      200 + 50 bonus = 250 credits
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      $50.00
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      $0.20 per credit
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Secure crypto payments • Instant delivery • No subscription
            </div>
          </div>
        </div>
      )}
    </>
  )
}
