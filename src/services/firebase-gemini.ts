import { VertexAI } from '@google-cloud/vertexai'
import { z } from 'zod'

export const GeminiConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  location: z.string().default('us-central1'),
  apiKey: z.string().min(1, 'API key is required'),
  cacheOptions: z
    .object({
      ttl: z.number().default(20 * 60 * 1000), // 20 minutes
      maxSize: z.number().default(100),
    })
    .optional(),
})

export const GeminiModelSchema = z.enum([
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-pro-experimental',
])

export const AnalysisTypeSchema = z.enum([
  'market-insights',
  'technical-report',
])

export const PriceAnalysisSchema = z.object({
  entryPoints: z.object({
    conservative: z.number(),
    moderate: z.number(),
    aggressive: z.number(),
  }),
  stopLoss: z.object({
    price: z.number(),
    method: z.string(),
  }),
  profitTargets: z.object({
    target1: z.number(),
    target2: z.number(),
  }),
  riskAssessment: z.string(),
  confidence: z.number().min(0).max(1),
})

export const AnalysisRequestSchema = z.object({
  cryptoName: z.string().min(1),
  price: z.number().positive(),
  timeframe: z.string().optional(),
  rsi: z.number().optional(),
  ema12: z.number().optional(),
  ema26: z.number().optional(),
  macd: z
    .object({
      MACD: z.number(),
      signal: z.number(),
      histogram: z.number(),
    })
    .optional(),
  priceAnalysis: PriceAnalysisSchema.optional(),
  analysisType: AnalysisTypeSchema,
})

export const GenerationConfigSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  maxOutputTokens: z.number().min(1).max(8192).default(1024),
  topP: z.number().min(0).max(1).default(0.8),
  topK: z.number().min(1).max(40).default(40),
})

export type GeminiConfig = z.infer<typeof GeminiConfigSchema>
export type GeminiModel = z.infer<typeof GeminiModelSchema>
export type AnalysisType = z.infer<typeof AnalysisTypeSchema>
export type PriceAnalysis = z.infer<typeof PriceAnalysisSchema>
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>
export type GenerationConfig = z.infer<typeof GenerationConfigSchema>

export type AnalysisResponse = {
  text: string
  model: GeminiModel
  tokensUsed: number
  confidence: number
  generatedAt: Date
  metadata: {
    analysisType: AnalysisType
    cryptoName: string
    timeframe?: string
    fromCache?: boolean
    retryCount?: number
  }
}

export type BatchAnalysisResult = {
  success: boolean
  result?: AnalysisResponse
  error?: string
}

export type CacheStats = {
  size: number
  hitRate: number
  totalRequests: number
  cacheHits: number
}

export type UsageAnalytics = {
  totalRequests: number
  totalTokens: number
  estimatedCost: number
  averageTokensPerRequest: number
  modelUsage: Record<GeminiModel, number>
}

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  version: string
  lastError: string | null
  requestsProcessed: number
}

interface CacheEntry {
  response: AnalysisResponse
  timestamp: number
}

export class FirebaseGeminiService {
  private vertexAI: VertexAI
  private config: Required<GeminiConfig>
  private currentModel: GeminiModel = 'gemini-pro'
  private cache = new Map<string, CacheEntry>()
  private startTime = Date.now()

  // Analytics
  private totalRequests = 0
  private cacheHits = 0
  private totalTokens = 0
  private modelUsage: Record<GeminiModel, number> = {
    'gemini-pro': 0,
    'gemini-pro-vision': 0,
    'gemini-pro-experimental': 0,
  }
  private lastError: string | null = null

