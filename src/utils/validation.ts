import { z } from 'zod'

// Stripe webhook event schemas
export const StripeSubscriptionSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid']),
  metadata: z.record(z.string()).optional(),
  current_period_start: z.number(),
  current_period_end: z.number(),
  cancel_at_period_end: z.boolean(),
  items: z.object({
    data: z.array(z.object({
      price: z.object({
        id: z.string()
      })
    }))
  })
})

export const StripeWebhookEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: StripeSubscriptionSchema
  })
})

// Checkout session parameters schema
export const CheckoutSessionParamsSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email('Valid email is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

// Article data validation schemas
export const MACDDataSchema = z.object({
  MACD: z.number(),
  signal: z.number(),
  histogram: z.number()
})

export const ArticleDataSchema = z.object({
  price: z.number().positive().nullable(),
  rsi: z.number().min(0).max(100).nullable(),
  ema12: z.number().positive().nullable(),
  ema26: z.number().positive().nullable(),
  macd: MACDDataSchema.nullable(),
  cryptoName: z.string().optional()
})

// LLM response validation
export const LLMResponseSchema = z.object({
  text: z.string().min(1, 'Response text cannot be empty'),
  provider: z.enum(['openai', 'ollama', 'template'])
})

// Ollama API response schema
export const OllamaResponseSchema = z.object({
  response: z.string(),
  done: z.boolean().optional(),
  model: z.string().optional()
})

// OpenAI response schema
export const OpenAIResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string().nullable()
    }).optional()
  }))
})

// Type guards using Zod
export const isValidStripeWebhookEvent = (data: unknown): data is z.infer<typeof StripeWebhookEventSchema> => {
  return StripeWebhookEventSchema.safeParse(data).success
}

export const isValidCheckoutSessionParams = (data: unknown): data is z.infer<typeof CheckoutSessionParamsSchema> => {
  return CheckoutSessionParamsSchema.safeParse(data).success
}

export const isValidArticleData = (data: unknown): data is z.infer<typeof ArticleDataSchema> => {
  return ArticleDataSchema.safeParse(data).success
}

// Validation error handling
export class ValidationError extends Error {
  public readonly errors: z.ZodError['errors']
  
  constructor(
    message: string,
    errors: z.ZodError['errors']
  ) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(
      `Validation failed for ${context}`,
      result.error.errors
    )
  }
  return result.data
}

// Export types for convenience
export type StripeSubscription = z.infer<typeof StripeSubscriptionSchema>
export type StripeWebhookEvent = z.infer<typeof StripeWebhookEventSchema>
export type CheckoutSessionParams = z.infer<typeof CheckoutSessionParamsSchema>
export type ArticleData = z.infer<typeof ArticleDataSchema>
export type MACDData = z.infer<typeof MACDDataSchema>
export type LLMResponse = z.infer<typeof LLMResponseSchema>