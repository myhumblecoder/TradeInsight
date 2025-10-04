import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { supabase } from '../config/supabase'
import type { AuthContextType, User, Subscription } from '../types/auth'
import { FirebaseAppProvider } from './FirebaseAppContext'
import { AuthContext } from './AuthContextBase'

// Export for backward compatibility (if code imports AuthContext directly)
export { AuthContext }

interface AuthProviderProps {
  children: React.ReactNode
}

const hasFirebaseConfig =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN

const Auth0Provider: React.FC<AuthProviderProps> = ({ children }) => {
  // Auth0-backed provider for environments that still use Auth0
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0()
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && auth0User && supabase) {
        setUserLoading(true)
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select(
              `
							*,
							subscriptions (
								id,
								stripe_subscription_id,
								status,
								price_id,
								current_period_start,
								current_period_end,
								cancel_at_period_end
							)
						`
            )
            .eq('auth0_id', auth0User.sub)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading user data:', error)
            return
          }

          let finalUserData = userData

          if (!userData) {
            const newUser = {
              auth0_id: auth0User.sub!,
              email: auth0User.email!,
              name: auth0User.name || null,
              picture: auth0User.picture || null,
            }

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .single()

            if (createError) {
              console.error('Error creating user:', createError)
              return
            }

            finalUserData = createdUser
          }

          const subscription: Subscription | undefined =
            finalUserData.subscriptions
              ? {
                  id: finalUserData.subscriptions.id,
                  status: finalUserData.subscriptions.status,
                  priceId: finalUserData.subscriptions.price_id,
                  currentPeriodStart:
                    finalUserData.subscriptions.current_period_start,
                  currentPeriodEnd:
                    finalUserData.subscriptions.current_period_end,
                  cancelAtPeriodEnd:
                    finalUserData.subscriptions.cancel_at_period_end,
                }
              : undefined

          setUser({
            id: finalUserData.id,
            email: finalUserData.email,
            name: finalUserData.name || undefined,
            picture: finalUserData.picture || undefined,
            subscription,
            createdAt: finalUserData.created_at,
            updatedAt: finalUserData.updated_at,
          })
        } catch (error) {
          console.error('Error in loadUserData:', error)
        } finally {
          setUserLoading(false)
        }
      } else if (!isAuthenticated) {
        setUser(null)
        setUserLoading(false)
      }
    }

    if (!isLoading) {
      loadUserData()
    }
  }, [isAuthenticated, auth0User, isLoading])

  const login = async () => {
    await loginWithRedirect()
  }

  const logout = async () => {
    await auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
    setUser(null)
  }

  const getAccessToken = async () => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated')
    }
    return await getAccessTokenSilently()
  }

  // Compat methods so consumers can call Firebase-specific APIs even when using Auth0
  const signInWithGoogle = async () => {
    // For Auth0, map Google sign-in to the standard redirect login
    await loginWithRedirect()
  }

  const signInWithEmail = async (_email: string, _password: string) => {
    void _email
    void _password
    throw new Error(
      'Email/password sign-in is not supported in the Auth0 fallback. Use the Auth0 login flow.'
    )
  }

  const signUpWithEmail = async (
    _email: string,
    _password: string,
    _displayName?: string
  ) => {
    void _email
    void _password
    void _displayName
    throw new Error(
      'Email/password sign-up is not supported in the Auth0 fallback. Create accounts via your Auth0 dashboard or implement a custom flow.'
    )
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuthenticated && !!user,
    isLoading: isLoading || userLoading,
    login,
    logout,
    getAccessToken,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Prefer Firebase provider when env vars are present
  if (hasFirebaseConfig) {
    return <FirebaseAppProvider>{children}</FirebaseAppProvider>
  }

  // Fallback to Auth0 provider
  return <Auth0Provider>{children}</Auth0Provider>
}

export default AuthProvider
