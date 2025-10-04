import { describe, it, expect } from 'vitest'
import {
  StripeWebhookEventSchema,
  CheckoutSessionParamsSchema,
  ArticleDataSchema,
  MACDDataSchema,
  LLMResponseSchema,
  OllamaResponseSchema,
  OpenAIResponseSchema,
  isValidStripeWebhookEvent,
  isValidCheckoutSessionParams,
  isValidArticleData,
  validateOrThrow,
  ValidationError,
} from '../validation'

describe('StripeWebhookEventSchema', () => {
  it('should validate a complete webhook event', () => {
    const validEvent = {
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
            data: [
              {
                price: { id: 'price_1234567890' },
              },
            ],
          },
        },
      },
    }

    const result = StripeWebhookEventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
    expect(isValidStripeWebhookEvent(validEvent)).toBe(true)
  })

  it('should accept unknown webhook event types via passthrough', () => {
    const unknownEvent = {
      type: 'some.unknown.event',
      data: {
        object: {
          id: 'obj_1234567890',
          custom_field: 'custom_value',
          // Any structure is allowed for unknown events
        },
      },
    }

    const result = StripeWebhookEventSchema.safeParse(unknownEvent)
    expect(result.success).toBe(true)
    expect(isValidStripeWebhookEvent(unknownEvent)).toBe(true)
  })

  it('should handle missing metadata', () => {
    const eventWithoutMetadata = {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_1234567890',
          status: 'active',
          current_period_start: 1703980800,
          current_period_end: 1706572800,
          cancel_at_period_end: false,
          items: {
            data: [
              {
                price: { id: 'price_1234567890' },
              },
            ],
          },
        },
      },
    }

    const result = StripeWebhookEventSchema.safeParse(eventWithoutMetadata)
    expect(result.success).toBe(true)
  })
})

describe('CheckoutSessionParamsSchema', () => {
  it('should validate complete checkout session params', () => {
    const validParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    }

    const result = CheckoutSessionParamsSchema.safeParse(validParams)
    expect(result.success).toBe(true)
    expect(isValidCheckoutSessionParams(validParams)).toBe(true)
  })

  it('should validate minimal checkout session params', () => {
    const minimalParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com',
    }

    const result = CheckoutSessionParamsSchema.safeParse(minimalParams)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const invalidParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'invalid-email',
    }

    const result = CheckoutSessionParamsSchema.safeParse(invalidParams)
    expect(result.success).toBe(false)
  })

  it('should reject empty required fields', () => {
    const emptyParams = {
      priceId: '',
      userId: '',
      userEmail: 'user@example.com',
    }

    const result = CheckoutSessionParamsSchema.safeParse(emptyParams)
    expect(result.success).toBe(false)
  })

  it('should reject invalid URLs', () => {
    const invalidUrlParams = {
      priceId: 'price_1234567890',
      userId: 'user_123',
      userEmail: 'user@example.com',
      successUrl: 'not-a-url',
      cancelUrl: 'https://valid-url.com',
    }

    const result = CheckoutSessionParamsSchema.safeParse(invalidUrlParams)
    expect(result.success).toBe(false)
  })
})

describe('ArticleDataSchema', () => {
  it('should validate complete article data', () => {
    const validData = {
      price: 50000.5,
      rsi: 65.5,
      ema12: 49500.25,
      ema26: 49000.75,
      macd: {
        MACD: 200.5,
        signal: 150.25,
        histogram: 50.25,
      },
      cryptoName: 'Bitcoin',
    }

    const result = ArticleDataSchema.safeParse(validData)
    expect(result.success).toBe(true)
    expect(isValidArticleData(validData)).toBe(true)
  })

  it('should validate article data with null values', () => {
    const dataWithNulls = {
      price: null,
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null,
      cryptoName: 'Bitcoin',
    }

    const result = ArticleDataSchema.safeParse(dataWithNulls)
    expect(result.success).toBe(true)
  })

  it('should validate minimal article data', () => {
    const minimalData = {
      price: 50000,
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null,
    }

    const result = ArticleDataSchema.safeParse(minimalData)
    expect(result.success).toBe(true)
  })

  it('should reject negative price', () => {
    const invalidData = {
      price: -50000,
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null,
    }

    const result = ArticleDataSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject RSI out of range', () => {
    const invalidRsiHigh = {
      price: 50000,
      rsi: 150, // RSI should be 0-100
      ema12: null,
      ema26: null,
      macd: null,
    }

    const invalidRsiLow = {
      price: 50000,
      rsi: -10, // RSI should be 0-100
      ema12: null,
      ema26: null,
      macd: null,
    }

    expect(ArticleDataSchema.safeParse(invalidRsiHigh).success).toBe(false)
    expect(ArticleDataSchema.safeParse(invalidRsiLow).success).toBe(false)
  })
})

