import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'

interface EmailPasswordAuthProps {
  onComplete?: () => void
}

const EmailPasswordAuth: React.FC<EmailPasswordAuthProps> = ({
  onComplete,
}) => {
  const { signInWithEmail, signUpWithEmail, isLoading } = useAuth()
  const { isDark } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Email and password are required')
      return false
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (isSignUp && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      return false
    }

    return true
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      if (isSignUp) {
        if (signUpWithEmail) {
          await signUpWithEmail(email, password, displayName || undefined)
          console.log('Account created successfully!')
          onComplete?.()
        } else {
          throw new Error('Email sign-up is not available')
        }
      } else {
        if (signInWithEmail) {
          await signInWithEmail(email, password)
          console.log('Signed in successfully!')
          onComplete?.()
        } else {
          throw new Error('Email sign-in is not available')
        }
      }

      // Clear form on success
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setDisplayName('')
    } catch (err) {
      console.error('Email authentication failed', err)
      // Extract a user-friendly error message
      let errorMessage = 'Authentication failed'
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          errorMessage = 'An account with this email already exists'
        } else if (err.message.includes('weak-password')) {
          errorMessage = 'Password is too weak'
        } else if (err.message.includes('invalid-email')) {
          errorMessage = 'Invalid email address'
        } else if (err.message.includes('user-not-found')) {
          errorMessage = 'No account found with this email'
        } else if (err.message.includes('wrong-password')) {
          errorMessage = 'Incorrect password'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setPassword('')
    setConfirmPassword('')
  }

  if (isLoading) {
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          className={`mt-6 text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Welcome to MyHumbleCrypto
        </h2>
        <p
          className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
        >
          {isSignUp
            ? 'Create your account to get started'
            : 'Sign in to your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className={`py-8 px-4 shadow sm:rounded-lg sm:px-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          {error && (
            <div
              className={`mb-4 rounded-md p-4 ${isDark ? 'bg-red-900/50' : 'bg-red-50'}`}
              data-testid="error-message"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className={`h-5 w-5 ${isDark ? 'text-red-300' : 'text-red-400'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${isDark ? 'text-red-200' : 'text-red-800'}`}
                  >
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            {isSignUp && (
              <div>
                <label
                  htmlFor="displayName"
                  className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Display Name (optional)
                </label>
                <div className="mt-1">
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    data-testid="display-name-input"
                    className={`appearance-none block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    placeholder="Your display name"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="email-input"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="password-input"
                  className={`appearance-none block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  placeholder={
                    isSignUp
                      ? 'At least 8 characters with upper, lower, and number'
                      : 'Your password'
                  }
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="confirm-password-input"
                    className={`appearance-none block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                data-testid="submit-button"
                className="w-full flex justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : isSignUp ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                data-testid="toggle-mode-button"
                className={`font-medium transition duration-200 hover:opacity-80 bg-transparent border-none p-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailPasswordAuth
