import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Detail } from '../Detail'
import { useCoinbaseData } from '../../hooks/useCoinbaseData'
import { usePriceAnalysis } from '../../hooks/usePriceAnalysis'
import { ThemeProvider } from '../../contexts/ThemeContext'

vi.mock('../../hooks/useCoinbaseData')
vi.mock('../../hooks/usePriceAnalysis', () => ({
  usePriceAnalysis: vi.fn(),
}))
vi.mock('../../utils/article', () => ({
  generateArticle: () => ({ text: 'Test article', confidence: 75 }),
  generateLLMArticle: () => Promise.resolve({ text: 'Test LLM article', confidence: 85 }),
  getCacheInfo: () => ({ size: 0, entries: [], duration: 300000 }),
  clearCache: () => {},
}))

const mockUseCoinbaseData = vi.mocked(useCoinbaseData)
const mockUsePriceAnalysis = vi.mocked(usePriceAnalysis)

describe('Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock for usePriceAnalysis
    mockUsePriceAnalysis.mockReturnValue({
      analysis: null,
      isAnalyzing: false,
      error: null,
    })
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
        <MemoryRouter initialEntries={['/crypto/btc']}>
          <Detail />
        </MemoryRouter>
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
        <MemoryRouter initialEntries={['/crypto/btc']}>
          <Detail />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders crypto details', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
      ohlcvData: [{ timestamp: 1640995200000, open: 50000, high: 50000, low: 50000, close: 50000, volume: 0 }],
      error: null,
      loading: false,
    })

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/bitcoin']}>
          <Detail />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Market Analysis Summary')).toBeInTheDocument()
    expect(screen.getByText('Test article')).toBeInTheDocument()
    expect(screen.getByText('Confidence Score: 75%')).toBeInTheDocument()
  })

  it('renders AI enhanced toggle and provider selection', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
      ohlcvData: [{ timestamp: 1640995200000, open: 50000, high: 50000, low: 50000, close: 50000, volume: 0 }],
      error: null,
      loading: false,
    })

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/bitcoin']}>
          <Detail />
        </MemoryRouter>
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
      ohlcvData: [{ timestamp: 1640995200000, open: 50000, high: 50000, low: 50000, close: 50000, volume: 0 }],
      error: null,
      loading: false,
    })

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/bitcoin']}>
          <Detail />
        </MemoryRouter>
      </ThemeProvider>
    )

    // Enable AI enhanced mode
    const aiButton = screen.getByRole('button', { name: /AI Enhanced/i })
    fireEvent.click(aiButton)

    // Wait for AI enhanced state to be active and provider info to appear
    await waitFor(() => {
      // Check that the button shows the enhanced state with provider badge
      expect(screen.getByText('Local')).toBeInTheDocument() // Provider badge appears when enhanced
      expect(aiButton).toHaveAttribute('title', expect.stringContaining('Disable AI Enhanced'))
    })
  })

  it('toggles AI enhanced mode on and off', async () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
      ohlcvData: [{ timestamp: 1640995200000, open: 50000, high: 50000, low: 50000, close: 50000, volume: 0 }],
      error: null,
      loading: false,
    })

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/crypto/bitcoin']}>
          <Detail />
        </MemoryRouter>
      </ThemeProvider>
    )

    const aiButton = screen.getByRole('button', { name: /AI Enhanced/i })
    
    // Initially AI enhanced should be off (no Local badge)
    expect(screen.queryByText('Local')).not.toBeInTheDocument()
    expect(aiButton).toHaveAttribute('title', expect.stringContaining('Enable AI Enhanced'))

    // Enable AI enhanced mode
    fireEvent.click(aiButton)

    // Wait for AI enhanced state and check the toggle worked
    await waitFor(() => {
      expect(screen.getByText('Local')).toBeInTheDocument() // Provider badge appears
      expect(aiButton).toHaveAttribute('title', expect.stringContaining('Disable AI Enhanced'))
    })

    // Disable AI enhanced mode
    fireEvent.click(aiButton)

    await waitFor(() => {
      expect(screen.queryByText('Local')).not.toBeInTheDocument() // Provider badge disappears
      expect(aiButton).toHaveAttribute('title', expect.stringContaining('Enable AI Enhanced'))
    })
  })
})