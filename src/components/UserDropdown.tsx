import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'

export function UserDropdown() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm transition-colors rounded-md px-2 py-1 border-0 ${
          isDark
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700 bg-transparent'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent'
        }`}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
      >
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}
          >
            Verified
          </span>
        </div>
        {user.email && (
          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
            {user.email}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-opacity-5 border z-50 ${
            isDark
              ? 'bg-gray-800 ring-gray-600 ring-opacity-25 border-gray-700'
              : 'bg-white ring-black ring-opacity-5 border-gray-200'
          }`}
        >
          <div className="py-1">
            <div
              className={`px-4 py-2 text-sm border-b ${
                isDark
                  ? 'text-gray-200 border-gray-600'
                  : 'text-gray-700 border-gray-100'
              }`}
            >
              <div className="font-medium">{user.name || 'User'}</div>
              <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {user.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                isDark
                  ? 'text-white bg-blue-600 hover:bg-blue-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
