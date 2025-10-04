import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  FirebaseAuthService,
  type FirebaseAuthConfig,
  type FirebaseUser,
} from '../services/firebase-auth'
import { AuthContext } from './AuthContextBase'
import type { AuthContextType, User } from '../types/auth'

export const FirebaseAppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Read config from Vite env variables
  const firebaseConfig = useMemo<FirebaseAuthConfig>(
    () => ({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }),
    []
  )

  // Initialize service once
  const service = useMemo(
    () => new FirebaseAuthService(firebaseConfig),
    [firebaseConfig]
  )

  // Transform Firebase user to app User type
  const transformFirebaseUser = useCallback(
    (firebaseUser: FirebaseUser | null): User | null => {
      if (!firebaseUser) return null

      return {
        id: firebaseUser.id,
        email: firebaseUser.email || '',
        name: firebaseUser.name || undefined,
        picture: firebaseUser.picture || undefined,
        subscription: undefined, // Firebase users don't have subscription by default
        createdAt: firebaseUser.createdAt || new Date().toISOString(),
        updatedAt: firebaseUser.updatedAt || new Date().toISOString(),
      }
    },
    []
  )

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = service.onAuthStateChanged((firebaseUser) => {
      setUser(transformFirebaseUser(firebaseUser))
      setIsLoading(false)
    })

    // Cleanup
    return () => unsubscribe()
  }, [service, transformFirebaseUser])

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login: async () => {
        // Generic login method - for email/password only setup,
        // redirect users to use signInWithEmail instead
        throw new Error('Please use email/password sign-in')
      },
      logout: async () => {
        try {
          await service.signOut()
        } catch (error) {
          console.error('Logout failed:', error)
          throw error
        }
      },
      getAccessToken: async () => {
        try {
          return await service.getIdToken()
        } catch (error) {
          console.error('Failed to get access token:', error)
          throw error
        }
      },
      // Firebase-specific methods
      signInWithGoogle: async () => {
        throw new Error(
          'Google sign-in is disabled. Please use email/password authentication.'
        )
      },
      signInWithEmail: async (email: string, password: string) => {
        try {
          await service.signInWithEmail(email, password)
          // The user state will be updated via onAuthStateChanged callback
        } catch (error) {
          console.error('Email sign in failed:', error)
          throw error
        }
      },
      signUpWithEmail: async (
        email: string,
        password: string,
        displayName?: string
      ) => {
        try {
          await service.signUpWithEmail(email, password, displayName)
          // The user state will be updated via onAuthStateChanged callback
        } catch (error) {
          console.error('Email sign up failed:', error)
          throw error
        }
      },
    }),
    [user, isLoading, service]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Helper to access shared AuthContext directly if needed
// eslint-disable-next-line react-refresh/only-export-components
export const useFirebaseAuth = () => useContext(AuthContext)

export default FirebaseAppProvider
