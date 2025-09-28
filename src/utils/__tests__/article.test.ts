// Create the mock function at the very top
const mockCreate = vi.fn();

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the openai module
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

import { generateArticle, generateLLMArticle } from '../article';

describe('generateArticle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  });

  it('should fallback to template when no API key is available', async () => {
    const originalKey = process.env.VITE_OPENAI_API_KEY;
    delete process.env.VITE_OPENAI_API_KEY;

    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    const result = await generateLLMArticle(data, true);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');

    process.env.VITE_OPENAI_API_KEY = originalKey;
  });

  it('should generate LLM-enhanced article when API key is available', async () => {
    process.env.VITE_OPENAI_API_KEY = 'test-key';

    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'Bitcoin is showing strong bullish momentum with positive technical indicators. The current price of $50,000 suggests continued upward movement, supported by favorable RSI and MACD readings.',
        },
      }],
    });

    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
      cryptoName: 'Bitcoin',
    };

    const result = await generateLLMArticle(data, true);

    expect(result.text).toContain('Bitcoin is showing strong bullish momentum');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('should fallback to template when LLM API fails', async () => {
    process.env.VITE_OPENAI_API_KEY = 'test-key';

    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const data = {
      price: 50000,
      rsi: 65,
      ema12: 49500,
      ema26: 49000,
      macd: { MACD: 200, signal: 150, histogram: 50 },
    };

    const result = await generateLLMArticle(data, true);

    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.text).toBe('string');
    expect(typeof result.confidence).toBe('number');
  });
});