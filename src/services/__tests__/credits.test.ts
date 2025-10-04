import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { UserCredits, CreditUsage, CreditPurchase } from '../../types/credits'

// Mock supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        limit: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  })),
}

vi.mock('../../config/supabase', () => ({
  supabase: mockSupabase,
}))

// Import after mocking
const { creditService } = await import('../credits')

describe('Credit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserCredits', () => {
    it('should return user credits when found', async () => {
      const mockUserCredits = {
        balance: 50,
        total_purchased: 100,
        total_used: 50,
      }

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserCredits,
              error: null,
            }),
          }),
        }),
      })

      const result = await creditService.getUserCredits('user-123')

      expect(result).toEqual({
        balance: 50,
        totalPurchased: 100,
        totalUsed: 50,
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('user_credits')
    })

    it('should return default credits when user not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found error
            }),
          }),
        }),
      })

      const result = await creditService.getUserCredits('user-123')

      expect(result).toEqual({
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
      })
    })

    it('should throw error on database error', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' },
            }),
          }),
        }),
      })

      await expect(creditService.getUserCredits('user-123')).rejects.toThrow(
        'Error fetching credits: Database connection failed'
      )
    })
  })

  describe('useCredits', () => {
    it('should successfully use credits when user has sufficient balance', async () => {
      // Mock getUserCredits to return sufficient balance
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 10,
        totalPurchased: 20,
        totalUsed: 10,
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })

      const result = await creditService.useCredits('user-123', 'BTC', 'analysis', 1)

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_usage')
    })

    it('should throw error when user has insufficient credits', async () => {
      // Mock getUserCredits to return insufficient balance
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 0,
        totalPurchased: 5,
        totalUsed: 5,
      })

      await expect(
        creditService.useCredits('user-123', 'BTC', 'analysis', 1)
      ).rejects.toThrow('Insufficient credits')
    })

    it('should throw error when user not found', async () => {
      // Mock getUserCredits to return null
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue(null)

      await expect(
        creditService.useCredits('user-123', 'BTC', 'analysis', 1)
      ).rejects.toThrow('Insufficient credits')
    })

    it('should throw error on database insert failure', async () => {
      // Mock getUserCredits to return sufficient balance
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 10,
        totalPurchased: 20,
        totalUsed: 10,
      })

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      })

      await expect(
        creditService.useCredits('user-123', 'BTC', 'analysis', 1)
      ).rejects.toThrow('Error using credits: Insert failed')
    })

    it('should use default values for optional parameters', async () => {
      // Mock getUserCredits to return sufficient balance
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 10,
        totalPurchased: 20,
        totalUsed: 10,
      })

      const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabase.from.mockReturnValueOnce({
        insert: insertMock,
      })

      await creditService.useCredits('user-123', 'BTC')

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        coin_symbol: 'BTC',
        feature_type: 'analysis',
        credits_used: 1,
      })
    })
  })

  describe('getCreditHistory', () => {
    it('should return credit history with purchases and usage', async () => {
      const mockPurchases = [
        {
          id: 'purchase-1',
          package_type: 'popular',
          total_credits: 50,
          usd_amount: 10.0,
          crypto_currency: 'BTC',
          payment_status: 'completed',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockUsage = [
        {
          coin_symbol: 'BTC',
          feature_type: 'analysis',
          credits_used: 1,
          created_at: '2024-01-01T00:05:00Z',
        },
      ]

      // Mock the Promise.all parallel queries
      const purchaseQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockPurchases,
                error: null,
              }),
            }),
          }),
        }),
      }

      const usageQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockUsage,
                error: null,
              }),
            }),
          }),
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(purchaseQuery) // First call for purchases
        .mockReturnValueOnce(usageQuery)   // Second call for usage

      const result = await creditService.getCreditHistory('user-123', 50)

      expect(result.purchases).toHaveLength(1)
      expect(result.usage).toHaveLength(1)
      expect(result.purchases[0]).toEqual({
        id: 'purchase-1',
        packageType: 'popular',
        totalCredits: 50,
        usdAmount: 10.0,
        cryptoCurrency: 'BTC',
        paymentStatus: 'completed',
        createdAt: '2024-01-01T00:00:00Z',
      })
      expect(result.usage[0]).toEqual({
        coinSymbol: 'BTC',
        featureType: 'analysis',
        creditsUsed: 1,
        createdAt: '2024-01-01T00:05:00Z',
      })
    })

    it('should throw error on purchase history fetch failure', async () => {
      const purchaseQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Purchase fetch failed' },
              }),
            }),
          }),
        }),
      }

      const usageQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(purchaseQuery)
        .mockReturnValueOnce(usageQuery)

      await expect(creditService.getCreditHistory('user-123')).rejects.toThrow(
        'Error fetching purchase history: Purchase fetch failed'
      )
    })

    it('should throw error on usage history fetch failure', async () => {
      const purchaseQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }

      const usageQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Usage fetch failed' },
              }),
            }),
          }),
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(purchaseQuery)
        .mockReturnValueOnce(usageQuery)

      await expect(creditService.getCreditHistory('user-123')).rejects.toThrow(
        'Error fetching usage history: Usage fetch failed'
      )
    })
  })

  describe('hasCreditsForFeature', () => {
    it('should return true when user has sufficient credits', async () => {
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 10,
        totalPurchased: 20,
        totalUsed: 10,
      })

      const result = await creditService.hasCreditsForFeature('user-123', 5)

      expect(result).toBe(true)
    })

    it('should return false when user has insufficient credits', async () => {
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 2,
        totalPurchased: 20,
        totalUsed: 18,
      })

      const result = await creditService.hasCreditsForFeature('user-123', 5)

      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue(null)

      const result = await creditService.hasCreditsForFeature('user-123', 1)

      expect(result).toBe(false)
    })

    it('should use default required credits of 1', async () => {
      vi.spyOn(creditService, 'getUserCredits').mockResolvedValue({
        balance: 1,
        totalPurchased: 5,
        totalUsed: 4,
      })

      const result = await creditService.hasCreditsForFeature('user-123')

      expect(result).toBe(true)
    })
  })

  describe('handlePaymentWebhook', () => {
    it('should handle finished payment webhook', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'finished',
        order_id: 'order-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      })

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Credits activated successfully')
    })

    it('should handle failed payment webhook', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'failed',
        order_id: 'order-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      })

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Payment failed')
    })

    it('should handle expired payment webhook', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'expired',
        order_id: 'order-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        }),
      })

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Payment expired')
    })

    it('should handle database error during webhook processing', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'finished',
        order_id: 'order-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      })

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Database error: Database error')
    })

    it('should handle other payment statuses', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'waiting',
        order_id: 'order-123',
      }

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Webhook processed')
    })

    it('should handle webhook processing errors', async () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'finished',
        order_id: 'order-123',
      }

      // Mock an error being thrown
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await creditService.handlePaymentWebhook(webhookData)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Error processing webhook: Unexpected error')
    })
  })
})