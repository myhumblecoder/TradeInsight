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
}

export interface PaywallFeature {
  id: string
  name: string
  description: string
  requiresSubscription: boolean
}