  constructor(config: GeminiConfig) {
    try {
      this.config = {
        ...GeminiConfigSchema.parse(config),
        cacheOptions: {
          ttl: 20 * 60 * 1000,
          maxSize: 100,
          ...(config.cacheOptions || {}),
        },
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Gemini configuration: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      throw error
    }

    this.vertexAI = new VertexAI({
      project: this.config.projectId,
      location: this.config.location,
    })
  }

  // Model management
  getAvailableModels(): GeminiModel[] {
    return ['gemini-pro', 'gemini-pro-vision', 'gemini-pro-experimental']
  }

  validateModel(model: GeminiModel): void {
    try {
      GeminiModelSchema.parse(model)
    } catch {
      throw new Error(`Invalid model: ${model}`)
    }
  }

  setModel(model: GeminiModel): void {
    this.validateModel(model)
    this.currentModel = model
  }

  // Cache management
  private generateCacheKey(
    request: AnalysisRequest,
    config?: GenerationConfig
  ): string {
    return JSON.stringify({
      model: this.currentModel,
      request: {
        cryptoName: request.cryptoName,
        price: Math.round(request.price),
        analysisType: request.analysisType,
        timeframe: request.timeframe || '1d',
        rsi: request.rsi ? Math.round(request.rsi) : null,
        ema12: request.ema12 ? Math.round(request.ema12) : null,
        ema26: request.ema26 ? Math.round(request.ema26) : null,
        macd: request.macd
          ? {
              MACD: Math.round(request.macd.MACD),
              signal: Math.round(request.macd.signal),
              histogram: Math.round(request.macd.histogram),
            }
          : null,
      },
      config: config || {},
    })
  }

  private getCachedResponse(cacheKey: string): AnalysisResponse | null {
    const entry = this.cache.get(cacheKey)
    if (!entry) return null

    const isExpired =
      Date.now() - entry.timestamp > this.config.cacheOptions.ttl
    if (isExpired) {
      this.cache.delete(cacheKey)
      return null
    }

    this.cacheHits++
    return {
      ...entry.response,
      metadata: {
        ...entry.response.metadata,
        fromCache: true,
      },
    }
  }

  private cacheResponse(cacheKey: string, response: AnalysisResponse): void {
    if (this.cache.size >= this.config.cacheOptions.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toRemove = entries.slice(
        0,
        Math.floor(this.config.cacheOptions.maxSize * 0.2)
      )
      toRemove.forEach(([key]) => this.cache.delete(key))
    }

    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): CacheStats {
    return {
      size: this.cache.size,
      hitRate: this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0,
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
    }
  }

  // Prompt engineering
  private createPrompt(request: AnalysisRequest): string {
    const {
      cryptoName,
      price,
      rsi,
      ema12,
      ema26,
      macd,
      priceAnalysis,
      timeframe,
      analysisType,
    } = request

    const baseData = `
Current Data for ${cryptoName}:
Price: $${price}
RSI: ${rsi || 'N/A'}
EMA 12: ${ema12 || 'N/A'}
EMA 26: ${ema26 || 'N/A'}
MACD: ${macd ? `MACD: ${macd.MACD}, Signal: ${macd.signal}, Histogram: ${macd.histogram}` : 'N/A'}
Timeframe: ${timeframe || '1d'}`

    const priceAnalysisText = priceAnalysis
      ? `
Price Analysis:
- Entry Points: Conservative: $${priceAnalysis.entryPoints.conservative}, Moderate: $${priceAnalysis.entryPoints.moderate}, Aggressive: $${priceAnalysis.entryPoints.aggressive}
- Stop Loss: $${priceAnalysis.stopLoss.price} (${priceAnalysis.stopLoss.method})
- Profit Targets: T1: $${priceAnalysis.profitTargets.target1}, T2: $${priceAnalysis.profitTargets.target2}
- Risk Assessment: ${priceAnalysis.riskAssessment}
- Analysis Confidence: ${Math.round(priceAnalysis.confidence * 100)}%`
      : ''

    if (analysisType === 'market-insights') {
      return `You are a professional crypto trading analyst providing real-time market insights for immediate decision-making.

${baseData}${priceAnalysisText}

Generate actionable market insights focused on:
- **Immediate trading signals** and specific action items
- **Risk-reward analysis** with clear entry/exit recommendations  
- **Short-term outlook** (next few days/weeks)
- **Current market sentiment** and momentum

Format as markdown with:
## Current Signal: [Bullish/Bearish/Neutral]

### Action Items:
- Specific trading recommendations
- Entry levels and timing
- Risk management advice

### Key Risks:
- Main downside scenarios to watch

Keep it concise, actionable, and focused on immediate decisions. Use bullet points and clear formatting.`
    } else {
      return `You are a senior technical analyst providing comprehensive educational analysis for ${cryptoName}.

${baseData}${priceAnalysisText}

Generate an in-depth technical analysis report focused on:
- **Detailed pattern recognition** and chart analysis explanations
- **Longer-term trend analysis** (weeks to months perspective)  
- **Educational content** explaining the "why" behind technical signals
- **Historical context** and comparative market analysis
- **Multiple timeframe perspective**

Format as markdown with:
## Technical Overview

### Chart Pattern Analysis
- Detailed explanation of current patterns
- Historical significance and reliability

### Indicator Deep Dive
- Why each indicator is showing current readings
- What this means for different timeframes

### Longer-Term Outlook
- Monthly/quarterly perspective
- Key levels to watch over time

### Educational Insights
- Why these signals matter
- How to interpret in different market conditions

Focus on education and comprehensive understanding rather than immediate actions.`
    }
  }

  // Content generation
  async generateAnalysis(
    request: AnalysisRequest,
    generationConfig?: Partial<GenerationConfig>
  ): Promise<AnalysisResponse> {
    try {
      // Validate request
      AnalysisRequestSchema.parse(request)

      const config = {
        ...GenerationConfigSchema.parse(generationConfig || {}),
        ...generationConfig,
      }

      // Check cache
      const cacheKey = this.generateCacheKey(request, config)
      const cachedResponse = this.getCachedResponse(cacheKey)
      if (cachedResponse) {
        return cachedResponse
      }

      this.totalRequests++
      this.modelUsage[this.currentModel]++

      const model = this.vertexAI.preview.getGenerativeModel({
        model: this.currentModel,
        generationConfig: config,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      })

      const prompt = this.createPrompt(request)

      // Retry logic
      let lastError: Error
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await model.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
          })

          const response = result.response
          const text = response.text()

          if (!text) {
            const candidate = response.candidates?.[0]
            if (candidate?.finishReason === 'SAFETY') {
              throw new Error('Content was blocked by safety filters')
            }
            throw new Error('No response generated')
          }

          // Count tokens for the generated response
          const tokenCount = await model.countTokens({
            contents: [{ role: 'model', parts: [{ text }] }],
          })

          this.totalTokens += tokenCount.totalTokens || 0

          const analysisResponse: AnalysisResponse = {
            text,
            model: this.currentModel,
            tokensUsed: tokenCount.totalTokens || 0,
            confidence: this.calculateConfidence(request),
            generatedAt: new Date(),
            metadata: {
              analysisType: request.analysisType,
              cryptoName: request.cryptoName,
              timeframe: request.timeframe,
              retryCount: attempt - 1,
            },
          }

          // Cache the response
          this.cacheResponse(cacheKey, analysisResponse)

          return analysisResponse
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error('Unknown error')

          if (error instanceof Error) {
            if (error.message.includes('Quota exceeded')) {
              throw new Error('Quota exceeded')
            }
            if (error.message.includes('API key')) {
              throw new Error('Authentication failed')
            }
            if (attempt === 3) {
              this.lastError = error.message
              throw new Error(
                `Analysis generation failed after ${attempt} retries: ${error.message}`
              )
            }
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
        }
      }

