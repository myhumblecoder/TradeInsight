import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCheckoutSession, handleSubscriptionWebhook } from '../stripe'
import { ValidationError } from '../../utils/validation'

// Mock the loadStripe function
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn(() => Promise.resolve({ error: null }))
  }))
}))

// Mock the supabase client
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('createCheckoutSession validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'cs_test_123' })
    })
  })

  it('should validate correct checkout session parameters', async () => {
    const validParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    }

    const sessionId = await createCheckoutSession(validParams)
    expect(sessionId).toBe('cs_test_123')
  })

  it('should validate minimal checkout session parameters', async () => {
    const minimalParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com'
    }

    const sessionId = await createCheckoutSession(minimalParams)
    expect(sessionId).toBe('cs_test_123')
  })

  it('should throw ValidationError for invalid email', async () => {
    const invalidParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'invalid-email'
    }

    await expect(createCheckoutSession(invalidParams))
      .rejects.toThrow(ValidationError)
  })

  it('should throw ValidationError for empty required fields', async () => {
    const emptyParams = {
      priceId: '',
      userId: 'user_123',
      userEmail: 'user@example.com'
    }

    await expect(createCheckoutSession(emptyParams))
      .rejects.toThrow('Validation failed for checkout session parameters')
  })

  it('should throw ValidationError for invalid URLs', async () => {
    const invalidUrlParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com',
      successUrl: 'not-a-url'
    }

    await expect(createCheckoutSession(invalidUrlParams))
      .rejects.toThrow(ValidationError)
  })

  it('should handle missing parameters', async () => {
    const missingParams = {
      priceId: 'price_1234567890'
      // Missing userId and userEmail
    }

    await expect(createCheckoutSession(missingParams))
      .rejects.toThrow(ValidationError)
  })

  it('should construct proper endpoint URL', async () => {
    const validParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com'
    }

    await createCheckoutSession(validParams)
    
    // The exact URL depends on environment variables, but it should end with the API path
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/create-checkout-session'),
      expect.any(Object)
    )
  })
})

describe('handleSubscriptionWebhook validation', () => {
  it('should validate and process subscription.created webhook', async () => {
    const validWebhook = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'active',
          metadata: { userId: 'user_123' },
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: false,
          items: {
            data: [{
              price: { id: 'price_1234567890' }
            }]
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(validWebhook)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Subscription created successfully')
  })

  it('should validate and process subscription.updated webhook', async () => {
    const validWebhook = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'active',
          metadata: { userId: 'user_123' },
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: true,
          items: {
            data: [{
              price: { id: 'price_1234567890' }
            }]
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(validWebhook)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Subscription updated successfully')
  })

  it('should validate and process subscription.deleted webhook', async () => {
    const validWebhook = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'canceled',
          metadata: { userId: 'user_123' },
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: true,
          items: {
            data: [{
              price: { id: 'price_1234567890' }
            }]
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(validWebhook)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Subscription deleted successfully')
  })

  it('should handle unrecognized webhook types', async () => {
    const unrecognizedWebhook = {
      type: 'customer.subscription.trial_will_end',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'trialing',
          metadata: { userId: 'user_123' },
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: false,
          items: {
            data: [{
              price: { id: 'price_1234567890' }
            }]
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(unrecognizedWebhook)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Event type not handled')
  })

  it('should return validation error for malformed webhook', async () => {
    const malformedWebhook = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'invalid_status', // Invalid status
          current_period_start: 'invalid_timestamp', // Should be number
          current_period_end: 1706572800,
          cancel_at_period_end: false,
          items: {
            data: []
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(malformedWebhook)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid subscription')
  })

  it('should return validation error for missing required fields', async () => {
    const incompleteWebhook = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1234567890'
          // Missing required fields
        }
      }
    }

    const result = await handleSubscriptionWebhook(incompleteWebhook)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Invalid subscription data - missing required fields')
  })

  it('should handle webhook with missing metadata gracefully', async () => {
    const webhookWithoutMetadata = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'active',
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: false,
          items: {
            data: [{
              price: { id: 'price_1234567890' }
            }]
          }
        }
      }
    }

    const result = await handleSubscriptionWebhook(webhookWithoutMetadata)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Subscription created successfully')
  })

  it('should handle completely invalid webhook data', async () => {
    const invalidWebhook = 'not an object'

    const result = await handleSubscriptionWebhook(invalidWebhook)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Validation error')
  })

  it('should handle null webhook data', async () => {
    const result = await handleSubscriptionWebhook(null)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Validation error')
  })

  it('should handle undefined webhook data', async () => {
    const result = await handleSubscriptionWebhook(undefined)
    expect(result.success).toBe(false)
    expect(result.message).toContain('Validation error')
  })
})