describe('MACDDataSchema', () => {
  it('should validate MACD data', () => {
    const validMacd = {
      MACD: 100.5,
      signal: 95.25,
      histogram: 5.25,
    }

    const result = MACDDataSchema.safeParse(validMacd)
    expect(result.success).toBe(true)
  })

  it('should reject incomplete MACD data', () => {
    const incompleteMacd = {
      MACD: 100.5,
      signal: 95.25,
      // Missing histogram
    }

    const result = MACDDataSchema.safeParse(incompleteMacd)
    expect(result.success).toBe(false)
  })
})

describe('LLMResponseSchema', () => {
  it('should validate LLM response', () => {
    const validResponse = {
      text: 'Bitcoin analysis shows bullish momentum.',
      provider: 'openai',
    }

    const result = LLMResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  it('should reject empty text', () => {
    const invalidResponse = {
      text: '',
      provider: 'openai',
    }

    const result = LLMResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })

  it('should reject invalid provider', () => {
    const invalidResponse = {
      text: 'Valid text',
      provider: 'invalid_provider',
    }

    const result = LLMResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })
})

describe('OllamaResponseSchema', () => {
  it('should validate Ollama response', () => {
    const validResponse = {
      response: 'Analysis complete',
      done: true,
      model: 'llama3.1:8b',
    }

    const result = OllamaResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  it('should validate minimal Ollama response', () => {
    const minimalResponse = {
      response: 'Analysis complete',
    }

    const result = OllamaResponseSchema.safeParse(minimalResponse)
    expect(result.success).toBe(true)
  })
})

describe('OpenAIResponseSchema', () => {
  it('should validate OpenAI response', () => {
    const validResponse = {
      choices: [
        {
          message: {
            content: 'Analysis complete',
          },
        },
      ],
    }

    const result = OpenAIResponseSchema.safeParse(validResponse)
    expect(result.success).toBe(true)
  })

  it('should validate response with null content', () => {
    const responseWithNull = {
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    }

    const result = OpenAIResponseSchema.safeParse(responseWithNull)
    expect(result.success).toBe(true)
  })

  it('should validate response with missing message', () => {
    const responseWithoutMessage = {
      choices: [{}],
    }

    const result = OpenAIResponseSchema.safeParse(responseWithoutMessage)
    expect(result.success).toBe(true)
  })

  it('should reject response without choices array', () => {
    const invalidResponse = {
      choices: 'not-an-array',
    }

    const result = OpenAIResponseSchema.safeParse(invalidResponse)
    expect(result.success).toBe(false)
  })
})

describe('validateOrThrow', () => {
  it('should return valid data when validation passes', () => {
    const validData = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: null,
    }

    const result = validateOrThrow(ArticleDataSchema, validData, 'test data')
    expect(result).toEqual(validData)
  })

  it('should throw ValidationError when validation fails', () => {
    const invalidData = {
      price: 'not-a-number',
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: null,
    }

    expect(() => {
      validateOrThrow(ArticleDataSchema, invalidData, 'test data')
    }).toThrow(ValidationError)
  })

  it('should include context in error message', () => {
    const invalidData = {
      price: 'not-a-number',
    }

    expect(() => {
      validateOrThrow(ArticleDataSchema, invalidData, 'custom context')
    }).toThrow('Validation failed for custom context')
  })
})

describe('ValidationError', () => {
  it('should properly extend Error', () => {
    const mockErrors = [
      {
        code: 'invalid_type',
        expected: 'number',
        received: 'string',
        path: ['price'],
        message: 'Expected number, received string',
      },
    ]

    const error = new ValidationError('Test validation error', mockErrors)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('Test validation error')
    expect(error.errors).toEqual(mockErrors)
  })
})
