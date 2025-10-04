import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Overview } from '../Overview'
import { useTopCryptos } from '../../hooks/useTopCryptos'
import { useAuth } from '../../hooks/useAuth'
import { ThemeProvider } from '../../contexts/ThemeContext'

vi.mock('../../hooks/useTopCryptos')
vi.mock('../../hooks/useAuth')

const mockUseTopCryptos = vi.mocked(useTopCryptos)
const mockUseAuth = vi.mocked(useAuth)

describe('Overview', () => {
  afterEach(() => {
    cleanup()
  })
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useAuth to return default authenticated user
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
    })
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

    expect(
      screen.getByText('Loading top cryptocurrencies...')
    ).toBeInTheDocument()
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
