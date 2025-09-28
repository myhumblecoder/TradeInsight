import { Link, useParams } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useCoinbaseData } from '../hooks/useCoinbaseData'
import { calculateRSI, calculateEMA, calculateMACD } from '../utils/indicators'
import { generateArticle, generateLLMArticle, getCacheInfo, clearCache } from '../utils/article'
import { Article } from './Article'
import { DarkModeToggle } from './DarkModeToggle'
import { useTheme } from '../contexts/ThemeContext'

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
  const [granularity, setGranularity] = useState(86400)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [enhancedMode, setEnhancedMode] = useState(false)
  const [llmProvider, setLlmProvider] = useState<'ollama' | 'openai'>('ollama')
  const [article, setArticle] = useState({ text: 'Loading...', confidence: 0 })
  const [articleLoading, setArticleLoading] = useState(false)
  const { price, candles, error, loading } = useCoinbaseData(cryptoId, granularity, refreshTrigger)

  const cryptoName = cryptoDisplayNames[cryptoId] || (cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1))

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

  // Generate article when data or mode changes
  useEffect(() => {
    const generateArticleAsync = async () => {
      if (!price || !indicators) {
        setArticle({ text: 'Loading data...', confidence: 0 })
        return
      }

      setArticleLoading(true)
      try {
        const data = {
          price,
          rsi: indicators.rsi,
          ema12: indicators.ema12,
          ema26: indicators.ema26,
          macd: indicators.macd,
          cryptoName,
        }

        const result = enhancedMode 
          ? await generateLLMArticle(data, true, llmProvider)
          : generateArticle(data)

        setArticle(result)
      } catch (error) {
        console.error('Article generation failed:', error)
        // Fallback to template article
        const data = {
          price,
          rsi: indicators.rsi,
          ema12: indicators.ema12,
          ema26: indicators.ema26,
          macd: indicators.macd,
          cryptoName,
        }
        setArticle(generateArticle(data))
      } finally {
        setArticleLoading(false)
      }
    }

    generateArticleAsync()
  }, [price, indicators, cryptoName, enhancedMode, llmProvider])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow">
        <Link to="/" className="text-blue-500 hover:underline text-2xl">←</Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">{cryptoName}</h1>
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </header>
      <main className="px-3 py-4 sm:p-4 lg:p-6 xl:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={granularity}
              onChange={(e) => setGranularity(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={86400}>1 Day</option>
              <option value={604800}>7 Days</option>
            </select>
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={enhancedMode}
                onChange={(e) => setEnhancedMode(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm font-medium">AI Enhanced</span>
              {articleLoading && (
                <span className="text-xs text-blue-500 animate-pulse">Generating...</span>
              )}
              {enhancedMode && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Cache: {getCacheInfo().size})
                </span>
              )}
            </label>
            
            {enhancedMode && (
              <div className="flex items-center gap-2">
                <select
                  value={llmProvider}
                  onChange={(e) => setLlmProvider(e.target.value as 'ollama' | 'openai')}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="ollama">Ollama (Local)</option>
                  <option value="openai">OpenAI (Cloud)</option>
                </select>
                
                {getCacheInfo().size > 0 && (
                  <button
                    onClick={() => {
                      clearCache();
                      setRefreshTrigger(prev => prev + 1);
                    }}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear Cache
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <Article text={article.text} confidence={article.confidence} isEnhanced={enhancedMode} />
      </main>
    </div>
  )
}