import React from 'react'
import AuthContext from '../../contexts/AuthContextBase'
import type { AuthContextType, User } from '../../types/auth'

const mockUser: User = {
  id: 'test-user',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const defaultAuthValue: AuthContextType = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => '',
}

export function MockAuthProvider({
  children,
  value = defaultAuthValue,
}: {
  children: React.ReactNode
  value?: AuthContextType
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default MockAuthProvider