      throw new Error(`Analysis generation failed: ${lastError!.message}`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid analysis request: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      if (error instanceof Error) {
        throw new Error(`Analysis generation failed: ${error.message}`)
      }
      throw new Error('Analysis generation failed: Unknown error')
    }
  }

  async generateAnalysisStream(
    request: AnalysisRequest,
    onChunk: (chunk: string) => void,
    generationConfig?: Partial<GenerationConfig>
  ): Promise<void> {
    try {
      AnalysisRequestSchema.parse(request)

      const config = {
        ...GenerationConfigSchema.parse(generationConfig || {}),
        ...generationConfig,
      }

      this.totalRequests++
      this.modelUsage[this.currentModel]++

      const model = this.vertexAI.preview.getGenerativeModel({
        model: this.currentModel,
        generationConfig: config,
      })

      const prompt = this.createPrompt(request)

      const result = await model.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      })

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          onChunk(text)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Stream generation failed: ${error.message}`)
      }
      throw new Error('Stream generation failed: Unknown error')
    }
  }

  async generateAnalysisBatch(
    requests: AnalysisRequest[],
    options: { continueOnError?: boolean } = {}
  ): Promise<BatchAnalysisResult[]> {
    const results: BatchAnalysisResult[] = []

    for (const request of requests) {
      try {
        const result = await this.generateAnalysis(request)
        results.push({ success: true, result })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        results.push({ success: false, error: errorMessage })

        if (!options.continueOnError) {
          break
        }
      }
    }

    return results
  }

  // Utility methods
  private calculateConfidence(request: AnalysisRequest): number {
    let confidence = 0.5 // Base confidence

    if (request.rsi) {
      confidence += 0.1
      if (request.rsi > 70 || request.rsi < 30) {
        confidence += 0.1
      }
    }

    if (request.ema12 && request.ema26) {
      confidence += 0.1
    }

    if (request.macd) {
      confidence += 0.1
    }

    if (request.priceAnalysis) {
      confidence += 0.2
    }

    return Math.min(1, Math.max(0, confidence))
  }

  calculateEstimatedCost(tokens: number): number {
    // Gemini Pro pricing: $0.0005 per 1K tokens for input, $0.0015 per 1K tokens for output
    // Simplified calculation assuming 50/50 input/output split
    const inputTokens = tokens * 0.5
    const outputTokens = tokens * 0.5

    const inputCost = (inputTokens / 1000) * 0.0005
    const outputCost = (outputTokens / 1000) * 0.0015

    return inputCost + outputCost
  }

  getUsageAnalytics(): UsageAnalytics {
    return {
      totalRequests: this.totalRequests,
      totalTokens: this.totalTokens,
      estimatedCost: this.calculateEstimatedCost(this.totalTokens),
      averageTokensPerRequest:
        this.totalRequests > 0 ? this.totalTokens / this.totalRequests : 0,
      modelUsage: { ...this.modelUsage },
    }
  }

  getHealthStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime
    const errorRate = this.totalRequests > 0 ? (this.lastError ? 1 : 0) : 0

    let status: HealthStatus['status'] = 'healthy'
    if (errorRate > 0.1) {
      status = 'degraded'
    }
    if (errorRate > 0.5) {
      status = 'unhealthy'
    }

    return {
      status,
      uptime,
      version: '1.0.0',
      lastError: this.lastError,
      requestsProcessed: this.totalRequests,
    }
  }
}
