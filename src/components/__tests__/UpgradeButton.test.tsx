import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpgradeButton } from '../UpgradeButton'
import { useAuth } from '../../hooks/useAuth'
import * as stripeService from '../../services/stripe'

vi.mock('../../hooks/useAuth')
vi.mock('../../services/stripe')

const mockUseAuth = vi.mocked(useAuth)
const mockCreateCheckoutSession = vi.mocked(stripeService.createCheckoutSession)
const mockRedirectToCheckout = vi.mocked(stripeService.redirectToCheckout)

describe('UpgradeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show login prompt for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(<UpgradeButton />)

    expect(screen.getByText('Sign In to Upgrade')).toBeInTheDocument()
    expect(screen.getByText('$9.99/month')).toBeInTheDocument()
  })

  it('should trigger login when clicked for unauthenticated user', () => {
    const mockLogin = vi.fn()
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(<UpgradeButton />)

    fireEvent.click(screen.getByText('Sign In to Upgrade'))
    expect(mockLogin).toHaveBeenCalled()
  })

  it('should show upgrade button for authenticated users without subscription', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        subscription: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(<UpgradeButton />)

    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    expect(screen.getByText('$9.99/month')).toBeInTheDocument()
  })

  it('should show current plan for users with active subscription', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        subscription: {
          id: 'sub-1',
          status: 'active',
          priceId: 'price_123',
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          cancelAtPeriodEnd: false
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(<UpgradeButton />)

    expect(screen.getByText('Premium Active')).toBeInTheDocument()
    expect(screen.getByText('Manage Subscription')).toBeInTheDocument()
  })

  it('should handle checkout flow for authenticated user', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      subscription: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    mockUseAuth.mockReturnValue({
      user,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    mockCreateCheckoutSession.mockResolvedValue('cs_test_123')
    mockRedirectToCheckout.mockResolvedValue()

    render(<UpgradeButton />)

    fireEvent.click(screen.getByText('Upgrade to Premium'))

    await waitFor(() => {
      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        priceId: 'price_monthly',
        userId: 'user-1',
        userEmail: 'test@example.com'
      })
    })

    await waitFor(() => {
      expect(mockRedirectToCheckout).toHaveBeenCalledWith('cs_test_123')
    })
  })

  it('should show loading state during checkout', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      subscription: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    mockUseAuth.mockReturnValue({
      user,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    mockCreateCheckoutSession.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('cs_test_123'), 100)))
    mockRedirectToCheckout.mockResolvedValue()

    render(<UpgradeButton />)

    fireEvent.click(screen.getByText('Upgrade to Premium'))

    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('should handle checkout errors gracefully', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      subscription: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    mockUseAuth.mockReturnValue({
      user,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    mockCreateCheckoutSession.mockRejectedValue(new Error('Network error'))

    render(<UpgradeButton />)

    fireEvent.click(screen.getByText('Upgrade to Premium'))

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
  })
})