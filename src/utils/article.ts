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