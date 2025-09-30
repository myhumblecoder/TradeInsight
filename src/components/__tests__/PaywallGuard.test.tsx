import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { PaywallGuard } from '../PaywallGuard'
import { useAuth } from '../../hooks/useAuth'

vi.mock('../../hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

const PremiumContent = () => <div data-testid="premium-content">Premium Feature</div>

describe('PaywallGuard', () => {
  afterEach(() => {
    cleanup()
  })
  it('should show content for users with active subscription', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
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

    render(
      <PaywallGuard feature="premium_analysis">
        <PremiumContent />
      </PaywallGuard>
    )

    expect(screen.getByTestId('premium-content')).toBeInTheDocument()
    expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument()
  })

  it('should show paywall for unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(
      <PaywallGuard feature="premium_analysis">
        <PremiumContent />
      </PaywallGuard>
    )

    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument()
    expect(screen.getByText('Sign in to access premium features')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should show paywall for users without active subscription', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        subscription: {
          id: 'sub-1',
          status: 'canceled',
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

    render(
      <PaywallGuard feature="premium_analysis">
        <PremiumContent />
      </PaywallGuard>
    )

    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument()
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    expect(screen.getByText('$9.99/month')).toBeInTheDocument()
  })

  it('should show content for free features regardless of subscription', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
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

    render(
      <PaywallGuard feature="basic_analysis">
        <PremiumContent />
      </PaywallGuard>
    )

    expect(screen.getByTestId('premium-content')).toBeInTheDocument()
    expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument()
  })

  it('should show loading state while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn()
    })

    render(
      <PaywallGuard feature="premium_analysis">
        <PremiumContent />
      </PaywallGuard>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument()
  })
})