import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Overview } from '../Overview'
import { useTopCryptos } from '../../hooks/useTopCryptos'
import { ThemeProvider } from '../../contexts/ThemeContext'

vi.mock('../../hooks/useTopCryptos')

const mockUseTopCryptos = vi.mocked(useTopCryptos)

describe('Overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseTopCryptos.mockReturnValue({
      data: [],
      loading: true,
      error: null,
    })

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Overview />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Loading top cryptocurrencies...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseTopCryptos.mockReturnValue({
      data: [],
      loading: false,
      error: 'Failed to load',
    })

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Overview />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('renders list of cryptocurrencies', () => {
    const mockCryptos = [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        current_price: 50000,
        market_cap: 1000000000000,
        price_change_percentage_24h: 2.5,
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'eth',
        current_price: 3000,
        market_cap: 350000000000,
        price_change_percentage_24h: -1.2,
      },
    ]
    mockUseTopCryptos.mockReturnValue({
      data: mockCryptos,
      loading: false,
      error: null,
    })

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Overview />
        </MemoryRouter>
      </ThemeProvider>
    )

    expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('btc')).toBeInTheDocument()
    expect(screen.getByText('$50,000')).toBeInTheDocument()
    expect(screen.getByText('+2.50%')).toBeInTheDocument()
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('eth')).toBeInTheDocument()
    expect(screen.getByText('$3,000')).toBeInTheDocument()
    expect(screen.getByText('-1.20%')).toBeInTheDocument()
  })
})