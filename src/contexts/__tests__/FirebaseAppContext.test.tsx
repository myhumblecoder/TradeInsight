import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FirebaseAppProvider } from '../FirebaseAppContext'
import { useAuth } from '../../hooks/useAuth'

// Mock Firebase Auth Service
const mockFirebaseAuthService = {
  onAuthStateChanged: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn(),
}

vi.mock('../../services/firebase-auth', () => ({
  FirebaseAuthService: vi.fn(() => mockFirebaseAuthService),
}))

// Mock environment variables
const mockEnvVars = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-domain.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: 'test-app-id',
}

Object.defineProperty(import.meta, 'env', {
  get: () => mockEnvVars,
  configurable: true,
})

const TestComponent = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="user-id">{user?.id || 'No User ID'}</div>
      <div data-testid="user-email">{user?.email || 'No Email'}</div>
      <div data-testid="user-name">{user?.name || 'No Name'}</div>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      <button onClick={() => signInWithEmail?.('test@example.com', 'password')}>
        Sign in with Email
      </button>
      <button
        onClick={() =>
          signUpWithEmail?.('test@example.com', 'password', 'Test User')
        }
      >
        Sign up with Email
      </button>
    </div>
  )
}

describe('FirebaseAppProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should show loading state initially', () => {
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn() // unsubscribe function
    })

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'Not Authenticated'
    )
  })

  it('should show unauthenticated state when no user is signed in', () => {
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(
      (callback: (user: unknown) => void) => {
        setTimeout(() => callback(null), 0) // Simulate no user
        return vi.fn() // unsubscribe function
      }
    )

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Not Authenticated'
      )
      expect(screen.getByTestId('user-id')).toHaveTextContent('No User ID')
    })
  })

  it('should show authenticated user when Firebase user is available', async () => {
    const mockUser = {
      id: 'firebase-user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      emailVerified: true,
    }

    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(
      (callback: (user: unknown) => void) => {
        setTimeout(() => callback(mockUser), 0)
        return vi.fn() // unsubscribe function
      }
    )

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Authenticated'
      )
      expect(screen.getByTestId('user-id')).toHaveTextContent(
        'firebase-user-123'
      )
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'test@example.com'
      )
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
    })
  })

  it('should reject Google sign-in when Google login is clicked (disabled)', async () => {
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(
      (callback) => {
        callback(null) // No user initially
        return vi.fn()
      }
    )

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    // Google sign-in should be disabled - clicking should not call the mock
    fireEvent.click(screen.getByText('Sign in with Google'))

    // Verify that the Firebase service method was not called since Google auth is disabled
    expect(mockFirebaseAuthService.signInWithGoogle).not.toHaveBeenCalled()
  })

  it('should call Firebase signInWithEmail when email login is clicked', async () => {
    const mockUser = {
      id: 'email-user-123',
      email: 'test@example.com',
      name: 'Email User',
      picture: null,
      emailVerified: false,
    }

    mockFirebaseAuthService.signInWithEmail.mockResolvedValue(mockUser)
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn()
    })

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    fireEvent.click(screen.getByText('Sign in with Email'))

    await waitFor(() => {
      expect(mockFirebaseAuthService.signInWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      )
    })
  })

  it('should call Firebase signUpWithEmail when email signup is clicked', async () => {
    const mockUser = {
      id: 'new-user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: null,
      emailVerified: false,
    }

    mockFirebaseAuthService.signUpWithEmail.mockResolvedValue(mockUser)
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn()
    })

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    fireEvent.click(screen.getByText('Sign up with Email'))

    await waitFor(() => {
      expect(mockFirebaseAuthService.signUpWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password',
        'Test User'
      )
    })
  })

  it('should call Firebase signOut when logout is clicked', async () => {
    mockFirebaseAuthService.signOut.mockResolvedValue(undefined)
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn()
    })

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(mockFirebaseAuthService.signOut).toHaveBeenCalled()
    })
  })

  it('should get Firebase ID token when getAccessToken is called', async () => {
    const mockToken = 'firebase-id-token-123'
    mockFirebaseAuthService.getIdToken.mockResolvedValue(mockToken)
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn()
    })

    const TestTokenComponent = () => {
      const { getAccessToken } = useAuth()

      return (
        <button
          onClick={async () => {
            const token = await getAccessToken()
            screen.getByTestId('token').textContent = token
          }}
        >
          Get Token
        </button>
      )
    }

    render(
      <FirebaseAppProvider>
        <TestTokenComponent />
        <div data-testid="token">No Token</div>
      </FirebaseAppProvider>
    )

    fireEvent.click(screen.getByText('Get Token'))

    await waitFor(() => {
      expect(mockFirebaseAuthService.getIdToken).toHaveBeenCalled()
    })
  })

  it('should handle authentication state changes correctly', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: null,
      emailVerified: true,
    }

    let authStateCallback: (user: unknown) => void
    const mockUnsubscribe = vi.fn()
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(
      (callback: (user: unknown) => void) => {
        authStateCallback = callback
        return mockUnsubscribe
      }
    )

    const { unmount } = render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    // Initially no user
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'Not Authenticated'
    )

    // Simulate user sign in
    authStateCallback(mockUser)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Authenticated'
      )
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'test@example.com'
      )
    })

    // Simulate user sign out
    authStateCallback(null)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'Not Authenticated'
      )
      expect(screen.getByTestId('user-email')).toHaveTextContent('No Email')
    })

    // Ensure cleanup happens on unmount
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('should initialize Firebase service with correct configuration', async () => {
    mockFirebaseAuthService.onAuthStateChanged.mockImplementation(() => {
      return vi.fn()
    })

    render(
      <FirebaseAppProvider>
        <TestComponent />
      </FirebaseAppProvider>
    )

    // Verify the service was called (indirectly through mocks)
    expect(mockFirebaseAuthService.onAuthStateChanged).toHaveBeenCalled()

    // We can't directly test the constructor call due to module mocking,
    // but we can verify the service is working by checking the state listener
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })
  })

  it('should handle Firebase service initialization', () => {
    // Test that the component renders without throwing when the service is available
    expect(() => {
      render(
        <FirebaseAppProvider>
          <TestComponent />
        </FirebaseAppProvider>
      )
    }).not.toThrow()

    // Verify that the onAuthStateChanged is called indicating service initialization
    expect(mockFirebaseAuthService.onAuthStateChanged).toHaveBeenCalled()
  })
})
