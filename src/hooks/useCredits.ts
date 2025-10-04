import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { creditService } from '../services/credits'
import { nowPaymentsService } from '../services/nowpayments'
import type { UserCredits } from '../types/credits'
import type { PaymentResponse } from '../types/credits'

export function useCredits() {
  const { user, isAuthenticated } = useAuth()
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load user credits when authenticated
  const loadCredits = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCredits(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const userCredits = await creditService.getUserCredits(user.id)
      setCredits(userCredits)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to load credits: ${message}`)
      setCredits(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  const hasCredits = (requiredCredits: number = 1): boolean => {
    return credits ? credits.balance >= requiredCredits : false
  }

  const useCredit = async (
    coinSymbol: string,
    featureType: string = 'analysis',
    creditsToUse: number = 1
  ): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated')
      return false
    }

    try {
      await creditService.useCredits(user.id, coinSymbol, featureType, creditsToUse)
      // Refresh credits after using
      await loadCredits()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to use credit: ${message}`)
      return false
    }
  }

  const purchaseCredits = async (
    packageType: string,
    payCurrency: string = 'btc'
  ): Promise<PaymentResponse | null> => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated')
      return null
    }

    try {
      const paymentResponse = await nowPaymentsService.createCreditPurchase(
        user.id,
        packageType,
        payCurrency
      )
      return paymentResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to create payment: ${message}`)
      return null
    }
  }

  const refreshCredits = async (): Promise<void> => {
    if (!isAuthenticated || !user) return

    try {
      const userCredits = await creditService.getUserCredits(user.id)
      setCredits(userCredits)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to refresh credits: ${message}`)
    }
  }

  const clearError = (): void => {
    setError(null)
  }

  return {
    credits,
    isLoading,
    error,
    hasCredits,
    useCredit,
    purchaseCredits,
    refreshCredits,
    clearError,
  }
}
