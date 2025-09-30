import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { TechnicalIndicatorsDisplay } from '../TechnicalIndicatorsDisplay'
import { type OHLCV } from '../../utils/priceAnalysis'

vi.mock('../../utils/indicators', () => ({
  analyzeIndicators: vi.fn(() => ({
    rsi: 65.5,
    ema12: 45000.50,
    ema26: 44800.25,
    macd: {
      MACD: 0.0025,
      signal: 0.0018,
      histogram: 0.0007
    },
    bollingerBands: {
      upper: 46500,
      middle: 45000,
      lower: 43500,
      bandwidth: 0.15
    },
    stochasticRSI: {
      k: 75.2,
      d: 72.8
    },
    volumeProfile: {
      poc: 45200,
      valueAreaHigh: 45800,
      valueAreaLow: 44600,
      levels: [
        { price: 45200, volume: 1000000 },
        { price: 45800, volume: 800000 }
      ]
    },
    signals: {
      rsi: 'neutral',
      macd: 'bullish',
      bollinger: 'normal',
      stochRSI: 'bullish',
      overall: 'bullish'
    }
  }))
}))

vi.mock('../../utils/advancedIndicators', () => ({
  calculateFibonacciExtensions: vi.fn(() => ({
    direction: 'uptrend',
    targets: [
      { level: '127.2%', price: 47500 },
      { level: '161.8%', price: 48900 },
      { level: '200%', price: 50000 },
      { level: '261.8%', price: 52100 }
    ]
  }))
}))

const mockOHLCVData: OHLCV[] = Array.from({ length: 50 }, (_, i) => ({
  timestamp: Date.now() - (49 - i) * 60000,
  open: 44000 + Math.random() * 2000,
  high: 45000 + Math.random() * 2000,
  low: 43000 + Math.random() * 2000,
  close: 44500 + Math.random() * 2000,
  volume: 1000000 + Math.random() * 500000
}))

describe('TechnicalIndicatorsDisplay', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render all basic indicators correctly', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    expect(screen.getByText('Technical Indicators')).toBeInTheDocument()
    expect(screen.getByText('Basic Indicators')).toBeInTheDocument()
    
    // Check for RSI
    expect(screen.getByText('RSI (14)')).toBeInTheDocument()
    expect(screen.getByText('65.50')).toBeInTheDocument()
    
    // Check for EMAs
    expect(screen.getByText('EMA 12')).toBeInTheDocument()
    expect(screen.getByText('$45000.50')).toBeInTheDocument()
    expect(screen.getByText('EMA 26')).toBeInTheDocument()
    expect(screen.getByText('$44800.25')).toBeInTheDocument()
    
    // Check for MACD
    expect(screen.getByText('MACD')).toBeInTheDocument()
    expect(screen.getByText('0.0025')).toBeInTheDocument()
    expect(screen.getByText('MACD Signal')).toBeInTheDocument()
    expect(screen.getByText('0.0018')).toBeInTheDocument()
  })

  it('should render all advanced indicators correctly', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    expect(screen.getByText('Advanced Indicators')).toBeInTheDocument()
    
    // Check for Bollinger Bands
    expect(screen.getByText('Bollinger Upper')).toBeInTheDocument()
    expect(screen.getByText('$46500.00')).toBeInTheDocument()
    expect(screen.getByText('Bollinger Middle')).toBeInTheDocument()
    expect(screen.getByText('$45000.00')).toBeInTheDocument()
    expect(screen.getByText('Bollinger Lower')).toBeInTheDocument()
    expect(screen.getByText('$43500.00')).toBeInTheDocument()
    
    // Check for Stochastic RSI
    expect(screen.getByText('Stoch RSI K')).toBeInTheDocument()
    expect(screen.getByText('75.20')).toBeInTheDocument()
    expect(screen.getByText('Stoch RSI D')).toBeInTheDocument()
    expect(screen.getByText('72.80')).toBeInTheDocument()
    
    // Check for Volume Profile
    expect(screen.getByText('Volume POC')).toBeInTheDocument()
    expect(screen.getByText('$45200.00')).toBeInTheDocument()
    expect(screen.getByText('Value Area High')).toBeInTheDocument()
    expect(screen.getByText('$45800.00')).toBeInTheDocument()
  })

  it('should render Fibonacci Extensions', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    expect(screen.getByText('Fibonacci Extensions')).toBeInTheDocument()
    expect(screen.getByText('127.2%')).toBeInTheDocument()
    expect(screen.getByText('$47500.00')).toBeInTheDocument()
    expect(screen.getByText('161.8%')).toBeInTheDocument()
    expect(screen.getByText('$48900.00')).toBeInTheDocument()
  })

  it('should show overall signal badge', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    const bullishBadges = screen.getAllByText('📈 Bullish')
    expect(bullishBadges.length).toBeGreaterThan(0)
    // Check that the main header badge exists
    const headerBadge = bullishBadges.find(badge => 
      badge.className.includes('px-3') && badge.className.includes('rounded-full')
    )
    expect(headerBadge).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
        isLoading={true}
      />
    )

    expect(screen.getByText('Technical Indicators')).toBeInTheDocument()
    // Should show loading skeleton instead of actual data
    expect(screen.queryByText('65.50')).not.toBeInTheDocument()
  })

  it('should handle empty data gracefully', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={[]}
        currentPrice={45000}
      />
    )

    expect(screen.getByText('Technical Indicators')).toBeInTheDocument()
    expect(screen.getByText('Insufficient data for technical analysis')).toBeInTheDocument()
  })

  it('should display signal badges with correct colors', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    const bullishBadges = screen.getAllByText('📈 Bullish')
    expect(bullishBadges.length).toBeGreaterThan(0)
    
    // Check that signal badges are rendered (they should have color classes)
    bullishBadges.forEach(badge => {
      expect(badge.className).toContain('text-green-600')
    })
  })

  it('should format prices and values correctly', () => {
    render(
      <TechnicalIndicatorsDisplay
        ohlcvData={mockOHLCVData}
        currentPrice={45000}
      />
    )

    // Check that prices are formatted with $
    expect(screen.getByText('$45000.50')).toBeInTheDocument()
    expect(screen.getByText('$44800.25')).toBeInTheDocument()
    
    // Check that decimal values are formatted correctly
    expect(screen.getByText('65.50')).toBeInTheDocument()
    expect(screen.getByText('0.0025')).toBeInTheDocument()
  })
})