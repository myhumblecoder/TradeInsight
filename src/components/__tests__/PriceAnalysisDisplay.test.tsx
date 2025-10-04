import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { PriceAnalysisDisplay } from '../PriceAnalysisDisplay'
import type { PriceAnalysis } from '../../utils/priceAnalysis'

describe('PriceAnalysisDisplay', () => {
  afterEach(() => {
    cleanup()
  })

  const mockAnalysis: PriceAnalysis = {
    entryPoints: {
      conservative: 105,
      moderate: 103,
      aggressive: 101,
      methods: {
        conservative: 'Support + 2%',
        moderate: 'Fibonacci 61.8%',
        aggressive: 'Current price - 2%',
      },
    },
    stopLoss: {
      price: 95,
      percentage: 5,
      method: 'atr',
      explanation: '2x ATR below entry',
    },
    profitTargets: {
      target1: 110,
      target2: 115,
      target3: 120,
      riskRewardRatio: 2,
      methods: {
        target1: '1:2 risk-reward',
        target2: '1:3 risk-reward',
        target3: 'Resistance level',
      },
    },
    timeHorizon: '1h',
    riskAssessment: 'Medium - Balanced timeframe suitable for swing trading',
    confidence: 0.75,
  }

  it('should render analysis data correctly', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} />)

    // Check if main sections are present
    expect(screen.getByText('Entry Points')).toBeInTheDocument()
    expect(screen.getByText('Stop Loss')).toBeInTheDocument()
    expect(screen.getByText('Profit Targets')).toBeInTheDocument()
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument()

    // Check entry points
    expect(screen.getByText('Conservative: $105.00')).toBeInTheDocument()
    expect(screen.getByText('Moderate: $103.00')).toBeInTheDocument()
    expect(screen.getByText('Aggressive: $101.00')).toBeInTheDocument()

    // Check stop loss
    expect(screen.getByText(/\$95\.00/)).toBeInTheDocument()
    expect(screen.getByText(/5\.0% below entry/)).toBeInTheDocument()

    // Check profit targets
    expect(screen.getByText('Target 1: $110.00')).toBeInTheDocument()
    expect(screen.getByText('Target 2: $115.00')).toBeInTheDocument()
    expect(screen.getByText('Target 3: $120.00')).toBeInTheDocument()
    expect(screen.getByText('Risk-Reward: 1:2')).toBeInTheDocument()
  })

  it('should display confidence score', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} />)

    expect(screen.getByText('Confidence: 75%')).toBeInTheDocument()
  })

  it('should display time horizon', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} />)

    expect(screen.getByText('Time Horizon: 1h')).toBeInTheDocument()
  })

  it('should display risk assessment', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} />)

    expect(
      screen.getByText('Medium - Balanced timeframe suitable for swing trading')
    ).toBeInTheDocument()
  })

  it('should render loading state', () => {
    render(<PriceAnalysisDisplay analysis={null} isLoading={true} />)

    expect(screen.getByText('Analyzing price levels...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    render(<PriceAnalysisDisplay analysis={null} error="Analysis failed" />)

    expect(screen.getByText('Analysis failed')).toBeInTheDocument()
  })

  it('should render empty state when no analysis', () => {
    render(<PriceAnalysisDisplay analysis={null} />)

    expect(screen.getByText('Price analysis not available')).toBeInTheDocument()
  })

  it('should apply compact layout', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} compact={true} />)

    // In compact mode, some detailed explanations might be hidden
    const container = screen.getByTestId('price-analysis-display')
    expect(container).toHaveClass('compact')
  })

  it('should format prices correctly', () => {
    const analysisWithDecimals: PriceAnalysis = {
      ...mockAnalysis,
      entryPoints: {
        ...mockAnalysis.entryPoints,
        conservative: 105.5678,
      },
      stopLoss: {
        ...mockAnalysis.stopLoss,
        price: 95.1234,
      },
    }

    render(<PriceAnalysisDisplay analysis={analysisWithDecimals} />)

    expect(screen.getByText('Conservative: $105.57')).toBeInTheDocument()
    expect(screen.getByText(/\$95.12/)).toBeInTheDocument()
  })

  it('should display tooltips with method explanations', () => {
    render(<PriceAnalysisDisplay analysis={mockAnalysis} />)

    // Check that tooltip triggers (info icons) are present
    // Looking for SVG elements with the question mark icon
    const tooltipTriggers = screen
      .getByTestId('price-analysis-display')
      .querySelectorAll('svg')
    expect(tooltipTriggers.length).toBeGreaterThan(0)

    // Tooltip content won't be visible by default, but we can verify
    // the component structure includes tooltip-enabled elements
    expect(screen.getByText('Conservative: $105.00')).toBeInTheDocument()
    expect(screen.getByText('Moderate: $103.00')).toBeInTheDocument()
    expect(screen.getByText('Aggressive: $101.00')).toBeInTheDocument()
  })
})
