import { type OHLCV } from './priceAnalysis'

// CoinGecko/Coinbase candle data format: [timestamp, open, high, low, close, volume]
// Or CoinGecko price data format: [timestamp, price]
export type CandleData = number[]

export function convertCandlesToOHLCV(candleData: CandleData[]): OHLCV[] {
  if (!candleData || candleData.length === 0) {
    return []
  }

  const ohlcvData: OHLCV[] = candleData.map(candle => {
    // Handle different data formats
    if (candle.length >= 6) {
      // Full OHLCV format: [timestamp, open, high, low, close, volume]
      return {
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }
    } else if (candle.length >= 2) {
      // Price only format: [timestamp, price] - convert to OHLC with same price
      const price = candle[1]
      return {
        timestamp: candle[0],
        open: price,
        high: price,
        low: price,
        close: price,
        volume: candle[2] || 0 // Use third element as volume if available
      }
    } else {
      // Malformed data - use first element as price
      const price = candle[1] || candle[0] || 0
      return {
        timestamp: candle[0] || 0,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0
      }
    }
  })

  // Sort by timestamp to ensure chronological order
  return ohlcvData.sort((a, b) => a.timestamp - b.timestamp)
}

export function validateOHLCVData(data: OHLCV[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    return false
  }

  return data.every(item => {
    return (
      typeof item.timestamp === 'number' &&
      typeof item.open === 'number' &&
      typeof item.high === 'number' &&
      typeof item.low === 'number' &&
      typeof item.close === 'number' &&
      typeof item.volume === 'number' &&
      item.high >= Math.max(item.open, item.close) &&
      item.low <= Math.min(item.open, item.close)
    )
  })
}

export function getDataQualityScore(data: OHLCV[]): number {
  if (!data || data.length === 0) return 0

  let score = 0
  const totalPoints = 100

  // Length score (0-30 points)
  const lengthScore = Math.min((data.length / 50) * 30, 30)
  score += lengthScore

  // Consistency score (0-30 points)
  const hasValidOHLC = data.every(item => 
    item.high >= Math.max(item.open, item.close) &&
    item.low <= Math.min(item.open, item.close)
  )
  if (hasValidOHLC) score += 30

  // Volume data availability (0-20 points)
  const hasVolumeData = data.some(item => item.volume > 0)
  if (hasVolumeData) score += 20

  // Chronological order (0-20 points)
  const isChronological = data.every((item, index) => 
    index === 0 || item.timestamp >= data[index - 1].timestamp
  )
  if (isChronological) score += 20

  return Math.min(score, totalPoints)
}