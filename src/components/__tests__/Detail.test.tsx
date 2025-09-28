import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Detail } from '../Detail'
import { useCoinbaseData } from '../../hooks/useCoinbaseData'
import { ThemeProvider } from '../../contexts/ThemeContext'

vi.mock('../../hooks/useCoinbaseData')
vi.mock('../../utils/article', () => ({
  generateArticle: () => ({ text: 'Test article', confidence: 75 }),
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
})