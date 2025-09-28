import OpenAI from 'openai'
import { 
  validateOrThrow, 
  ArticleDataSchema, 
  OllamaResponseSchema, 
  OpenAIResponseSchema,
  type ArticleData,
  type LLMResponse
} from './validation'

// LLM Provider Types
type LLMProvider = 'openai' | 'ollama' | 'template'

// Re-export validated types for backwards compatibility
export type { ArticleData, LLMResponse } from './validation'

interface ArticleResult {
  text: string
  confidence: number
}

// In-memory cache for LLM responses
interface CacheEntry {
  result: ArticleResult
  timestamp: number
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Generate cache key from article data and provider
const generateCacheKey = (data: ArticleData, provider: LLMProvider): string => {
  return JSON.stringify({
    provider,
    price: Math.round(data.price || 0),
    rsi: Math.round(data.rsi || 0),
    ema12: Math.round(data.ema12 || 0),
    ema26: Math.round(data.ema26 || 0),
    macd: data.macd ? {
      MACD: Math.round(data.macd.MACD),
      signal: Math.round(data.macd.signal),
      histogram: Math.round(data.macd.histogram)
    } : null,
    cryptoName: data.cryptoName || 'Bitcoin'
  })
}

// Check if cache entry is still valid
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION
}

// Clean expired cache entries
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp >= CACHE_DURATION) {
      responseCache.delete(key)
    }
  }
}

