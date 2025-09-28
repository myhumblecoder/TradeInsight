import React, { useState, useEffect } from 'react'

interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  timestamp: number
}

const CONSENT_EXPIRY_DAYS = 30
const STORAGE_KEY = 'cookie-consent'

export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [consent, setConsent] = useState<Omit<CookieConsent, 'timestamp'>>({
    necessary: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    const savedConsent = localStorage.getItem(STORAGE_KEY)
    if (savedConsent) {
      try {
        const parsed: CookieConsent = JSON.parse(savedConsent)
        const isExpired = Date.now() - parsed.timestamp > CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        
        if (!isExpired) {
          setShowBanner(false)
          return
        }
      } catch (error) {
        console.error('Error parsing saved consent:', error)
      }
    }
    
    setShowBanner(true)
  }, [])

  const saveConsent = (consentData: Omit<CookieConsent, 'timestamp'>) => {
    const consentWithTimestamp: CookieConsent = {
      ...consentData,
      timestamp: Date.now()
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentWithTimestamp))
    
    if (consentData.analytics && typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
    
    if (consentData.marketing && typeof gtag === 'function') {
      gtag('consent', 'update', {
        ad_storage: 'granted'
      })
    }
    
    setShowBanner(false)
    setShowPreferences(false)
  }

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true
    })
  }

  const handleSavePreferences = () => {
    saveConsent(consent)
  }

  const handleOpenPreferences = () => {
    setShowPreferences(true)
  }

  const handleClosePreferences = () => {
    setShowPreferences(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We use cookies to improve your experience, analyze site usage, and assist with marketing efforts. 
                By continuing to use our site, you consent to our use of cookies.
              </p>
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more in our Privacy Policy
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleOpenPreferences}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Manage Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cookie Preferences
                </h2>
                <button
                  onClick={handleClosePreferences}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">Necessary Cookies</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Necessary cookies are required for basic site functionality
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={true}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">Analytics Cookies</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <label htmlFor="analytics-cookies">
                          Analytics cookies help us understand how you use our site
                        </label>
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        id="analytics-cookies"
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">Marketing Cookies</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <label htmlFor="marketing-cookies">
                          Marketing cookies help us show relevant ads and measure campaign effectiveness
                        </label>
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        id="marketing-cookies"
                        type="checkbox"
                        checked={consent.marketing}
                        onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={handleClosePreferences}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

declare global {
  function gtag(...args: unknown[]): void
}