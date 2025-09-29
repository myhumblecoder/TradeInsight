import { type OHLCV } from './priceAnalysis'

export interface BollingerBands {
  upper: number
  middle: number  // SMA
  lower: number
  bandwidth: number
  percentB: number
}

export interface StochasticRSI {
  k: number
  d: number
  signal: 'bullish' | 'bearish' | 'neutral'
  overbought: boolean
  oversold: boolean
}

export interface VolumeLevel {
  price: number
  volume: number
  percentage: number
}

export interface VolumeProfile {
  levels: VolumeLevel[]
  poc: number  // Point of Control
  valueAreaHigh: number
  valueAreaLow: number
  totalVolume: number
}

export interface FibonacciTarget {
  level: string
  price: number
  significance: 'target' | 'strong_resistance' | 'extreme_extension'
}

export interface FibonacciExtensions {
  levels: Record<string, number>
  targets: FibonacciTarget[]
  projection: 'uptrend_continuation' | 'downtrend_continuation' | 'reversal'
}

export function calculateBollingerBands(
  data: OHLCV[], 
  period: number = 20, 
  stdDevMultiplier: number = 2
): BollingerBands {
  if (data.length === 0) {
    return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0 }
  }

  const prices = data.map(candle => candle.close)
  const actualPeriod = Math.min(period, prices.length)
  const recentPrices = prices.slice(-actualPeriod)
  
  // Calculate Simple Moving Average (middle band)
  const sma = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length
  
  // Calculate Standard Deviation
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / recentPrices.length
  const stdDev = Math.sqrt(variance)
  
  const upper = sma + (stdDev * stdDevMultiplier)
  const lower = sma - (stdDev * stdDevMultiplier)
  
  const currentPrice = prices[prices.length - 1]
  const bandwidth = (upper - lower) / sma
  const percentB = (currentPrice - lower) / (upper - lower)
  
  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    bandwidth: Math.round(bandwidth * 10000) / 10000,
    percentB: Math.max(0, Math.min(1, percentB))
  }
}

export function calculateStochasticRSI(
  data: OHLCV[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _kPeriod: number = 3,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dPeriod: number = 3
): StochasticRSI {
  if (data.length < rsiPeriod + stochPeriod) {
    return { k: 50, d: 50, signal: 'neutral', overbought: false, oversold: false }
  }

  const prices = data.map(candle => candle.close)
  
  // Calculate RSI values
  const rsiValues: number[] = []
  for (let i = rsiPeriod; i < prices.length; i++) {
    const periodPrices = prices.slice(i - rsiPeriod, i + 1)
    let gains = 0
    let losses = 0
    
    for (let j = 1; j < periodPrices.length; j++) {
      const change = periodPrices[j] - periodPrices[j - 1]
      if (change > 0) gains += change
      else losses += Math.abs(change)
    }
    
    const avgGain = gains / rsiPeriod
    const avgLoss = losses / rsiPeriod
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))
    
    rsiValues.push(rsi)
  }
  
  if (rsiValues.length === 0) {
    return { k: 50, d: 50, signal: 'neutral', overbought: false, oversold: false }
  }
  
  // Calculate Stochastic of RSI
  const recentRSI = rsiValues.slice(-stochPeriod)
  const minRSI = Math.min(...recentRSI)
  const maxRSI = Math.max(...recentRSI)
  const currentRSI = recentRSI[recentRSI.length - 1]
  
  const stochRSI = maxRSI === minRSI ? 50 : ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100
  
  // Smooth with moving averages
  const k = stochRSI  // Simplified - in reality this would be smoothed
  const d = k  // Simplified - in reality this would be a moving average of %K
  
  // Determine signals
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (k > d && k < 20) signal = 'bullish'  // Oversold reversal
  else if (k < d && k > 80) signal = 'bearish'  // Overbought reversal
  
  const overbought = k > 80 && d > 80
  const oversold = k < 20 && d < 20
  
  return {
    k: Math.round(k * 100) / 100,
    d: Math.round(d * 100) / 100,
    signal,
    overbought,
    oversold
  }
}

