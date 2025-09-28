import { describe, it, expect } from 'vitest';
import { generateArticle, generateLLMArticle, getCacheInfo, clearCache } from '../article';

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
  it('should provide cache utilities', () => {
    clearCache();
    
    const cacheInfo = getCacheInfo();
    expect(cacheInfo.size).toBe(0);
    expect(Array.isArray(cacheInfo.entries)).toBe(true);
    expect(typeof cacheInfo.duration).toBe('number');
  });
});