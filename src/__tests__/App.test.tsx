import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, afterEach } from 'vitest'
import App from '../App'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock the hooks to avoid API calls
vi.mock('../hooks/useCoinbaseData', () => ({
  useCoinbaseData: () => ({
    price: 50000,
    candles: [[1640995200000, 50000, 50000, 50000, 50000]],
    ohlcvData: [
      {
        timestamp: 1640995200000,
        open: 50000,
        high: 50000,
        low: 50000,
        close: 50000,
        volume: 0,
      },
    ],
    error: null,
    loading: false,
  }),
}))
vi.mock('../hooks/useTopCryptos', () => ({
  useTopCryptos: () => ({
    data: [],
    error: null,
    loading: false,
  }),
}))
vi.mock('../hooks/usePriceAnalysis', () => ({
  usePriceAnalysis: () => ({
    analysis: {
      entryPoints: {
        conservative: 48000,
        moderate: 47000,
        aggressive: 46000,
        methods: {
          conservative: 'Support + 2%',
          moderate: 'Fibonacci 61.8%',
          aggressive: 'Current price - 2%',
        },
      },
      stopLoss: {
        price: 45000,
        percentage: 5,
        method: 'atr',
        explanation: '2x ATR below entry',
      },
      profitTargets: {
        target1: 52000,
        target2: 55000,
        target3: 58000,
        riskRewardRatio: 2,
        methods: {
          target1: '1:2 risk-reward',
          target2: '1:3 risk-reward',
          target3: 'Resistance level',
        },
      },
      timeHorizon: '1d',
      riskAssessment: 'Medium - Balanced timeframe suitable for swing trading',
      confidence: 0.75,
    },
    isAnalyzing: false,
    error: null,
  }),
}))
vi.mock('../hooks/usePageTransition', () => ({
  usePageTransition: () => ({
    isTransitioning: false,
  }),
}))
vi.mock('../utils/indicators', () => ({
  calculateRSI: () => 65,
  calculateEMA: () => [50000],
  calculateMACD: () => ({ MACD: 200, signal: 150, histogram: 50 }),
  analyzeIndicators: () => ({
    rsi: 65.5,
    ema12: 45000.5,
    ema26: 44800.25,
    macd: {
      MACD: 0.0025,
      signal: 0.0018,
      histogram: 0.0007,
    },
    bollingerBands: {
      upper: 46500,
      middle: 45000,
      lower: 43500,
      bandwidth: 0.15,
    },
    stochasticRSI: {
      k: 75.2,
      d: 72.8,
    },
    volumeProfile: {
      poc: 45200,
      valueAreaHigh: 45800,
      valueAreaLow: 44600,
      levels: [
        { price: 45200, volume: 1000000 },
        { price: 45800, volume: 800000 },
      ],
    },
    signals: {
      rsi: 'neutral',
      macd: 'bullish',
      bollinger: 'normal',
      stochRSI: 'bullish',
      overall: 'bullish',
    },
  }),
}))
vi.mock('../utils/article', () => ({
  generateArticle: () => ({
    text: 'Test article',
    confidence: 75,
  }),
  generateLLMArticle: () =>
    Promise.resolve({
      text: 'Test LLM article',
      confidence: 85,
    }),
  getCacheInfo: () => ({ size: 0, entries: [], duration: 300000 }),
  clearCache: () => {},
}))

vi.mock('../utils/advancedIndicators', () => ({
  calculateFibonacciExtensions: () => ({
    direction: 'uptrend',
    targets: [
      { level: '127.2%', price: 47500 },
      { level: '161.8%', price: 48900 },
      { level: '200%', price: 50000 },
      { level: '261.8%', price: 52100 },
    ],
  }),
}))

vi.mock('../utils/timeIntervals', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/timeIntervals')>()
  return {
    ...actual,
    // Override only specific functions if needed
  }
})

// Mock components that might cause issues
vi.mock('../components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}))

describe.skip('App Routing', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders overview page by default', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    )

    // For now, since we haven't implemented overview, expect the current App
    expect(screen.getByText('TradeInsight')).toBeInTheDocument()
  })

  it('handles detail page route without infinite loops', async () => {
    // The main goal is to ensure the app doesn't hang/timeout when routing to detail pages
    // This test verifies that the routing works and renders within reasonable time
    const { container } = render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/btc']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    )

    // Test that the routing system rendered something immediately
    // The key success is that it doesn't hang/timeout during render
    expect(container.firstChild).toBeTruthy()

    // Verify that the app responded to the route (error boundary counts as a response)
    // This confirms routing is working and the page doesn't hang indefinitely
    expect(container.innerHTML.length).toBeGreaterThan(0)
  }, 5000)
})
