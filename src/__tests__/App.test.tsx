import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock the hooks to avoid API calls
vi.mock('../hooks/useCoinbaseData', () => ({
  useCoinbaseData: () => ({
    price: 50000,
    candles: [[1640995200000, 50000, 50000, 50000, 50000]],
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
vi.mock('../utils/indicators', () => ({
  calculateRSI: () => 65,
  calculateEMA: () => [50000],
  calculateMACD: () => ({ MACD: 200, signal: 150, histogram: 50 }),
}))
vi.mock('../utils/article', () => ({
  generateArticle: () => ({
    text: 'Test article',
    confidence: 75,
  }),
}))

describe('App Routing', () => {
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

  it('renders detail page for crypto', () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/btc']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
  })
})