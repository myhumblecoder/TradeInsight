import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PaymentRequest, PaymentResponse } from '../../types/credits'

// Mock environment variables
const mockEnv = {
  VITE_NOWPAYMENTS_API_KEY: 'test_api_key',
  VITE_NOWPAYMENTS_ENVIRONMENT: 'sandbox',
}

vi.stubGlobal('import.meta', {
  env: mockEnv,
})

// Mock supabase
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      })),
    })),
  })),
}

vi.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}))

global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

// Import after mocking to ensure mocks are applied
const { nowPaymentsService, CREDIT_PACKAGES } = await import('../nowpayments')

describe('NOWPayments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CREDIT_PACKAGES', () => {
    it('should have correct package structure', () => {
      expect(CREDIT_PACKAGES).toHaveLength(4)

      const starter = CREDIT_PACKAGES.find(p => p.id === 'starter')
      expect(starter).toEqual({
        id: 'starter',
        name: 'Starter',
        credits: 20,
        bonusCredits: 0,
        totalCredits: 20,
        usdAmount: 5.0,
      })

      const popular = CREDIT_PACKAGES.find(p => p.id === 'popular')
      expect(popular).toEqual({
        id: 'popular',
        name: 'Popular',
        credits: 40,
        bonusCredits: 10,
        totalCredits: 50,
        usdAmount: 10.0,
        popular: true,
      })
    })

    it('should have correct bonus calculations', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        expect(pkg.totalCredits).toBe(pkg.credits + pkg.bonusCredits)
      })
    })
  })

  describe('getAvailableCurrencies', () => {
    it('should fetch available currencies from NOWPayments API', async () => {
      const mockCurrencies = ['btc', 'eth', 'usdt', 'bnb']
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ currencies: mockCurrencies }),
      } as Response)

      const currencies = await nowPaymentsService.getAvailableCurrencies()

      expect(currencies).toEqual(mockCurrencies)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-sandbox.nowpayments.io/v1/currencies',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error' }),
      } as Response)

      await expect(nowPaymentsService.getAvailableCurrencies()).rejects.toThrow(
        'NOWPayments API error: API Error'
      )
    })
  })

  describe('getMinimumPaymentAmount', () => {
    it('should fetch minimum payment amount for currency', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ min_amount: 0.0001 }),
      } as Response)

      const minAmount = await nowPaymentsService.getMinimumPaymentAmount('btc')

      expect(minAmount).toBe(0.0001)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-sandbox.nowpayments.io/v1/min-amount?currency_from=btc&currency_to=usd',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('createPayment', () => {
    it('should create payment with correct data', async () => {
      const paymentRequest: PaymentRequest = {
        price_amount: 10.0,
        price_currency: 'usd',
        pay_currency: 'btc',
        order_id: 'test_order_123',
        order_description: 'Test Payment',
        ipn_callback_url: 'http://localhost:3000/api/nowpayments/webhook',
        success_url: 'http://localhost:3000/credits/success',
        cancel_url: 'http://localhost:3000/credits/cancel',
      }

      const mockPaymentResponse: PaymentResponse = {
        payment_id: 'payment_123',
        payment_status: 'waiting',
        pay_address: 'bc1test123',
        pay_amount: 0.0003,
        pay_currency: 'btc',
        price_amount: 10.0,
        price_currency: 'usd',
        order_id: 'test_order_123',
        order_description: 'Test Payment',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPaymentResponse),
      } as Response)

      const result = await nowPaymentsService.createPayment(paymentRequest)

      expect(result).toEqual(mockPaymentResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-sandbox.nowpayments.io/v1/payment',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(paymentRequest),
        })
      )
    })
  })

  describe('getPaymentStatus', () => {
    it('should fetch payment status', async () => {
      const mockPaymentResponse: PaymentResponse = {
        payment_id: 'payment_123',
        payment_status: 'finished',
        pay_address: 'bc1test123',
        pay_amount: 0.0003,
        pay_currency: 'btc',
        price_amount: 10.0,
        price_currency: 'usd',
        order_id: 'test_order_123',
        order_description: 'Test Payment',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPaymentResponse),
      } as Response)

      const result = await nowPaymentsService.getPaymentStatus('payment_123')

      expect(result).toEqual(mockPaymentResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-sandbox.nowpayments.io/v1/payment/payment_123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('createCreditPurchase', () => {
    it('should create credit purchase with popular package', async () => {
      const userId = 'user-123'
      const packageId = 'popular'
      const payCurrency = 'btc'

      // Mock minimum amount check
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ min_amount: 2.0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            payment_id: 'payment_123',
            payment_status: 'waiting',
            pay_address: 'bc1test123',
            pay_amount: 0.0003,
            pay_currency: 'btc',
            price_amount: 10.0,
            price_currency: 'usd',
            order_id: expect.stringContaining('credit_user-123_'),
            order_description: 'TradeInsight Popular Package - 50 credits',
            created_at: '2024-01-01T00:00:00Z',
          }),
        } as Response)

      const result = await nowPaymentsService.createCreditPurchase(
        userId,
        packageId,
        payCurrency
      )

      expect(result.payment_id).toBe('payment_123')
      expect(result.payment_status).toBe('waiting')
      expect(result.order_description).toBe('TradeInsight Popular Package - 50 credits')
    })

    it('should throw error for invalid package ID', async () => {
      await expect(
        nowPaymentsService.createCreditPurchase('user-123', 'invalid', 'btc')
      ).rejects.toThrow('Invalid package ID')
    })

    it('should throw error when amount is below minimum', async () => {
      // Mock minimum amount check to return higher than package amount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ min_amount: 20.0 }), // Higher than starter package
      } as Response)

      await expect(
        nowPaymentsService.createCreditPurchase('user-123', 'starter', 'btc')
      ).rejects.toThrow('Minimum payment amount for btc is $20')
    })

    it('should handle database errors gracefully', async () => {
      // Mock successful minimum amount check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ min_amount: 2.0 }),
      } as Response)

      // Mock database error
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      })

      await expect(
        nowPaymentsService.createCreditPurchase('user-123', 'starter', 'btc')
      ).rejects.toThrow('Database error: Database connection failed')
    })
  })

  describe('API configuration', () => {
    it('should use sandbox URL by default', () => {
      expect(nowPaymentsService.baseUrl).toBe('https://api-sandbox.nowpayments.io/v1')
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(nowPaymentsService.getAvailableCurrencies()).rejects.toThrow(
        'Network error'
      )
    })

    it('should handle API errors with custom messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid API key' }),
      } as Response)

      await expect(nowPaymentsService.getAvailableCurrencies()).rejects.toThrow(
        'NOWPayments API error: Invalid API key'
      )
    })

    it('should handle API errors without custom messages', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: () => Promise.resolve({}),
      } as Response)

      await expect(nowPaymentsService.getAvailableCurrencies()).rejects.toThrow(
        'NOWPayments API error: Bad Request'
      )
    })
  })
})