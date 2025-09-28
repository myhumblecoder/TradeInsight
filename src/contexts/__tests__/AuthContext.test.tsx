import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider } from '../AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { useAuth0 } from '@auth0/auth0-react'

vi.mock('@auth0/auth0-react')
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'user-1',
              auth0_id: 'auth0|123',
              email: 'test@example.com',
              name: 'Test User',
              picture: 'https://example.com/picture.jpg',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              subscriptions: {
                id: 'sub-1',
                stripe_subscription_id: 'sub_123',
                status: 'active',
                price_id: 'price_123',
                current_period_start: '2024-01-01T00:00:00Z',
                current_period_end: '2024-02-01T00:00:00Z',
                cancel_at_period_end: false
              }
            },
            error: null
          }))
        }))
      }))
    }))
  }
}))

const mockUseAuth0 = vi.mocked(useAuth0)

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'No Email'}</div>
      <div data-testid="subscription-status">{user?.subscription?.status || 'No Subscription'}</div>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    mockUseAuth0.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
  })

  it('should show unauthenticated state when user is not logged in', () => {
    mockUseAuth0.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user-email')).toHaveTextContent('No Email')
  })

  it('should show authenticated user with subscription data', async () => {
    mockUseAuth0.mockReturnValue({
      user: {
        sub: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg'
      },
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn(() => Promise.resolve('token'))
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('active')
    })
  })

  it('should call Auth0 login when login is clicked', () => {
    const mockLogin = vi.fn()
    mockUseAuth0.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithRedirect: mockLogin,
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))
    expect(mockLogin).toHaveBeenCalled()
  })

  it('should call Auth0 logout when logout is clicked', () => {
    const mockLogout = vi.fn()
    mockUseAuth0.mockReturnValue({
      user: {
        sub: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User'
      },
      isAuthenticated: true,
      isLoading: false,
      loginWithRedirect: vi.fn(),
      logout: mockLogout,
      getAccessTokenSilently: vi.fn()
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Logout'))
    expect(mockLogout).toHaveBeenCalledWith({
      logoutParams: { returnTo: window.location.origin }
    })
  })
})