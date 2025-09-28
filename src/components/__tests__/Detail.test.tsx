import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Detail } from '../Detail'
import { useCoinbaseData } from '../../hooks/useCoinbaseData'
import { ThemeProvider } from '../../contexts/ThemeContext'

vi.mock('../../hooks/useCoinbaseData')
vi.mock('../../utils/article', () => ({
  generateArticle: () => ({ text: 'Test article', confidence: 75 }),
  generateLLMArticle: () => Promise.resolve({ text: 'Test LLM article', confidence: 85 }),
  getCacheInfo: () => ({ size: 0, entries: [], duration: 300000 }),
  clearCache: () => {},
}))

const mockUseCoinbaseData = vi.mocked(useCoinbaseData)

describe('Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: null,
      candles: [],
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

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: null,
      candles: [],
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
    expect(screen.getByText('Market Analysis')).toBeInTheDocument()
    expect(screen.getByText('Test article')).toBeInTheDocument()
    expect(screen.getByText('Confidence Score: 75%')).toBeInTheDocument()
  })

  it('renders AI enhanced toggle and provider selection', () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
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

    // Check for AI Enhanced checkbox
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()

    // When enhanced mode is off, provider dropdown should not be visible
    expect(screen.queryByText('Ollama (Local)')).not.toBeInTheDocument()
  })

  it('shows provider selection when AI enhanced is enabled', async () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
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
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // Wait for provider dropdown to appear
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ollama (Local)')).toBeInTheDocument()
      expect(screen.getByText('OpenAI (Cloud)')).toBeInTheDocument()
    })

    // Check that cache info is shown
    expect(screen.getByText('(Cache: 0)')).toBeInTheDocument()
  })

  it('allows provider selection', async () => {
    mockUseCoinbaseData.mockReturnValue({
      price: 50000,
      candles: [[1640995200000, 50000, 50000, 50000, 50000]],
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
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // Wait for provider dropdown and change selection
    await waitFor(() => {
      const providerSelect = screen.getByDisplayValue('Ollama (Local)')
      fireEvent.change(providerSelect, { target: { value: 'openai' } })
      expect(screen.getByDisplayValue('OpenAI (Cloud)')).toBeInTheDocument()
    })
  })
})