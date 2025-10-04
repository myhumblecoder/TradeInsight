import React, { useState, useEffect } from 'react'
import EmailPasswordAuth from './EmailPasswordAuth'
import { useTheme } from '../contexts/ThemeContext'

interface OnDemandAuthProps {
  onComplete: () => void
  onCancel?: () => void
  showBackButton?: boolean
}

const OnDemandAuth: React.FC<OnDemandAuthProps> = ({
  onComplete,
  onCancel,
  showBackButton = true,
}) => {
  const [showSpinner, setShowSpinner] = useState(true)
  const { isDark } = useTheme()

  useEffect(() => {
    // Show spinner for 3 seconds
    const timer = setTimeout(() => {
      setShowSpinner(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (showSpinner) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {showBackButton && onCancel && (
        <div className="absolute top-4 left-4">
          <button
            onClick={onCancel}
            className={`text-2xl transition duration-200 hover:opacity-80 bg-transparent border-none p-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}
          >
            ←
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className={`mt-6 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Access Premium Content
        </h2>
        <p
          className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
        >
          Create an account to view detailed crypto analysis
        </p>
      </div>

      <div className="mt-8">
        <EmailPasswordAuth onComplete={onComplete} />
      </div>
    </div>
  )
}

export default OnDemandAuth
