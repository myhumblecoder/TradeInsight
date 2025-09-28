import React, { createContext, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { supabase } from '../config/supabase'
import type { AuthContextType, User, Subscription } from '../types/auth'

const AuthContext = createContext<AuthContextType | null>(null)

// Export for useAuth hook
export { AuthContext }

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: auth0User, isAuthenticated, isLoading, loginWithRedirect, logout: auth0Logout, getAccessTokenSilently } = useAuth0()
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && auth0User && supabase) {
        setUserLoading(true)
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select(`
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
            `)
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
              picture: auth0User.picture || null
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

          const subscription: Subscription | undefined = finalUserData.subscriptions
            ? {
                id: finalUserData.subscriptions.id,
                status: finalUserData.subscriptions.status,
                priceId: finalUserData.subscriptions.price_id,
                currentPeriodStart: finalUserData.subscriptions.current_period_start,
                currentPeriodEnd: finalUserData.subscriptions.current_period_end,
                cancelAtPeriodEnd: finalUserData.subscriptions.cancel_at_period_end
              }
            : undefined

          setUser({
            id: finalUserData.id,
            email: finalUserData.email,
            name: finalUserData.name || undefined,
            picture: finalUserData.picture || undefined,
            subscription,
            createdAt: finalUserData.created_at,
            updatedAt: finalUserData.updated_at
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
        returnTo: window.location.origin
      }
    })
    setUser(null)
  }

  const getAccessToken = async () => {
    if (!isAuthenticated) {
      throw new Error('User is not authenticated')
    }
    return await getAccessTokenSilently()
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuthenticated && !!user,
    isLoading: isLoading || userLoading,
    login,
    logout,
    getAccessToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}