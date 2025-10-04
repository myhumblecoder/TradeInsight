import { Link, useParams } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useCoinbaseData } from '../hooks/useCoinbaseData'
import { calculateRSI, calculateEMA, calculateMACD } from '../utils/indicators'
import { generateArticle, generateLLMArticle } from '../utils/article'
import { Article } from './Article'
import { DarkModeToggle } from './DarkModeToggle'
import { UserDropdown } from './UserDropdown'
import { TimeIntervalSelector } from './TimeIntervalSelector'
import { PriceAnalysisDisplay } from './PriceAnalysisDisplay'
import { TechnicalIndicatorsDisplay } from './TechnicalIndicatorsDisplay'
import { MarketAnalysisSummary } from './MarketAnalysisSummary'
import { useTheme } from '../contexts/ThemeContext'
import {
  getGranularityFromInterval,
  type TimeInterval,
} from '../utils/timeIntervals'
import { usePriceAnalysis } from '../hooks/usePriceAnalysis'
import { usePageTransition } from '../hooks/usePageTransition'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { CreditBalance } from './CreditBalance'
import { BuyCreditButton } from './BuyCreditButton'
import OnDemandAuth from './OnDemandAuth'

// Map crypto IDs to display names
const cryptoDisplayNames: Record<string, string> = {
  bitcoin: 'Bitcoin',
  btc: 'Bitcoin',
  ethereum: 'Ethereum',
  xrp: 'XRP',
  ripple: 'XRP', // In case API returns 'ripple' as ID
  // Add more as needed
}

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const cryptoId = id || 'bitcoin'
  const { isDark, toggleDarkMode } = useTheme()
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1d')
  const granularity = getGranularityFromInterval(selectedInterval)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [enhancedMode, setEnhancedMode] = useState(false)
  // Auto-detect provider based on environment
  const [llmProvider] = useState<'ollama' | 'openai'>(() => {
    return import.meta.env.DEV ? 'ollama' : 'openai'
  })
  const [article, setArticle] = useState({ text: 'Loading...', confidence: 0 })
  const [marketInsights, setMarketInsights] = useState({
    text: 'Loading...',
    confidence: 0,
  })
  const [marketInsightsLoading, setMarketInsightsLoading] = useState(false)
  const [technicalReportLoading, setTechnicalReportLoading] = useState(false)
  const { price, candles, ohlcvData, error, loading } = useCoinbaseData(
    cryptoId,
    granularity,
    refreshTrigger
  )
  const { isTransitioning } = usePageTransition()

  const cryptoName =
    cryptoDisplayNames[cryptoId] ||
    cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1)

  // Auth and Credits
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { hasCredits } = useCredits()
  const [showAuthFlow, setShowAuthFlow] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)

  // Price analysis for enhanced analysis
  const {
    analysis: priceAnalysis,
    isAnalyzing: isPriceAnalyzing,
    error: priceAnalysisError,
  } = usePriceAnalysis(
    ohlcvData,
    price || 0,
    selectedInterval,
    Boolean(price && ohlcvData.length > 0)
  )

  const indicators = useMemo(() => {
    if (!candles || !Array.isArray(candles) || candles.length === 0) return null

    const closes = candles.map((candle: number[]) => candle[4]) // Close prices

    return {
      rsi: calculateRSI(closes),
      ema12: calculateEMA(closes, 12).pop() || null,
      ema26: calculateEMA(closes, 26).pop() || null,
      macd: calculateMACD(closes),
    }
  }, [candles])

  // Generate both market insights and technical analysis when data or mode changes
  useEffect(() => {
    const generateAnalysisAsync = async () => {
      if (!price || !indicators) {
        setArticle({ text: 'Loading data...', confidence: 0 })
        setMarketInsights({ text: 'Loading data...', confidence: 0 })
        setMarketInsightsLoading(false)
        setTechnicalReportLoading(false)
        return
      }

      try {
        const data = {
          price,
          rsi: indicators.rsi,
          ema12: indicators.ema12,
          ema26: indicators.ema26,
          macd: indicators.macd,
          cryptoName,
          // Include price analysis data if available
          priceAnalysis: priceAnalysis
            ? {
                entryPoints: priceAnalysis.entryPoints,
                stopLoss: priceAnalysis.stopLoss,
                profitTargets: priceAnalysis.profitTargets,
                timeHorizon: priceAnalysis.timeHorizon,
                riskAssessment: priceAnalysis.riskAssessment,
                confidence: priceAnalysis.confidence,
              }
            : null,
          timeframe: selectedInterval,
        }

        if (enhancedMode) {
          // Step 1: Generate market insights first (faster, more important for immediate decisions)
          setMarketInsightsLoading(true)
          const marketInsightsResult = await generateLLMArticle(
            data,
            true,
            llmProvider,
            'market-insights'
          )
          setMarketInsights(marketInsightsResult)
          setMarketInsightsLoading(false)

          // Step 2: Generate technical report
          setTechnicalReportLoading(true)
          const technicalReport = await generateLLMArticle(
            data,
            true,
            llmProvider,
            'technical-report'
          )
          setArticle(technicalReport)
          setTechnicalReportLoading(false)
        } else {
          // Use template analysis for both
          const templateResult = generateArticle(data)
          setArticle(templateResult)
          setMarketInsights(templateResult)
        }
      } catch (error) {
        console.error('Analysis generation failed:', error)
        // Fallback to template analysis
        const data = {
          price,
          rsi: indicators.rsi,
          ema12: indicators.ema12,
          ema26: indicators.ema26,
          macd: indicators.macd,
          cryptoName,
        }
        const fallbackResult = generateArticle(data)
        setArticle(fallbackResult)
        setMarketInsights(fallbackResult)
      } finally {
        setMarketInsightsLoading(false)
        setTechnicalReportLoading(false)
      }
    }

    generateAnalysisAsync()
  }, [
    price,
    indicators,
    cryptoName,
    enhancedMode,
    llmProvider,
    priceAnalysis,
    selectedInterval,
  ])

  // For data loading within the page, just show the layout with loading placeholders
  // Navigation loading is handled by the global overlay
  if (error)
    return (
      <div
        className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors page-container ${isTransitioning ? 'transitioning' : ''}`}
      >
        <header className="flex items-center justify-between px-2 sm:px-4 lg:px-6 xl:px-8 py-4 bg-white dark:bg-gray-800 shadow">
          <Link to="/" className="text-blue-500 hover:underline text-2xl">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
            {cryptoName}
          </h1>
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </header>
        <main className="px-2 py-4 sm:px-4 lg:px-6 xl:px-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-red-500">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>{error}</div>
          </div>
        </main>
      </div>
    )

  // If authentication is still initializing, show a small loader
  if (authLoading) {
    return (
      <div
        className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors page-container ${isTransitioning ? 'transitioning' : ''}`}
      >
        <header className="flex items-center justify-between px-2 sm:px-4 lg:px-6 xl:px-8 py-4 bg-white dark:bg-gray-800 shadow">
          <Link to="/" className="text-blue-500 hover:underline text-2xl">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
            {cryptoName}
          </h1>
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </header>
        <main className="px-2 py-4 sm:px-4 lg:px-6 xl:px-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-3 text-gray-600 dark:text-gray-400">
              Checking authentication...
            </div>
          </div>
        </main>
      </div>
    )
  }

  // If user is not authenticated and wants to see details, show auth flow
  if (!isAuthenticated && showAuthFlow) {
    return (
      <OnDemandAuth
        onComplete={() => {
          setShowAuthFlow(false)
          // User will be redirected automatically after successful auth
        }}
        onCancel={() => setShowAuthFlow(false)}
      />
    )
  }

  // For unauthenticated users, show login prompt instead of content
  if (!isAuthenticated) {
    return (
      <div
        className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors page-container ${isTransitioning ? 'transitioning' : ''}`}
      >
        <header className="flex items-center justify-between px-2 sm:px-4 lg:px-6 xl:px-8 py-4 bg-white dark:bg-gray-800 shadow">
          <Link to="/" className="text-blue-500 hover:underline text-2xl">
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
            {cryptoName}
          </h1>
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </header>
        <main className="px-2 py-4 sm:px-4 lg:px-6 xl:px-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow border border-gray-200 dark:border-gray-700 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Sign In Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in to access detailed crypto analysis for {cryptoName}. Pay
              only $0.25 per analysis with crypto.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowAuthFlow(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Sign In to Continue
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>✓ No monthly subscription</div>
                <div>✓ Pay per analysis</div>
                <div>✓ Secure crypto payments</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors page-container ${isTransitioning ? 'transitioning' : ''}`}
    >
      <header className="flex items-center justify-between px-2 sm:px-4 lg:px-6 xl:px-8 py-4 bg-white dark:bg-gray-800 shadow">
        <Link to="/" className="text-blue-500 hover:underline text-2xl">
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
          {cryptoName}
        </h1>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && <CreditBalance />}
          {isAuthenticated && user && <UserDropdown />}
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </div>
      </header>
      <main className="px-2 py-4 sm:px-4 lg:px-6 xl:px-8 transition-opacity duration-150 ease-in-out">
        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            <TimeIntervalSelector
              selectedInterval={selectedInterval}
              onIntervalChange={setSelectedInterval}
            />
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Refresh market data"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // If user has credits, toggle enhanced mode normally
                  if (hasCredits(1)) {
                    setEnhancedMode(!enhancedMode)
                  } else {
                    // If no credits, show credit purchase modal
                    setShowCreditModal(true)
                  }
                }}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2
                  ${
                    enhancedMode && hasCredits(1)
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                      : !hasCredits(1)
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg pulse-animation'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }
                `}
                title={
                  !hasCredits(1)
                    ? 'Buy credits to enable AI Enhanced analysis'
                    : `${enhancedMode ? 'Disable' : 'Enable'} AI Enhanced analysis using ${llmProvider === 'ollama' ? 'Ollama (Local)' : 'OpenAI (Cloud)'}`
                }
              >
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                {!hasCredits(1) ? (
                  <>
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Buy Credits for AI
                  </>
                ) : (
                  <>
                    AI Enhanced
                    {enhancedMode && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {llmProvider === 'ollama' ? 'Local' : 'Cloud'}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Market Analysis */}
        {price && ohlcvData.length > 0 && (
          <MarketAnalysisSummary
            ohlcvData={ohlcvData}
            currentPrice={price}
            timeframe={selectedInterval}
            cryptoName={cryptoName}
            className="mb-6"
            llmAnalysis={
              enhancedMode && marketInsights.text !== 'Loading...'
                ? marketInsights.text
                : null
            }
            showLLMSection={enhancedMode}
            llmAnalysisLoading={marketInsightsLoading}
          />
        )}

        {/* Main Content Grid - Optimized for 3 cards */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Price Analysis */}
            <div className="lg:col-span-1">
              <PriceAnalysisDisplay
                analysis={priceAnalysis}
                isLoading={isPriceAnalyzing}
                error={priceAnalysisError}
              />
            </div>

            {/* Technical Indicators */}
            <div className="lg:col-span-1">
              <TechnicalIndicatorsDisplay
                ohlcvData={ohlcvData}
                currentPrice={price || 0}
                isLoading={loading}
              />
            </div>

            {/* Technical Analysis Report */}
            <div className="lg:col-span-2 xl:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {enhancedMode
                      ? 'AI Technical Analysis'
                      : 'Technical Analysis'}
                  </h3>
                  {technicalReportLoading && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-500 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                        Generating...
                      </span>
                    </div>
                  )}
                </div>
                <Article
                  text={article.text}
                  confidence={article.confidence}
                  isEnhanced={enhancedMode}
                  showTitle={false}
                  showAIBadge={false}
                />
              </div>
            </div>
          </div>

          {/* Single Premium Overlay - Only shown if user doesn't have credits */}
          {!hasCredits(1) && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="text-center p-8 max-w-md mx-auto">
                {/* Premium badge */}
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Unlock Premium Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get complete access to advanced price analysis, technical
                  indicators, and AI insights for {cryptoName}
                </p>

                {/* Pricing */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    $0.25
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium mb-4">
                    One payment unlocks everything
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 text-left">
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Entry points & stop-loss analysis</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Advanced technical indicators</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>AI-powered market analysis</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Real-time trading signals</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <BuyCreditButton
                  size="lg"
                  requiredCredits={1}
                  coinSymbol={cryptoName}
                  onPurchaseComplete={() => {
                    // Refresh or trigger re-render to hide overlay
                    window.location.reload()
                  }}
                  className="w-full transform hover:scale-105 transition-transform duration-200"
                />

                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Pay with crypto • Instant access • No subscription
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Credit Purchase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Enable AI Enhanced Analysis
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
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

            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    AI-Powered Analysis
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get advanced market insights for {cryptoName}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  Just $0.25
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Pay per analysis • No subscription
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Real-time AI market analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Advanced technical indicators</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Price predictions & trading signals</span>
                </div>
              </div>
            </div>

            <BuyCreditButton
              size="lg"
              requiredCredits={1}
              coinSymbol={cryptoName}
              onPurchaseComplete={() => {
                setShowCreditModal(false)
                // Optionally enable enhanced mode after purchase
                setEnhancedMode(true)
              }}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
