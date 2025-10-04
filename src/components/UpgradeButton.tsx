import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  createCheckoutSession,
  redirectToCheckout,
  PRICE_IDS,
} from '../services/stripe'

interface UpgradeButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  className = '',
  size = 'md',
  variant = 'primary',
}) => {
  const { user, isAuthenticated, login } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
  }

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      await login()
      return
    }

    if (!user) return

    setIsProcessing(true)
    setError(null)

    try {
      const sessionId = await createCheckoutSession({
        priceId: PRICE_IDS.MONTHLY,
        userId: user.id,
        userEmail: user.email,
      })

      await redirectToCheckout(sessionId)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Checkout error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const hasActiveSubscription = user?.subscription?.status === 'active'

  if (hasActiveSubscription) {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Premium Active
          </span>
        </div>
        <button
          onClick={() =>
            window.open(
              'https://billing.stripe.com/p/login/test_00000000000000',
              '_blank'
            )
          }
          className={`${sizeClasses[size]} ${variantClasses.secondary} font-medium rounded-lg transition-colors duration-200 ${className}`}
        >
          Manage Subscription
        </button>
      </div>
    )
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="text-center mb-3">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          $9.99/month
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cancel anytime
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
          Error: {error}
        </div>
      )}

      <button
        onClick={handleUpgrade}
        disabled={isProcessing}
        className={`${sizeClasses[size]} ${variantClasses[variant]} font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Processing...</span>
          </div>
        ) : !isAuthenticated ? (
          'Sign In to Upgrade'
        ) : (
          'Upgrade to Premium'
        )}
      </button>

      {!hasActiveSubscription && (
        <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400 text-center">
          <div className="flex items-center justify-center">
            <svg
              className="w-3 h-3 text-green-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            AI-powered analysis
          </div>
          <div className="flex items-center justify-center">
            <svg
              className="w-3 h-3 text-green-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Advanced indicators
          </div>
          <div className="flex items-center justify-center">
            <svg
              className="w-3 h-3 text-green-500 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Export capabilities
          </div>
        </div>
      )}
    </div>
  )
}
