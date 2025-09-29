import { describe, it, expect, beforeEach } from 'vitest';
import { generateArticle, generateLLMArticle, getCacheInfo, clearCache } from '../article';
import { ValidationError } from '../validation';

describe('generateArticle', () => {

  it('should generate article text and confidence score', () => {
    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    const result = generateArticle(data);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.text).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('should handle missing data', () => {
    const data = { price: null, rsi: null, ema12: null, ema26: null, macd: null };

    const result = generateArticle(data);

    expect(result.text).toContain('Data unavailable');
    expect(result.confidence).toBe(0);
  });

  it('should throw ValidationError for invalid data', () => {
    const invalidData = {
      price: 'not-a-number', // Should be number or null
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null
    };

    expect(() => generateArticle(invalidData)).toThrow(ValidationError);
  });

  it('should throw ValidationError for negative price', () => {
    const invalidData = {
      price: -50000, // Should be positive
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null
    };

    expect(() => generateArticle(invalidData)).toThrow(ValidationError);
  });

  it('should throw ValidationError for RSI out of range', () => {
    const invalidDataHigh = {
      price: 50000,
      rsi: 150, // Should be 0-100
      ema12: null,
      ema26: null,
      macd: null
    };

    const invalidDataLow = {
      price: 50000,
      rsi: -10, // Should be 0-100
      ema12: null,
      ema26: null,
      macd: null
    };

    expect(() => generateArticle(invalidDataHigh)).toThrow(ValidationError);
    expect(() => generateArticle(invalidDataLow)).toThrow(ValidationError);
  });
});

describe('generateLLMArticle', () => {
  it('should fallback to template when enhanced mode is disabled', async () => {
    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    const result = await generateLLMArticle(data, false);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.text).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(result.text).toContain('Bitcoin is currently trading at $50000');
  });

  it('should throw ValidationError for invalid LLM data', async () => {
    const invalidData = {
      price: 'not-a-number',
      rsi: null,
      ema12: null,
      ema26: null,
      macd: null
    };

    await expect(generateLLMArticle(invalidData, false))
      .rejects.toThrow(ValidationError);
  });

  it('should fallback to template when no API key is available', async () => {
    const originalKey = process.env.VITE_OPENAI_API_KEY;
    const originalOllamaUrl = process.env.VITE_OLLAMA_URL;
    
    delete process.env.VITE_OPENAI_API_KEY;
    process.env.VITE_OLLAMA_URL = 'http://localhost:99999'; // Non-existent port

    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    const result = await generateLLMArticle(data, true, 'openai'); // Use OpenAI provider to avoid Ollama

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.text).toContain('Bitcoin is currently trading at $50000');

    process.env.VITE_OPENAI_API_KEY = originalKey;
    process.env.VITE_OLLAMA_URL = originalOllamaUrl;
  }, 10000); // Increase timeout
});

describe('LLM Cache', () => {
  beforeEach(() => {
    clearCache(); // Clean slate for each test
  });

  it('should provide cache utilities', () => {
    const cacheInfo = getCacheInfo();
    expect(cacheInfo.size).toBe(0);
    expect(Array.isArray(cacheInfo.entries)).toBe(true);
    expect(typeof cacheInfo.duration).toBe('number');
    expect(cacheInfo.duration).toBe(20 * 60 * 1000); // 20 minutes
  });

  it('should clear cache properly', () => {
    clearCache();
    const cacheInfo = getCacheInfo();
    expect(cacheInfo.size).toBe(0);
  });
});

describe('Multi-LLM Integration', () => {
  beforeEach(() => {
    clearCache(); // Clean slate for each test
  });

  it('should accept provider parameter', async () => {
    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    // Test with template mode (should work regardless of provider)
    const result = await generateLLMArticle(data, false, 'ollama');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.text).toContain('Bitcoin is currently trading at $50000');
  });

  it('should fallback gracefully when all providers fail', async () => {
    const originalOpenAIKey = process.env.VITE_OPENAI_API_KEY;
    const originalOllamaUrl = process.env.VITE_OLLAMA_URL;
    
    // Disable both providers
    delete process.env.VITE_OPENAI_API_KEY;
    process.env.VITE_OLLAMA_URL = 'http://localhost:99999';

    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    // Should fallback to template even when enhanced mode is on
    const result = await generateLLMArticle(data, true, 'ollama');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result.text).toContain('Bitcoin is currently trading at $50000');

    // Restore environment
    if (originalOpenAIKey) process.env.VITE_OPENAI_API_KEY = originalOpenAIKey;
    if (originalOllamaUrl) process.env.VITE_OLLAMA_URL = originalOllamaUrl;
  }, 15000); // Longer timeout for network operations

  it('should handle provider selection correctly', async () => {
    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    // Test that different providers can be specified
    const result1 = await generateLLMArticle(data, false, 'ollama');
    const result2 = await generateLLMArticle(data, false, 'openai');

    // Both should work in template mode
    expect(result1).toHaveProperty('text');
    expect(result2).toHaveProperty('text');
    expect(result1.text).toBe(result2.text); // Same template result
  });
});