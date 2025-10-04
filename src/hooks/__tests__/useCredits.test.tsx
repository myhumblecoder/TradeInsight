import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { UserCredits } from '../../types/credits'

// Mock the services
const mockCreditService = {
  getUserCredits: vi.fn(),
  useCredits: vi.fn(),
  hasCreditsForFeature: vi.fn(),
  getCreditHistory: vi.fn(),
  handlePaymentWebhook: vi.fn(),
}

const mockNowPaymentsService = {
  createCreditPurchase: vi.fn(),
  getPaymentStatus: vi.fn(),
  getAvailableCurrencies: vi.fn(),
  getMinimumPaymentAmount: vi.fn(),
}

vi.mock('../../services/credits', () => ({
  creditService: mockCreditService,
}))

vi.mock('../../services/nowpayments', () => ({
  nowPaymentsService: mockNowPaymentsService,
  CREDIT_PACKAGES: [
    {
      id: 'starter',
      name: 'Starter',
      credits: 20,
      bonusCredits: 0,
      totalCredits: 20,
      usdAmount: 5.0,
    },
    {
      id: 'popular',
      name: 'Popular',
      credits: 40,
      bonusCredits: 10,
      totalCredits: 50,
      usdAmount: 10.0,
      popular: true,
    },
  ],
}))

// Mock useAuth hook
const mockUseAuth = {
  user: { id: 'user-123', email: 'test@example.com' },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
}

vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth,
}))

// Import after setting up mocks
const { useCredits } = await import('../useCredits')