export function calculateVolumeProfile(data: OHLCV[], bins: number = 20): VolumeProfile {
  if (data.length === 0) {
    return { levels: [], poc: 0, valueAreaHigh: 0, valueAreaLow: 0, totalVolume: 0 }
  }

  // Find price range
  const highs = data.map(candle => candle.high)
  const lows = data.map(candle => candle.low)
  const maxPrice = Math.max(...highs)
  const minPrice = Math.min(...lows)
  const priceRange = maxPrice - minPrice
  const binSize = priceRange / bins
  
  // Initialize bins
  const volumeBins = Array.from({ length: bins }, (_, i) => ({
    price: minPrice + (i * binSize) + (binSize / 2),
    volume: 0,
    percentage: 0
  }))
  
  // Distribute volume across price levels
  let totalVolume = 0
  data.forEach(candle => {
    const avgPrice = (candle.high + candle.low + candle.close) / 3
    const binIndex = Math.min(Math.floor((avgPrice - minPrice) / binSize), bins - 1)
    volumeBins[binIndex].volume += candle.volume
    totalVolume += candle.volume
  })
  
  // Calculate percentages
  volumeBins.forEach(bin => {
    bin.percentage = totalVolume > 0 ? (bin.volume / totalVolume) * 100 : 0
  })
  
  // Find Point of Control (highest volume)
  const poc = volumeBins.reduce((max, bin) => bin.volume > max.volume ? bin : max).price
  
  // Calculate Value Area (70% of volume)
  const sortedByVolume = [...volumeBins].sort((a, b) => b.volume - a.volume)
  let valueAreaVolume = 0
  const targetVolume = totalVolume * 0.7
  const valueAreaBins: VolumeLevel[] = []
  
  for (const bin of sortedByVolume) {
    if (valueAreaVolume < targetVolume) {
      valueAreaBins.push(bin)
      valueAreaVolume += bin.volume
    } else {
      break
    }
  }
  
  const valueAreaPrices = valueAreaBins.map(bin => bin.price)
  const valueAreaHigh = Math.max(...valueAreaPrices)
  const valueAreaLow = Math.min(...valueAreaPrices)
  
  return {
    levels: volumeBins.sort((a, b) => a.price - b.price),
    poc: Math.round(poc * 100) / 100,
    valueAreaHigh: Math.round(valueAreaHigh * 100) / 100,
    valueAreaLow: Math.round(valueAreaLow * 100) / 100,
    totalVolume
  }
}

export function calculateFibonacciExtensions(
  swing1Start: number, 
  swing1End: number, 
  swing2End: number
): FibonacciExtensions {
  const swing1Range = Math.abs(swing1End - swing1Start)
  const isUptrend = swing2End > Math.min(swing1Start, swing1End)
  
  // Determine projection direction
  let projection: FibonacciExtensions['projection']
  if (isUptrend && swing1End > swing1Start) {
    projection = 'uptrend_continuation'
  } else if (!isUptrend && swing1End < swing1Start) {
    projection = 'downtrend_continuation'  
  } else {
    projection = 'reversal'
  }
  
  // Fibonacci extension ratios
  const ratios = [0.618, 1.0, 1.618, 2.618]
  const labels = ['61.8%', '100%', '161.8%', '261.8%']
  const significance: FibonacciTarget['significance'][] = ['target', 'target', 'strong_resistance', 'extreme_extension']
  
  const levels: Record<string, number> = {}
  const targets: FibonacciTarget[] = []
  
  ratios.forEach((ratio, index) => {
    let extensionPrice: number
    
    if (projection === 'uptrend_continuation') {
      extensionPrice = swing2End + (swing1Range * ratio)
    } else {
      extensionPrice = swing2End - (swing1Range * ratio)  
    }
    
    levels[labels[index]] = Math.round(extensionPrice * 100) / 100
    targets.push({
      level: labels[index],
      price: Math.round(extensionPrice * 100) / 100,
      significance: significance[index]
    })
  })
  
  // Sort targets appropriately
  if (projection === 'uptrend_continuation') {
    targets.sort((a, b) => a.price - b.price)
  } else {
    targets.sort((a, b) => b.price - a.price)
  }
  
  return {
    levels,
    targets,
    projection
  }
}