// Ollama client function
const callOllama = async (prompt: string, model: string = 'llama3.1:8b'): Promise<string> => {
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API failed: ${response.status} ${response.statusText}`)
  }

  const rawData = await response.json()
  const data = validateOrThrow(OllamaResponseSchema, rawData, 'Ollama API response')
  return data.response?.trim() || ''
}

// OpenAI client function  
const callOpenAI = async (prompt: string): Promise<string> => {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('No OpenAI API key available')
  }
  
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  })

  const validatedResponse = validateOrThrow(OpenAIResponseSchema, completion, 'OpenAI API response')
  const text = validatedResponse.choices[0]?.message?.content?.trim()
  
  if (!text) {
    throw new Error('No response from OpenAI')
  }

  return text
}

// Smart LLM caller with fallback chain
const callLLM = async (prompt: string, preferredProvider: LLMProvider = 'ollama'): Promise<LLMResponse> => {
  // Try preferred provider first
  if (preferredProvider === 'ollama') {
    try {
      const text = await callOllama(prompt)
      return { text, provider: 'ollama' }
    } catch (error) {
      console.warn('Ollama failed, trying OpenAI fallback:', error)
      
      // Fallback to OpenAI
      try {
        const text = await callOpenAI(prompt)
        return { text, provider: 'openai' }
      } catch (openaiError) {
        console.warn('OpenAI also failed:', openaiError)
        throw new Error('All LLM providers failed')
      }
    }
  }
  
  if (preferredProvider === 'openai') {
    try {
      const text = await callOpenAI(prompt)
      return { text, provider: 'openai' }
    } catch (error) {
      console.warn('OpenAI failed, trying Ollama fallback:', error)
      
      // Fallback to Ollama
      try {
        const text = await callOllama(prompt)
        return { text, provider: 'ollama' }
      } catch (ollamaError) {
        console.warn('Ollama also failed:', ollamaError)
        throw new Error('All LLM providers failed')
      }
    }
  }

  throw new Error('Invalid provider')
}

const calculateConfidence = (data: ArticleData): number => {
  if (!data.price) return 0

  let confidence = 50 // Base

  if (data.rsi) {
    if (data.rsi > 70 || data.rsi < 30) {
      confidence += 10
    }
  }

  if (data.ema12 && data.ema26) {
    confidence += 15
  }

  if (data.macd) {
    confidence += 15
  }

  return Math.max(0, Math.min(100, confidence))
}

export const generateArticle = (data: unknown): ArticleResult => {
  const validatedData = validateOrThrow(ArticleDataSchema, data, 'article generation data')
  if (!validatedData.price) {
    return {
      text: 'Data unavailable. Please try again later.',
      confidence: 0,
    }
  }

  const cryptoName = validatedData.cryptoName || 'Bitcoin'

  let text = `${cryptoName} is currently trading at $${validatedData.price}. `

  let confidence = 50 // Base

  if (validatedData.rsi) {
    if (validatedData.rsi > 70) {
      text += 'The RSI indicates overbought conditions, suggesting a potential sell signal. '
      confidence += 10
    } else if (validatedData.rsi < 30) {
      text += 'The RSI indicates oversold conditions, suggesting a potential buy signal. '
      confidence += 10
    } else {
      text += 'The RSI is in a neutral range. '
    }
  }

  if (validatedData.ema12 && validatedData.ema26) {
    if (validatedData.ema12 > validatedData.ema26) {
      text += 'The short-term EMA is above the long-term EMA, indicating bullish momentum. '
      confidence += 15
    } else {
      text += 'The short-term EMA is below the long-term EMA, indicating bearish momentum. '
      confidence -= 15
    }
  }

  if (validatedData.macd) {
    if (validatedData.macd.histogram > 0) {
      text += 'The MACD histogram is positive, supporting upward momentum. '
      confidence += 15
    } else {
      text += 'The MACD histogram is negative, suggesting downward pressure. '
      confidence -= 15
    }
  }

  text += 'Consider stop loss at 5% below current price for risk management. Bid and sell based on market conditions.'

  confidence = Math.max(0, Math.min(100, confidence))

  return { text, confidence }
}

export const generateLLMArticle = async (
  data: unknown, 
  useEnhanced: boolean = false, 
  preferredProvider: LLMProvider = 'ollama'
): Promise<ArticleResult> => {
  const validatedData = validateOrThrow(ArticleDataSchema, data, 'LLM article generation data')
  // Fallback to template if not using enhanced mode
  if (!useEnhanced) {
    return generateArticle(validatedData)
  }

  // Check cache first
  const cacheKey = generateCacheKey(validatedData, preferredProvider)
  const cachedEntry = responseCache.get(cacheKey)
  
  if (cachedEntry && isCacheValid(cachedEntry)) {
    console.log(`Using cached LLM response (${preferredProvider})`)
    return cachedEntry.result
  }

  // Clean expired entries periodically
  if (responseCache.size > 10) {
    cleanExpiredCache()
  }

  try {
    const prompt = `Generate a natural, engaging market analysis article for ${validatedData.cryptoName || 'Bitcoin'} based on the following technical data:

Price: $${validatedData.price}
RSI: ${validatedData.rsi || 'N/A'}
EMA 12: ${validatedData.ema12 || 'N/A'}
EMA 26: ${validatedData.ema26 || 'N/A'}
MACD: ${validatedData.macd ? `MACD: ${validatedData.macd.MACD}, Signal: ${validatedData.macd.signal}, Histogram: ${validatedData.macd.histogram}` : 'N/A'}

Write a concise, professional analysis (2-3 sentences) that explains the current market situation and provides actionable insights. Make it sound natural and engaging, not like a template.`

    const llmResponse = await callLLM(prompt, preferredProvider)
    const confidence = calculateConfidence(validatedData)
    const result = { text: llmResponse.text, confidence }

    // Cache the successful result
    responseCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })

    console.log(`Cached new LLM response (${llmResponse.provider})`)
    return result
  } catch (error) {
    console.warn('All LLM providers failed, falling back to template:', error)
    return generateArticle(validatedData)
  }
}

// Export cache utilities for debugging/testing
export const getCacheInfo = () => ({
  size: responseCache.size,
  entries: Array.from(responseCache.keys()),
  duration: CACHE_DURATION
})

export const clearCache = () => {
  responseCache.clear()
  console.log('LLM response cache cleared')
}