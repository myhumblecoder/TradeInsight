import { useState, useMemo } from 'react'
import { useCoinbaseData } from './hooks/useCoinbaseData'
import { calculateRSI, calculateEMA, calculateMACD } from './utils/indicators'
import { generateArticle } from './utils/article'
import { Article } from './components/Article'
import { DarkModeToggle } from './components/DarkModeToggle'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const [isDark, setIsDark] = useState(false)
  const { price, candles, error, loading } = useCoinbaseData('BTC')

  const indicators = useMemo(() => {
    if (!candles || !Array.isArray(candles) || candles.length === 0) return null

    const closes = candles.map((candle: any[]) => candle[4]) // Close prices

    return {
      rsi: calculateRSI(closes),
      ema12: calculateEMA(closes, 12).pop() || null,
      ema26: calculateEMA(closes, 26).pop() || null,
      macd: calculateMACD(closes),
    }
  }, [candles])

  const article = useMemo(() => {
    if (!price || !indicators) return { text: 'Loading data...', confidence: 0 }

    return generateArticle({
      price,
      rsi: indicators.rsi,
      ema12: indicators.ema12,
      ema26: indicators.ema26,
      macd: indicators.macd,
    })
  }, [price, indicators])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TradeInsight</h1>
          <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
        </header>
        <main className="p-4">
          <Article text={article.text} confidence={article.confidence} />
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