describe('useCredits Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock returns for credit service
    mockCreditService.getUserCredits.mockResolvedValue({
      balance: 10,
      totalPurchased: 50,
      totalUsed: 40,
    })
    mockCreditService.hasCreditsForFeature.mockResolvedValue(true)
    mockCreditService.useCredits.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with loading state', async () => {
      const { result } = renderHook(() => useCredits())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.credits).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should load user credits when authenticated', async () => {
      const mockCredits: UserCredits = {
        balance: 25,
        totalPurchased: 100,
        totalUsed: 75,
      }

      mockCreditService.getUserCredits.mockResolvedValue(mockCredits)

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.credits).toEqual(mockCredits)
      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user-123')
    })

    it('should not load credits when not authenticated', async () => {
      mockUseAuth.isAuthenticated = false
      mockUseAuth.user = null

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.credits).toBeNull()
      expect(mockCreditService.getUserCredits).not.toHaveBeenCalled()

      // Reset for other tests
      mockUseAuth.isAuthenticated = true
      mockUseAuth.user = { id: 'user-123', email: 'test@example.com' }
    })

    it('should handle errors when loading credits', async () => {
      mockCreditService.getUserCredits.mockRejectedValue(new Error('Database error'))

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load credits: Database error')
      expect(result.current.credits).toBeNull()
    })
  })

  describe('hasCredits', () => {
    it('should return true when user has sufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 10,
        totalPurchased: 50,
        totalUsed: 40,
      })

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCredits(5)).toBe(true)
      expect(result.current.hasCredits(10)).toBe(true)
    })

    it('should return false when user has insufficient credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 3,
        totalPurchased: 50,
        totalUsed: 47,
      })

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCredits(5)).toBe(false)
      expect(result.current.hasCredits(1)).toBe(true)
    })

    it('should return false when credits is null', async () => {
      mockCreditService.getUserCredits.mockResolvedValue(null)

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCredits(1)).toBe(false)
    })

    it('should use default of 1 credit when no parameter provided', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 1,
        totalPurchased: 10,
        totalUsed: 9,
      })

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCredits()).toBe(true)
    })
  })

  describe('useCredit', () => {
    it('should successfully use a credit for coin analysis', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 10,
        totalPurchased: 50,
        totalUsed: 40,
      })

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const success = await result.current.useCredit('BTC', 'analysis')
        expect(success).toBe(true)
      })

      expect(mockCreditService.useCredits).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        'analysis',
        1
      )

      // Should refresh credits after using
      expect(mockCreditService.getUserCredits).toHaveBeenCalledTimes(2)
    })

    it('should handle errors when using credits', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 10,
        totalPurchased: 50,
        totalUsed: 40,
      })

      mockCreditService.useCredits.mockRejectedValue(new Error('Insufficient credits'))

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const success = await result.current.useCredit('BTC', 'analysis')
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Failed to use credit: Insufficient credits')
    })

    it('should use default parameters', async () => {
      mockCreditService.getUserCredits.mockResolvedValue({
        balance: 10,
        totalPurchased: 50,
        totalUsed: 40,
      })

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.useCredit('BTC')
      })

      expect(mockCreditService.useCredits).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        'analysis',
        1
      )
    })
  })

  describe('purchaseCredits', () => {
    it('should successfully purchase credits', async () => {
      const mockPaymentResponse = {
        payment_id: 'payment-123',
        payment_status: 'waiting',
        pay_address: 'bc1test123',
        pay_amount: 0.0003,
        pay_currency: 'btc',
        price_amount: 10.0,
        price_currency: 'usd',
        order_id: 'order-123',
        order_description: 'Test Payment',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockNowPaymentsService.createCreditPurchase.mockResolvedValue(mockPaymentResponse)

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const paymentResponse = await result.current.purchaseCredits('popular', 'btc')
        expect(paymentResponse).toEqual(mockPaymentResponse)
      })

      expect(mockNowPaymentsService.createCreditPurchase).toHaveBeenCalledWith(
        'user-123',
        'popular',
        'btc'
      )
    })

    it('should handle errors during credit purchase', async () => {
      mockNowPaymentsService.createCreditPurchase.mockRejectedValue(
        new Error('Payment processing failed')
      )

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const paymentResponse = await result.current.purchaseCredits('popular', 'btc')
        expect(paymentResponse).toBeNull()
      })

      expect(result.current.error).toBe('Failed to create payment: Payment processing failed')
    })

    it('should use default currency', async () => {
      const mockPaymentResponse = {
        payment_id: 'payment-123',
        payment_status: 'waiting',
        pay_address: 'bc1test123',
        pay_amount: 0.0003,
        pay_currency: 'btc',
        price_amount: 10.0,
        price_currency: 'usd',
        order_id: 'order-123',
        order_description: 'Test Payment',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockNowPaymentsService.createCreditPurchase.mockResolvedValue(mockPaymentResponse)

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.purchaseCredits('starter')
      })

      expect(mockNowPaymentsService.createCreditPurchase).toHaveBeenCalledWith(
        'user-123',
        'starter',
        'btc' // default currency
      )
    })
  })

  describe('refreshCredits', () => {
    it('should refresh user credits', async () => {
      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Clear previous calls
      mockCreditService.getUserCredits.mockClear()

      await act(async () => {
        await result.current.refreshCredits()
      })

      expect(mockCreditService.getUserCredits).toHaveBeenCalledWith('user-123')
    })

    it('should handle errors when refreshing credits', async () => {
      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockCreditService.getUserCredits.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.refreshCredits()
      })

      expect(result.current.error).toBe('Failed to refresh credits: Network error')
    })

    it('should not refresh when not authenticated', async () => {
      mockUseAuth.isAuthenticated = false
      mockUseAuth.user = null

      const { result } = renderHook(() => useCredits())

      await act(async () => {
        await result.current.refreshCredits()
      })

      // Should not call the service when not authenticated
      expect(mockCreditService.getUserCredits).not.toHaveBeenCalled()

      // Reset for other tests
      mockUseAuth.isAuthenticated = true
      mockUseAuth.user = { id: 'user-123', email: 'test@example.com' }
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockCreditService.getUserCredits.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useCredits())

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load credits: Test error')
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})