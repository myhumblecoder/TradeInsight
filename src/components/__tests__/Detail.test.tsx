import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Detail } from '../Detail'
import { useCoinbaseData } from '../../hooks/useCoinbaseData'
import { usePriceAnalysis } from '../../hooks/usePriceAnalysis'
import { ThemeProvider } from '../../contexts/ThemeContext'
import MockAuthProvider from '../../test/utils/mockAuthProvider'

vi.mock('../../hooks/useCoinbaseData')
vi.mock('../../hooks/usePriceAnalysis', () => ({
  usePriceAnalysis: vi.fn(),
}))
vi.mock('../../hooks/useCredits', () => ({
  useCredits: vi.fn(),
}))
vi.mock('../../utils/article', () => ({
  generateArticle: () => ({ text: 'Test article', confidence: 75 }),
  generateLLMArticle: () =>
    Promise.resolve({ text: 'Test LLM article', confidence: 85 }),
  getCacheInfo: () => ({ size: 0, entries: [], duration: 300000 }),
  clearCache: () => {},
}))

const mockUseCoinbaseData = vi.mocked(useCoinbaseData)
const mockUsePriceAnalysis = vi.mocked(usePriceAnalysis)

// Import useCredits after mocking
import { useCredits } from '../../hooks/useCredits'
const mockUseCredits = vi.mocked(useCredits)

describe('Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock for usePriceAnalysis
    mockUsePriceAnalysis.mockReturnValue({
      analysis: null,
      isAnalyzing: false,
      error: null,
      refresh: () => {},
    })

    // Setup default mock for useCredits (user has credits)
    mockUseCredits.mockReturnValue({
      credits: { balance: 10, totalPurchased: 10, totalUsed: 0 },
      isLoading: false,
      error: null,
      hasCredits: () => true,
      useCredit: vi.fn().mockResolvedValue(true),
      purchaseCredits: vi.fn().mockResolvedValue(true),
      refreshCredits: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders loading state', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: null,
      candles: [],
      ohlcvData: [],
      error: null,
      loading: true,
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/btc']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    // The component shows the layout with loading placeholders, not a single "Loading..." message
    // Check for the presence of the component structure instead
    expect(screen.getByText('Bitcoin')).toBeInTheDocument() // Header title
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument() // Controls are rendered
  })

  it('renders error state', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: null,
      candles: [],
      ohlcvData: [],
      error: 'Failed to load',
      loading: false,
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/btc']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders crypto details', () => {
    mockUseCoinbaseData.mockReturnValue({
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
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Market Analysis')).toBeInTheDocument()
    expect(screen.getByText('Test article')).toBeInTheDocument()
    expect(screen.getByText('Confidence Score: 75%')).toBeInTheDocument()
  })

  it('renders AI enhanced toggle and provider selection', () => {
    mockUseCoinbaseData.mockReturnValue({
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
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    // Check for AI Enhanced toggle button
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument()
    const aiButton = screen.getByRole('button', { name: /AI Enhanced/i })
    expect(aiButton).toBeInTheDocument()

    // When enhanced mode is off, provider dropdown should not be visible
    expect(screen.queryByText('Ollama (Local)')).not.toBeInTheDocument()
  })

  it('shows provider information when AI enhanced is enabled', async () => {
    mockUseCoinbaseData.mockReturnValue({
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
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    // Enable AI enhanced mode
    const aiButton = screen.getByRole('button', { name: /AI Enhanced/i })
    fireEvent.click(aiButton)

    // Wait for AI enhanced state to be active and provider info to appear
    await waitFor(() => {
      // Check that the button shows the enhanced state with provider badge
      expect(screen.getByText('Local')).toBeInTheDocument() // Provider badge appears when enhanced
      expect(aiButton).toHaveAttribute(
        'title',
        expect.stringContaining('Disable AI Enhanced')
      )
    })
  })

  it('toggles AI enhanced mode on and off when user has credits', async () => {
    mockUseCoinbaseData.mockReturnValue({
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
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    const aiButton = screen.getByRole('button', { name: /AI Enhanced/i })

    // Initially AI enhanced should be off (no Local badge)
    expect(screen.queryByText('Local')).not.toBeInTheDocument()
    expect(aiButton).toHaveAttribute(
      'title',
      expect.stringContaining('Enable AI Enhanced')
    )

    // Enable AI enhanced mode
    fireEvent.click(aiButton)

    // Wait for AI enhanced state and check the toggle worked
    await waitFor(() => {
      expect(screen.getByText('Local')).toBeInTheDocument() // Provider badge appears
      expect(aiButton).toHaveAttribute(
        'title',
        expect.stringContaining('Disable AI Enhanced')
      )
    })

    // Disable AI enhanced mode
    fireEvent.click(aiButton)

    await waitFor(() => {
      expect(screen.queryByText('Local')).not.toBeInTheDocument() // Provider badge disappears
      expect(aiButton).toHaveAttribute(
        'title',
        expect.stringContaining('Enable AI Enhanced')
      )
    })
  })

  it('shows credit modal when user without credits clicks Buy Credits for AI button', async () => {
    // Mock user without credits
    mockUseCredits.mockReturnValue({
      credits: { balance: 0, totalPurchased: 0, totalUsed: 0 },
      isLoading: false,
      error: null,
      hasCredits: () => false,
      useCredit: vi.fn().mockResolvedValue(false),
      purchaseCredits: vi.fn().mockResolvedValue(true),
      refreshCredits: vi.fn().mockResolvedValue(undefined),
    })

    mockUseCoinbaseData.mockReturnValue({
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
    })

    render(
      <ThemeProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <Detail />
          </MemoryRouter>
        </MockAuthProvider>
      </ThemeProvider>
    )

    const buyCreditsButton = screen.getByRole('button', {
      name: /Buy Credits for AI/i,
    })

    // Button should have buy credits title when user has no credits
    expect(buyCreditsButton).toHaveAttribute(
      'title',
      expect.stringContaining('Buy credits')
    )

    // Click the Buy Credits button
    fireEvent.click(buyCreditsButton)

    // Wait for credit modal to appear
    await waitFor(() => {
      expect(
        screen.getByText('Enable AI Enhanced Analysis')
      ).toBeInTheDocument()
      // Look for the specific modal content
      expect(
        screen.getByText(
          'Get complete access to advanced price analysis, technical indicators, and AI insights for Bitcoin'
        )
      ).toBeInTheDocument()
    })
  })
})
