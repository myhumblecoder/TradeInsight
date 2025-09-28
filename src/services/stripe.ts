import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../config/supabase'
import { 
  validateOrThrow, 
  StripeWebhookEventSchema, 
  CheckoutSessionParamsSchema,
  ValidationError
} from '../utils/validation'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Re-export the validated type for backwards compatibility
export type { CheckoutSessionParams } from '../utils/validation'

export interface WebhookResult {
  success: boolean
  message: string
}

export const createCheckoutSession = async (params: unknown): Promise<string> => {
  const validatedParams = validateOrThrow(CheckoutSessionParamsSchema, params, 'checkout session parameters')
  const { priceId, userId, userEmail, successUrl, cancelUrl } = validatedParams

  const apiEndpoint = import.meta.env.VITE_API_BASE_URL
  const endpoint = apiEndpoint ? `${apiEndpoint}/api/create-checkout-session` : '/api/create-checkout-session'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId,
      userEmail,
      successUrl: successUrl || `${window.location.origin}/success`,
      cancelUrl: cancelUrl || `${window.location.origin}/cancel`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create checkout session: ${response.status} ${response.statusText}`)
  }

  const { sessionId } = await response.json()
  return sessionId
}

export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  const stripe = await stripePromise

  if (!stripe) {
    throw new Error('Stripe failed to load')
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  })

  if (error) {
    throw new Error(error.message || 'Unknown checkout error')
  }
}

export const handleSubscriptionWebhook = async (webhookData: unknown): Promise<WebhookResult> => {
  try {
    // Validate the webhook payload structure
    const payload = validateOrThrow(StripeWebhookEventSchema, webhookData, 'Stripe webhook event')
    const { type, data } = payload
    const subscription = data.object

    switch (type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (!supabase) {
          return { success: false, message: 'Database not available' }
        }

        const subscriptionData = {
          user_id: subscription.metadata?.userId || null,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id || null,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }

        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
          })

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError)
          return { success: false, message: 'Database error during upsert' }
        }

        return {
          success: true,
          message: type === 'customer.subscription.created'
            ? 'Subscription created successfully'
            : 'Subscription updated successfully',
        }
      }

      case 'customer.subscription.deleted': {
        if (!supabase) {
          return { success: false, message: 'Database not available' }
        }

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('Error updating subscription status:', deleteError)
          return { success: false, message: 'Database error during deletion' }
        }

        return { success: true, message: 'Subscription deleted successfully' }
      }

      default:
        return { success: true, message: 'Event type not handled' }
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    if (error instanceof ValidationError) {
      return {
        success: false,
        message: `Validation error: ${error.message}. Errors: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      }
    }
    
    return {
      success: false,
      message: `Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

export const PRICE_IDS = {
  MONTHLY: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY || 'price_monthly',
} as const