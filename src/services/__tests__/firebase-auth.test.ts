import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  FirebaseAuthService,
  type FirebaseUser,
  type FirebaseAuthConfig,
} from '../firebase-auth'
import { z } from 'zod'

// Mock Firebase Auth
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  getIdToken: vi.fn(),
  updateProfile: vi.fn(),
}

const mockFirebaseUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
  updateProfile: vi.fn(),
}

vi.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockAuth.signInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockAuth.createUserWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockAuth.signOut(...args),
  onAuthStateChanged: (...args: unknown[]) =>
    mockAuth.onAuthStateChanged(...args),
  GoogleAuthProvider: class {
    constructor() {
      return mockAuth.GoogleAuthProvider()
    }
  },
  signInWithPopup: (...args: unknown[]) => mockAuth.signInWithPopup(...args),
  updateProfile: (...args: unknown[]) => mockAuth.updateProfile(...args),
}))

describe('FirebaseAuthService', () => {
  let authService: FirebaseAuthService
  const mockConfig: FirebaseAuthConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-domain.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-bucket',
    messagingSenderId: '123456789',
    appId: 'test-app-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    authService = new FirebaseAuthService(mockConfig)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(authService).toBeInstanceOf(FirebaseAuthService)
    })

    it('should throw error with invalid configuration', () => {
      const invalidConfig = { ...mockConfig, apiKey: '' }
      expect(() => new FirebaseAuthService(invalidConfig)).toThrow()
    })
  })

  describe('email/password authentication', () => {
    it('should sign in with email and password successfully', async () => {
      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      })

      const result = await authService.signInWithEmail(
        'test@example.com',
        'password'
      )

      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password'
      )
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        picture: mockFirebaseUser.photoURL,
        emailVerified: mockFirebaseUser.emailVerified,
      })
    })

    it('should handle sign in errors appropriately', async () => {
      const authError = new Error('Invalid credentials')
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(authError)

      await expect(
        authService.signInWithEmail('test@example.com', 'wrong-password')
      ).rejects.toThrow('Authentication failed: Invalid credentials')
    })

    it('should create user with email and password', async () => {
      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      })

      const result = await authService.signUpWithEmail(
        'new@example.com',
        'password',
        'New User'
      )

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'new@example.com',
        'password'
      )
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        picture: mockFirebaseUser.photoURL,
        emailVerified: mockFirebaseUser.emailVerified,
      })
    })

    it('should validate email format before authentication', async () => {
      await expect(
        authService.signInWithEmail('invalid-email', 'password')
      ).rejects.toThrow('Invalid email format')
    })

    it('should validate password strength for signup', async () => {
      await expect(
        authService.signUpWithEmail('test@example.com', '123', 'Test User')
      ).rejects.toThrow('Password must be at least 8 characters long')
    })
  })

  describe('social authentication', () => {
    it('should sign in with Google successfully', async () => {
      mockAuth.signInWithPopup.mockResolvedValue({
        user: mockFirebaseUser,
      })

      const result = await authService.signInWithGoogle()

      expect(mockAuth.signInWithPopup).toHaveBeenCalledWith(
        mockAuth,
        expect.any(Object) // GoogleAuthProvider instance
      )
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        picture: mockFirebaseUser.photoURL,
        emailVerified: mockFirebaseUser.emailVerified,
      })
    })

    it('should handle Google sign in cancellation', async () => {
      const cancelError = new Error('auth/popup-closed-by-user')
      mockAuth.signInWithPopup.mockRejectedValue(cancelError)

      await expect(authService.signInWithGoogle()).rejects.toThrow(
        'Authentication failed: auth/popup-closed-by-user'
      )
    })
  })

  describe('user session management', () => {
    it('should get current user when authenticated', () => {
      mockAuth.currentUser = mockFirebaseUser

      const user = authService.getCurrentUser()

      expect(user).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        picture: mockFirebaseUser.photoURL,
        emailVerified: mockFirebaseUser.emailVerified,
      })
    })

    it('should return null when no user is authenticated', () => {
      mockAuth.currentUser = null

      const user = authService.getCurrentUser()

      expect(user).toBeNull()
    })

    it('should get user token successfully', async () => {
      mockAuth.currentUser = mockFirebaseUser
      mockFirebaseUser.getIdToken.mockResolvedValue('valid-token')

      const token = await authService.getIdToken()

      expect(token).toBe('valid-token')
      expect(mockFirebaseUser.getIdToken).toHaveBeenCalledWith(false)
    })

    it('should force refresh token when requested', async () => {
      mockAuth.currentUser = mockFirebaseUser
      mockFirebaseUser.getIdToken.mockResolvedValue('refreshed-token')

      const token = await authService.getIdToken(true)

      expect(token).toBe('refreshed-token')
      expect(mockFirebaseUser.getIdToken).toHaveBeenCalledWith(true)
    })

    it('should throw error when getting token without authentication', async () => {
      mockAuth.currentUser = null

      await expect(authService.getIdToken()).rejects.toThrow(
        'No authenticated user found'
      )
    })
  })

  describe('sign out', () => {
    it('should sign out successfully', async () => {
      mockAuth.signOut.mockResolvedValue(void 0)

      await authService.signOut()

      expect(mockAuth.signOut).toHaveBeenCalledWith(mockAuth)
    })

    it('should handle sign out errors', async () => {
      mockAuth.signOut.mockRejectedValue(new Error('Sign out failed'))

      await expect(authService.signOut()).rejects.toThrow(
        'Sign out failed: Sign out failed'
      )
    })
  })

  describe('auth state observation', () => {
    it('should setup auth state listener', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      mockAuth.onAuthStateChanged.mockReturnValue(mockUnsubscribe)

      const unsubscribe = authService.onAuthStateChanged(mockCallback)

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(
        mockAuth,
        expect.any(Function)
      )
      expect(unsubscribe).toBe(mockUnsubscribe)
    })

    it('should call callback with transformed user data', () => {
      const mockCallback = vi.fn()
      let authStateCallback: (user: unknown) => void

      mockAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return vi.fn()
      })

      authService.onAuthStateChanged(mockCallback)

      // Simulate auth state change
      authStateCallback(mockFirebaseUser)

      expect(mockCallback).toHaveBeenCalledWith({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        picture: mockFirebaseUser.photoURL,
        emailVerified: mockFirebaseUser.emailVerified,
      })
    })

    it('should call callback with null when user signs out', () => {
      const mockCallback = vi.fn()
      let authStateCallback: (user: unknown) => void

      mockAuth.onAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        return vi.fn()
      })

      authService.onAuthStateChanged(mockCallback)

      // Simulate sign out
      authStateCallback(null)

      expect(mockCallback).toHaveBeenCalledWith(null)
    })
  })

  describe('user profile updates', () => {
    it('should update user profile successfully', async () => {
      mockAuth.currentUser = mockFirebaseUser
      mockFirebaseUser.updateProfile.mockResolvedValue(void 0)

      await authService.updateProfile({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
      })

      expect(mockFirebaseUser.updateProfile).toHaveBeenCalledWith({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
      })
    })

    it('should throw error when updating profile without authentication', async () => {
      mockAuth.currentUser = null

      await expect(
        authService.updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('No authenticated user found')
    })

    it('should validate profile data before update', async () => {
      mockAuth.currentUser = mockFirebaseUser

      await expect(
        authService.updateProfile({ displayName: '' })
      ).rejects.toThrow('Display name cannot be empty')
    })
  })

  describe('error handling', () => {
    it('should transform Firebase auth errors appropriately', async () => {
      const firebaseError = new Error('auth/user-not-found')
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(firebaseError)

      await expect(
        authService.signInWithEmail('test@example.com', 'password')
      ).rejects.toThrow('Authentication failed: auth/user-not-found')
    })

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed')
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(networkError)

      await expect(
        authService.signInWithEmail('test@example.com', 'password')
      ).rejects.toThrow('Authentication failed: Network request failed')
    })
  })

  describe('validation schemas', () => {
    it('should validate Firebase user data correctly', () => {
      const validUser = {
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'User Name',
        photoURL: 'https://example.com/photo.jpg',
        emailVerified: true,
      }

      expect(() => authService.validateFirebaseUser(validUser)).not.toThrow()
    })

    it('should reject invalid user data', () => {
      const invalidUser = {
        uid: '',
        email: 'invalid-email',
        displayName: null,
        photoURL: null,
        emailVerified: false,
      }

      expect(() => authService.validateFirebaseUser(invalidUser)).toThrow()
    })
  })
})
