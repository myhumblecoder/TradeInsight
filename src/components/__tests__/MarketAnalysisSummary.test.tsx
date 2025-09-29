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

  it('should display Risk:Reward correctly when valid', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    expect(screen.getByText('Risk:Reward')).toBeInTheDocument()
    expect(screen.getByText('1:2')).toBeInTheDocument()
  })

  it('should display "Unavailable" when Risk:Reward is NaN', () => {
    // Mock with NaN risk-reward ratio
    vi.doMock('../../hooks/usePriceAnalysis', () => ({
      usePriceAnalysis: vi.fn(() => ({
        analysis: {
          entryPoints: { conservative: 105, moderate: 103, aggressive: 101 },
          stopLoss: { price: 95, percentage: 5 },
          profitTargets: { target1: 110, target2: 115, target3: 120, riskRewardRatio: NaN },
          confidence: 0.75
        },
        isAnalyzing: false
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

    expect(screen.getByText('Risk:Reward')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('1:NaN')).not.toBeInTheDocument()
  })

  it('should display "Unavailable" when Risk:Reward is Infinity', () => {
    // Mock with Infinity risk-reward ratio
    vi.doMock('../../hooks/usePriceAnalysis', () => ({
      usePriceAnalysis: vi.fn(() => ({
        analysis: {
          entryPoints: { conservative: 105, moderate: 103, aggressive: 101 },
          stopLoss: { price: 95, percentage: 5 },
          profitTargets: { target1: 110, target2: 115, target3: 120, riskRewardRatio: Infinity },
          confidence: 0.75
        },
        isAnalyzing: false
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

    expect(screen.getByText('Risk:Reward')).toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    expect(screen.queryByText('1:Infinity')).not.toBeInTheDocument()
  })

  it('should display Overall Sentiment without confidence percentage', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    // Should show the sentiment section
    expect(screen.getByText('Overall Sentiment')).toBeInTheDocument()
    
    // The sentiment section should NOT contain confidence percentage
    const sentimentSection = screen.getByText('Overall Sentiment').closest('div')
    expect(sentimentSection).not.toHaveTextContent('% confidence')
  })

  it('should display separate Analysis Confidence section', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    // Should show Analysis Confidence as separate section
    expect(screen.getByText('Analysis Confidence:')).toBeInTheDocument()
    
    // Should show a percentage in the confidence section
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()
  })

  it('should show confidence with progress bar', () => {
    render(
      <MarketAnalysisSummary
        ohlcvData={mockOHLCVData}
        currentPrice={105}
        timeframe="1h"
        cryptoName="Bitcoin"
      />
    )

    // Look for progress bar styling
    const progressBars = document.querySelectorAll('.bg-gradient-to-r')
    expect(progressBars.length).toBeGreaterThan(0)
  })
})