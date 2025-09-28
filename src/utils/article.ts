import OpenAI from 'openai'

interface ArticleData {
  price: number | null
  rsi: number | null
  ema12: number | null
  ema26: number | null
  macd: { MACD: number; signal: number; histogram: number } | null
  cryptoName?: string
}

interface ArticleResult {
  text: string
  confidence: number
}

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

console.log('OpenAI instance created:', openai.chat.completions.create)

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

export const generateArticle = (data: ArticleData): ArticleResult => {
  if (!data.price) {
    return {
      text: 'Data unavailable. Please try again later.',
      confidence: 0,
    }
  }

  const cryptoName = data.cryptoName || 'Bitcoin'

  let text = `${cryptoName} is currently trading at $${data.price}. `

  let confidence = 50 // Base

  if (data.rsi) {
    if (data.rsi > 70) {
      text += 'The RSI indicates overbought conditions, suggesting a potential sell signal. '
      confidence += 10
    } else if (data.rsi < 30) {
      text += 'The RSI indicates oversold conditions, suggesting a potential buy signal. '
      confidence += 10
    } else {
      text += 'The RSI is in a neutral range. '
    }
  }

  if (data.ema12 && data.ema26) {
    if (data.ema12 > data.ema26) {
      text += 'The short-term EMA is above the long-term EMA, indicating bullish momentum. '
      confidence += 15
    } else {
      text += 'The short-term EMA is below the long-term EMA, indicating bearish momentum. '
      confidence -= 15
    }
  }

  if (data.macd) {
    if (data.macd.histogram > 0) {
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

export const generateLLMArticle = async (data: ArticleData, useEnhanced: boolean = false): Promise<ArticleResult> => {
  // Fallback to template if not using enhanced mode or no API key
  if (!useEnhanced || !process.env.VITE_OPENAI_API_KEY) {
    return generateArticle(data)
  }

  try {
    const prompt = `Generate a natural, engaging market analysis article for ${data.cryptoName || 'Bitcoin'} based on the following technical data:

Price: $${data.price}
RSI: ${data.rsi || 'N/A'}
EMA 12: ${data.ema12 || 'N/A'}
EMA 26: ${data.ema26 || 'N/A'}
MACD: ${data.macd ? `MACD: ${data.macd.MACD}, Signal: ${data.macd.signal}, Histogram: ${data.macd.histogram}` : 'N/A'}

Write a concise, professional analysis (2-3 sentences) that explains the current market situation and provides actionable insights. Make it sound natural and engaging, not like a template.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    })

    const llmText = completion.choices[0]?.message?.content?.trim()
    if (!llmText) {
      throw new Error('No response from LLM')
    }

    const confidence = calculateConfidence(data)

    return { text: llmText, confidence }
  } catch (error) {
    console.warn('LLM article generation failed, falling back to template:', error)
    return generateArticle(data)
  }
}