import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession, redirectToCheckout, handleSubscriptionWebhook } from '../stripe'

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn()
}))

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    }))
  }
}))

const mockLoadStripe = vi.mocked(loadStripe)

global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('Stripe Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock loadStripe to return null by default, tests will override as needed
    mockLoadStripe.mockResolvedValue(null)
    
    process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
  })

  describe('createCheckoutSession', () => {
    it('should create a checkout session and return session ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'cs_test_123'
        })
      } as Response)

      const sessionId = await createCheckoutSession({
        priceId: 'price_123',
        userId: 'user-1',
        userEmail: 'test@example.com'
      })

      expect(sessionId).toBe('cs_test_123')
      expect(mockFetch).toHaveBeenCalledWith('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          priceId: 'price_123',
          userId: 'user-1',
          userEmail: 'test@example.com',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel'
        })
      })
    })

    it('should throw error when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response)

      await expect(createCheckoutSession({
        priceId: 'price_123',
        userId: 'user-1',
        userEmail: 'test@example.com'
      })).rejects.toThrow('Failed to create checkout session: 400 Bad Request')
    })
  })

  describe('redirectToCheckout', () => {
    it('should redirect to Stripe checkout', async () => {
      const mockStripe = {
        redirectToCheckout: vi.fn().mockResolvedValue({ error: null })
      }
      mockLoadStripe.mockResolvedValueOnce(mockStripe as unknown as Awaited<ReturnType<typeof loadStripe>>)

      await redirectToCheckout('cs_test_123')

      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123')
      expect(mockStripe.redirectToCheckout).toHaveBeenCalledWith({
        sessionId: 'cs_test_123'
      })
    })

    it('should throw error when Stripe fails to load', async () => {
      mockLoadStripe.mockResolvedValueOnce(null)

      await expect(redirectToCheckout('cs_test_123')).rejects.toThrow('Stripe failed to load')
    })

    it('should throw error when checkout redirect fails', async () => {
      const mockStripe = {
        redirectToCheckout: vi.fn().mockResolvedValue({
          error: { message: 'Payment failed' }
        })
      }
      mockLoadStripe.mockResolvedValueOnce(mockStripe as unknown as Awaited<ReturnType<typeof loadStripe>>)

      await expect(redirectToCheckout('cs_test_123')).rejects.toThrow('Payment failed')
    })
  })

  describe('handleSubscriptionWebhook', () => {
    it('should handle subscription created event', async () => {
      const webhookData = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            items: {
              data: [{ price: { id: 'price_123' } }]
            },
            current_period_start: 1640995200,
            current_period_end: 1643587200,
            cancel_at_period_end: false,
            metadata: {
              userId: 'user-1'
            }
          }
        }
      }

      const result = await handleSubscriptionWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Subscription created successfully')
    })

    it('should handle subscription updated event', async () => {
      const webhookData = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'canceled',
            items: {
              data: [{ price: { id: 'price_123' } }]
            },
            current_period_start: 1640995200,
            current_period_end: 1643587200,
            cancel_at_period_end: true,
            metadata: {
              userId: 'user-1'
            }
          }
        }
      }

      const result = await handleSubscriptionWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Subscription updated successfully')
    })

    it('should handle subscription deleted event', async () => {
      const webhookData = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: {
              userId: 'user-1'
            }
          }
        }
      }

      const result = await handleSubscriptionWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Subscription deleted successfully')
    })

    it('should ignore unhandled event types', async () => {
      const webhookData = {
        type: 'payment_intent.succeeded',
        data: {
          object: {}
        }
      }

      const result = await handleSubscriptionWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Event type not handled')
    })

    it('should handle errors gracefully', async () => {
      const webhookData = {
        type: 'customer.subscription.created',
        data: {
          object: {
            // Missing required fields to trigger error
            id: 'sub_123'
          }
        }
      }

      const result = await handleSubscriptionWebhook(webhookData)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid subscription data - missing required fields')
    })
  })
})