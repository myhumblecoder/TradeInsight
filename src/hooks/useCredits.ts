import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export interface UserCredits {
  balance: number
  totalPurchased: number
  totalUsed: number
}

export interface CreditUsage {
  coinSymbol: string
  featureType: string
  creditsUsed: number
  createdAt: string
}

export interface CreditPurchase {
  id: string
  packageType: string
  totalCredits: number
  usdAmount: number
  cryptoCurrency: string
  paymentStatus: string
  createdAt: string
}

export function useCredits() {
  const { user, isAuthenticated } = useAuth()
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // For now, we'll simulate credit data
  // Later this will integrate with the actual credit service
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCredits(null)
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      // Simulate user with no credits initially
      setCredits({
        balance: 0, // Start with 0 credits to show paywall
        totalPurchased: 0,
        totalUsed: 0
      })
      setIsLoading(false)
    }, 500)
  }, [isAuthenticated, user])

  const hasCredits = (requiredCredits: number = 1): boolean => {
    return credits ? credits.balance >= requiredCredits : false
  }

  const useCredit = async (_coinSymbol: string, _featureType = 'analysis'): Promise<boolean> => {
    if (!credits || credits.balance < 1) {
      throw new Error('Insufficient credits')
    }

    // Simulate API call to use credit
    try {
      setCredits(prev => prev ? {
        ...prev,
        balance: prev.balance - 1,
        totalUsed: prev.totalUsed + 1
      } : null)
      return true
    } catch {
      setError('Failed to use credit')
      return false
    }
  }

  const purchaseCredits = async (packageType: string): Promise<boolean> => {
    // This will later integrate with NOWPayments
    // For now, simulate successful purchase
    try {
      const creditAmounts = {
        starter: 20,
        popular: 50,
        premium: 100,
        whale: 250
      }

      const creditsToAdd = creditAmounts[packageType as keyof typeof creditAmounts] || 20

      setCredits(prev => prev ? {
        ...prev,
        balance: prev.balance + creditsToAdd,
        totalPurchased: prev.totalPurchased + creditsToAdd
      } : {
        balance: creditsToAdd,
        totalPurchased: creditsToAdd,
        totalUsed: 0
      })

      return true
    } catch {
      setError('Failed to purchase credits')
      return false
    }
  }

  const refreshCredits = async (): Promise<void> => {
    if (!isAuthenticated || !user) return

    setIsLoading(true)
    try {
      // Simulate refetch
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    } catch {
      setError('Failed to refresh credits')
      setIsLoading(false)
    }
  }

  return {
    credits,
    isLoading,
    error,
    hasCredits,
    useCredit,
    purchaseCredits,
    refreshCredits
  }
}