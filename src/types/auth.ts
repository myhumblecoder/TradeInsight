export interface User {
  id: string
  email: string
  name?: string
  picture?: string
  subscription?: Subscription | null
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'incomplete'
  priceId: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string>
  // Optional Firebase-specific methods — provided when Firebase provider is active.
  signInWithGoogle?: () => Promise<void>
  signInWithEmail?: (email: string, password: string) => Promise<void>
  signUpWithEmail?: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>
}

export interface PaywallFeature {
  id: string
  name: string
  description: string
  requiresSubscription: boolean
}
