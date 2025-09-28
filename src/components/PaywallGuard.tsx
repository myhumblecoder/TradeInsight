import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface PaywallGuardProps {
  children: React.ReactNode
  feature: 'basic_analysis' | 'premium_analysis' | 'advanced_indicators' | 'export_data'
}

const PREMIUM_FEATURES = new Set(['premium_analysis', 'advanced_indicators', 'export_data'])

export const PaywallGuard: React.FC<PaywallGuardProps> = ({ children, feature }) => {
  const { user, isAuthenticated, isLoading, login } = useAuth()
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    )
  }

  const requiresSubscription = PREMIUM_FEATURES.has(feature)

  if (!requiresSubscription) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center border border-blue-200 dark:border-gray-700">
        <div className="mb-4">
          <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Sign in to access premium features
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get AI-powered market analysis and advanced technical indicators
        </p>
        <button
          onClick={login}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Sign In
        </button>
      </div>
    )
  }

  const hasActiveSubscription = user?.subscription?.status === 'active'

  if (!hasActiveSubscription) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center border border-amber-200 dark:border-gray-700">
        <div className="mb-4">
          <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Upgrade to Premium
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Unlock AI-enhanced market analysis and advanced features
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-amber-200 dark:border-gray-600">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">$9.99/month</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Cancel anytime</div>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            AI-powered market analysis
          </div>
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Advanced technical indicators
          </div>
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Export data functionality
          </div>
        </div>
        <button
          onClick={() => {
            window.open('/upgrade', '_blank')
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
        >
          Upgrade Now
        </button>
      </div>
    )
  }

  return <>{children}</>
}