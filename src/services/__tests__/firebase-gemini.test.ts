import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  FirebaseGeminiService,
  type GeminiConfig,
  type AnalysisRequest,
  type AnalysisResponse,
  type GeminiModel
} from '../firebase-gemini'

// Mock Vertex AI
const mockGenerativeModel = {
  generateContent: vi.fn(),
  generateContentStream: vi.fn(),
  countTokens: vi.fn()
}

const mockVertexAI = {
  preview: {
    getGenerativeModel: vi.fn(() => mockGenerativeModel)
  }
}

vi.mock('@google-cloud/vertexai', () => ({
  VertexAI: vi.fn(() => mockVertexAI)
}))

// Mock Firebase Functions
const mockFunctions = {
  httpsCallable: vi.fn()
}

vi.mock('firebase/functions', () => ({
  getFunctions: () => mockFunctions,
  httpsCallable: (...args: unknown[]) => mockFunctions.httpsCallable(...args)
}))

describe('FirebaseGeminiService', () => {
  let geminiService: FirebaseGeminiService
  const mockConfig: GeminiConfig = {
    projectId: 'test-project-id',
    location: 'us-central1',
    apiKey: 'test-api-key'
  }

  const mockAnalysisRequest: AnalysisRequest = {
    cryptoName: 'Bitcoin',
    price: 45000,
    timeframe: '1d',
    rsi: 65,
    ema12: 44000,
    ema26: 43000,
    macd: {
      MACD: 150,
      signal: 120,
      histogram: 30
    },
    priceAnalysis: {
      entryPoints: {
        conservative: 43000,
        moderate: 44000,
        aggressive: 45000
      },
      stopLoss: {
        price: 40000,
        method: 'technical'
      },
      profitTargets: {
        target1: 47000,
        target2: 50000
      },
      riskAssessment: 'medium',
      confidence: 0.75
    },
    analysisType: 'technical-report'
  }

  const mockGeminiResponse = {
    response: {
      text: () => 'Bitcoin is showing bullish momentum with RSI at 65...',
      candidates: [{
        content: {
          parts: [{
            text: 'Bitcoin is showing bullish momentum with RSI at 65...'
          }]
        },
        finishReason: 'STOP',
        safetyRatings: []
      }]
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    geminiService = new FirebaseGeminiService(mockConfig)

    // Setup default mock returns
    mockGenerativeModel.generateContent.mockResolvedValue(mockGeminiResponse)
    mockGenerativeModel.countTokens.mockResolvedValue({ totalTokens: 150 })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(geminiService).toBeInstanceOf(FirebaseGeminiService)
    })

    it('should throw error with invalid configuration', () => {
      const invalidConfig = { ...mockConfig, projectId: '' }
      expect(() => new FirebaseGeminiService(invalidConfig)).toThrow()
    })

    it('should initialize with default location if not provided', () => {
      const configWithoutLocation = { 
        projectId: 'test-project',
        apiKey: 'test-key'
      }
      
      expect(() => new FirebaseGeminiService(configWithoutLocation)).not.toThrow()
    })
  })

  describe('model management', () => {
    it('should get available models correctly', () => {
      const models = geminiService.getAvailableModels()
      
      expect(models).toContain('gemini-pro')
      expect(models).toContain('gemini-pro-vision')
      expect(models.length).toBeGreaterThan(0)
    })

    it('should validate model selection', () => {
      expect(() => geminiService.validateModel('gemini-pro')).not.toThrow()
      expect(() => geminiService.validateModel('invalid-model' as GeminiModel)).toThrow()
    })

    it('should set model correctly', () => {
      geminiService.setModel('gemini-pro-vision')
      // Model should be set internally - verify through generation call
      expect(mockVertexAI.preview.getGenerativeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-pro-vision'
        })
      )
    })
  })

  describe('content generation', () => {
    it('should generate analysis successfully', async () => {
      const result = await geminiService.generateAnalysis(mockAnalysisRequest)

      expect(mockGenerativeModel.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              parts: expect.arrayContaining([
                expect.objectContaining({
                  text: expect.stringContaining('Bitcoin')
                })
              ])
            })
          ])
        })
      )

      expect(result).toEqual({
        text: 'Bitcoin is showing bullish momentum with RSI at 65...',
        model: 'gemini-pro',
        tokensUsed: 150,
        confidence: expect.any(Number),
        generatedAt: expect.any(Date),
        metadata: expect.objectContaining({
          analysisType: 'technical-report',
          cryptoName: 'Bitcoin',
          timeframe: '1d'
        })
      })
    })

    it('should handle different analysis types', async () => {
      const marketInsightsRequest = {
        ...mockAnalysisRequest,
        analysisType: 'market-insights' as const
      }

      await geminiService.generateAnalysis(marketInsightsRequest)

      const callArgs = mockGenerativeModel.generateContent.mock.calls[0][0]
      expect(callArgs.contents[0].parts[0].text).toContain('market insights')
    })

    it('should generate streaming analysis', async () => {
      const mockStream = {
        stream: async function* () {
          yield { text: () => 'Partial text 1...' }
          yield { text: () => 'Partial text 2...' }
        }
      }

      mockGenerativeModel.generateContentStream.mockResolvedValue(mockStream)

      const chunks: string[] = []
      await geminiService.generateAnalysisStream(
        mockAnalysisRequest,
        (chunk) => chunks.push(chunk)
      )

      expect(chunks).toEqual(['Partial text 1...', 'Partial text 2...'])
    })

    it('should handle generation errors appropriately', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(
        new Error('Rate limit exceeded')
      )

      await expect(
        geminiService.generateAnalysis(mockAnalysisRequest)
      ).rejects.toThrow('Analysis generation failed: Rate limit exceeded')
    })

    it('should validate analysis request data', async () => {
      const invalidRequest = {
        ...mockAnalysisRequest,
        price: -1000, // Invalid price
        cryptoName: '' // Empty name
      }

      await expect(
        geminiService.generateAnalysis(invalidRequest)
      ).rejects.toThrow('Invalid analysis request')
    })
  })

  describe('prompt engineering', () => {
    it('should create technical report prompt correctly', async () => {
      await geminiService.generateAnalysis({
        ...mockAnalysisRequest,
        analysisType: 'technical-report'
      })

      const prompt = mockGenerativeModel.generateContent.mock.calls[0][0].contents[0].parts[0].text
      
      expect(prompt).toContain('technical analysis')
      expect(prompt).toContain('Bitcoin')
      expect(prompt).toContain('$45000')
      expect(prompt).toContain('RSI: 65')
      expect(prompt).toContain('EMA 12: 44000')
    })

    it('should create market insights prompt correctly', async () => {
      await geminiService.generateAnalysis({
        ...mockAnalysisRequest,
        analysisType: 'market-insights'
      })

      const prompt = mockGenerativeModel.generateContent.mock.calls[0][0].contents[0].parts[0].text
      
      expect(prompt).toContain('market insights')
      expect(prompt).toContain('trading signals')
      expect(prompt).toContain('immediate')
    })

    it('should include price analysis when available', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest)

      const prompt = mockGenerativeModel.generateContent.mock.calls[0][0].contents[0].parts[0].text
      
      expect(prompt).toContain('Entry Points')
      expect(prompt).toContain('Stop Loss')
      expect(prompt).toContain('Profit Targets')
      expect(prompt).toContain('Risk Assessment: medium')
    })

    it('should handle missing optional data gracefully', async () => {
      const minimalRequest = {
        cryptoName: 'Bitcoin',
        price: 45000,
        analysisType: 'technical-report' as const
      }

      await geminiService.generateAnalysis(minimalRequest)

      const prompt = mockGenerativeModel.generateContent.mock.calls[0][0].contents[0].parts[0].text
      expect(prompt).toContain('Bitcoin')
      expect(prompt).toContain('45000')
    })
  })

  describe('safety and content filtering', () => {
    it('should configure safety settings correctly', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest)

      const callConfig = mockGenerativeModel.generateContent.mock.calls[0][0]
      expect(callConfig).toHaveProperty('safetySettings')
      expect(callConfig.safetySettings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            threshold: expect.any(String)
          })
        ])
      )
    })

    it('should handle blocked content appropriately', async () => {
      const blockedResponse = {
        response: {
          text: () => '',
          candidates: [{
            content: { parts: [] },
            finishReason: 'SAFETY',
            safetyRatings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT' }]
          }]
        }
      }

      mockGenerativeModel.generateContent.mockResolvedValue(blockedResponse)

      await expect(
        geminiService.generateAnalysis(mockAnalysisRequest)
      ).rejects.toThrow('Content was blocked by safety filters')
    })
  })

  describe('caching mechanism', () => {
    it('should cache analysis results', async () => {
      // First call
      const result1 = await geminiService.generateAnalysis(mockAnalysisRequest)
      
      // Second identical call
      const result2 = await geminiService.generateAnalysis(mockAnalysisRequest)

      expect(mockGenerativeModel.generateContent).toHaveBeenCalledTimes(1)
      expect(result1.text).toBe(result2.text)
      expect(result2.metadata?.fromCache).toBe(true)
    })

    it('should respect cache expiration', async () => {
      const shortCacheService = new FirebaseGeminiService({
        ...mockConfig,
        cacheOptions: { ttl: 100 } // 100ms TTL
      })

      await shortCacheService.generateAnalysis(mockAnalysisRequest)
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      await shortCacheService.generateAnalysis(mockAnalysisRequest)

      expect(mockGenerativeModel.generateContent).toHaveBeenCalledTimes(2)
    })

    it('should provide cache statistics', () => {
      const stats = geminiService.getCacheStats()
      
      expect(stats).toEqual({
        size: expect.any(Number),
        hitRate: expect.any(Number),
        totalRequests: expect.any(Number),
        cacheHits: expect.any(Number)
      })
    })

    it('should clear cache when requested', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest)
      
      geminiService.clearCache()
      
      const stats = geminiService.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('token usage and pricing', () => {
    it('should track token usage accurately', async () => {
      mockGenerativeModel.countTokens.mockResolvedValue({ totalTokens: 250 })

      const result = await geminiService.generateAnalysis(mockAnalysisRequest)

      expect(result.tokensUsed).toBe(150) // From generation response
    })

    it('should calculate estimated cost', async () => {
      const result = await geminiService.generateAnalysis(mockAnalysisRequest)
      const cost = geminiService.calculateEstimatedCost(result.tokensUsed)

      expect(cost).toBeGreaterThan(0)
      expect(typeof cost).toBe('number')
    })

    it('should provide usage analytics', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest)
      await geminiService.generateAnalysis({
        ...mockAnalysisRequest,
        cryptoName: 'Ethereum'
      })

      const analytics = geminiService.getUsageAnalytics()
      
      expect(analytics).toEqual({
        totalRequests: expect.any(Number),
        totalTokens: expect.any(Number),
        estimatedCost: expect.any(Number),
        averageTokensPerRequest: expect.any(Number),
        modelUsage: expect.any(Object)
      })
    })
  })

  describe('error handling and retries', () => {
    it('should retry on transient failures', async () => {
      mockGenerativeModel.generateContent
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockResolvedValueOnce(mockGeminiResponse)

      const result = await geminiService.generateAnalysis(mockAnalysisRequest)

      expect(mockGenerativeModel.generateContent).toHaveBeenCalledTimes(2)
      expect(result.text).toBe('Bitcoin is showing bullish momentum with RSI at 65...')
    })

    it('should fail after max retries', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(
        new Error('Persistent error')
      )

      await expect(
        geminiService.generateAnalysis(mockAnalysisRequest)
      ).rejects.toThrow('Analysis generation failed after 3 retries')
    })

    it('should handle quota exceeded errors', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(
        new Error('Quota exceeded')
      )

      await expect(
        geminiService.generateAnalysis(mockAnalysisRequest)
      ).rejects.toThrow('Quota exceeded')
    })

    it('should handle invalid API key errors', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(
        new Error('API key invalid')
      )

      await expect(
        geminiService.generateAnalysis(mockAnalysisRequest)
      ).rejects.toThrow('Authentication failed')
    })
  })

  describe('batch processing', () => {
    it('should process multiple analyses in batch', async () => {
      const requests = [
        { ...mockAnalysisRequest, cryptoName: 'Bitcoin' },
        { ...mockAnalysisRequest, cryptoName: 'Ethereum' },
        { ...mockAnalysisRequest, cryptoName: 'Solana' }
      ]

      const results = await geminiService.generateAnalysisBatch(requests)

      expect(results).toHaveLength(3)
      expect(results.every(r => r.text.length > 0)).toBe(true)
    })

    it('should handle partial batch failures', async () => {
      mockGenerativeModel.generateContent
        .mockResolvedValueOnce(mockGeminiResponse)
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce(mockGeminiResponse)

      const requests = [
        { ...mockAnalysisRequest, cryptoName: 'Bitcoin' },
        { ...mockAnalysisRequest, cryptoName: 'Ethereum' },
        { ...mockAnalysisRequest, cryptoName: 'Solana' }
      ]

      const results = await geminiService.generateAnalysisBatch(requests, {
        continueOnError: true
      })

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  describe('configuration and customization', () => {
    it('should allow custom generation parameters', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest, {
        temperature: 0.8,
        maxOutputTokens: 500,
        topP: 0.9,
        topK: 40
      })

      const callConfig = mockGenerativeModel.generateContent.mock.calls[0][0]
      expect(callConfig.generationConfig).toEqual({
        temperature: 0.8,
        maxOutputTokens: 500,
        topP: 0.9,
        topK: 40
      })
    })

    it('should use default parameters when not specified', async () => {
      await geminiService.generateAnalysis(mockAnalysisRequest)

      const callConfig = mockGenerativeModel.generateContent.mock.calls[0][0]
      expect(callConfig.generationConfig).toEqual({
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      })
    })
  })

  describe('health and monitoring', () => {
    it('should provide service health status', () => {
      const health = geminiService.getHealthStatus()
      
      expect(health).toEqual({
        status: 'healthy',
        uptime: expect.any(Number),
        version: expect.any(String),
        lastError: null,
        requestsProcessed: expect.any(Number)
      })
    })

    it('should track error rates', async () => {
      mockGenerativeModel.generateContent.mockRejectedValue(
        new Error('Test error')
      )

      try {
        await geminiService.generateAnalysis(mockAnalysisRequest)
      } catch {
        // Expected to fail
      }

      const health = geminiService.getHealthStatus()
      expect(health.lastError).toBe('Test error')
    })
  })
})