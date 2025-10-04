import { createContext } from 'react'
import type { AuthContextType } from '../types/auth'

// Shared AuthContext used by both the Auth0 wrapper and the Firebase provider.
export const AuthContext = createContext<AuthContextType | null>(null)

export default AuthContext
