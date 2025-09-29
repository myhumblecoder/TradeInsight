import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarketAnalysisSummary } from '../MarketAnalysisSummary'
import type { OHLCV } from '../../utils/priceAnalysis'

// Mock the hooks and utilities
vi.mock('../../hooks/usePriceAnalysis', () => ({
  usePriceAnalysis: vi.fn(() => ({
    analysis: {
      entryPoints: { conservative: 105, moderate: 103, aggressive: 101 },
      stopLoss: { price: 95, percentage: 5 },
      profitTargets: { target1: 110, target2: 115, target3: 120, riskRewardRatio: 2 },
      confidence: 0.75
    },
    isAnalyzing: false
  }))
}))

vi.mock('../../utils/indicators', () => ({
  analyzeIndicators: vi.fn(() => ({
    signals: {
      rsi: 'neutral',
      macd: 'bullish',
      bollinger: 'normal',
      stochRSI: 'neutral',
      overall: 'bullish'
    }
  }))
}))

describe('MarketAnalysisSummary', () => {
  const mockOHLCVData: OHLCV[] = [
    { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 1000 }
  ]

  it('should render market analysis summary', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    expect(screen.getByText('Market Analysis Summary')).toBeInTheDocument()
    expect(screen.getByText(/Bitcoin/)).toBeInTheDocument()
    expect(screen.getByText('$105.00')).toBeInTheDocument()
  })

  it('should show loading state when analyzing', () => {
    // Import vi.mocked from vitest and mock the module properly
    vi.doMock('../../hooks/usePriceAnalysis', () => ({
      usePriceAnalysis: vi.fn(() => ({
        analysis: null,
        isAnalyzing: true
      }))
    }))

    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display overall sentiment', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    expect(screen.getByText('Overall Sentiment')).toBeInTheDocument()
  })
})