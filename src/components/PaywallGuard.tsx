import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { BuyCreditButton } from './BuyCreditButton'

interface PaywallGuardProps {
  children: React.ReactNode
  requiredCredits?: number
  blurLevel?: 'light' | 'medium' | 'heavy'
  featureName: string
  coinSymbol?: string
  showPreview?: boolean
  className?: string
}

export const PaywallGuard: React.FC<PaywallGuardProps> = ({
  children,
  requiredCredits = 1,
  blurLevel = 'medium',
  featureName,
  coinSymbol,
  showPreview = true,
  className = ''
}) => {
  const { isAuthenticated } = useAuth()
  const { hasCredits } = useCredits()

  const canAccess = isAuthenticated && hasCredits(requiredCredits)

  // If user has access, show content normally
  if (canAccess) {
    return <div className={className}>{children}</div>
  }

  // Blur class mapping
  const blurClasses = {
    light: 'blur-sm',
    medium: 'blur-md',
    heavy: 'blur-lg'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content preview */}
      {showPreview && (
        <div
          className={`${blurClasses[blurLevel]} select-none pointer-events-none`}
          style={{ filter: `blur(${blurLevel === 'light' ? '2px' : blurLevel === 'medium' ? '4px' : '8px'})` }}
        >
          {children}
        </div>
      )}

      {/* Overlay with unlock prompt */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <div className="text-center p-6 max-w-sm">
          {/* Lock icon */}
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Content */}
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
            Unlock {featureName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {coinSymbol
              ? `Get detailed ${featureName.toLowerCase()} for ${coinSymbol}`
              : `Access premium ${featureName.toLowerCase()}`
            }
          </p>

          {/* Pricing */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              $0.25
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {requiredCredits} credit{requiredCredits > 1 ? 's' : ''}
            </div>
          </div>

          {/* Action button */}
          <BuyCreditButton
            size="md"
            requiredCredits={requiredCredits}
            coinSymbol={coinSymbol}
            className="w-full"
            onPurchaseComplete={() => window.location.reload()}
          />

          {/* Features preview */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Real-time data</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Pay per analysis</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No subscription</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}