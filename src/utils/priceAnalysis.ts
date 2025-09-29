import { type TimeInterval } from './timeIntervals'

export interface OHLCV {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface EntryPoints {
  conservative: number
  moderate: number
  aggressive: number
  methods: {
    conservative: string
    moderate: string
    aggressive: string
  }
}

export interface StopLoss {
  price: number
  percentage: number
  method: 'percentage' | 'atr' | 'support'
  explanation: string
}

export interface ProfitTargets {
  target1: number
  target2: number
  target3: number
  riskRewardRatio: number
  methods: {
    target1: string
    target2: string
    target3: string
  }
}

export interface PriceAnalysis {
  entryPoints: EntryPoints
  stopLoss: StopLoss
  profitTargets: ProfitTargets
  timeHorizon: TimeInterval
  riskAssessment: string
  confidence: number
}

export interface SupportResistance {
  support: number[]
  resistance: number[]
}

export function calculateATR(data: OHLCV[], period: number = 14): number {
  if (data.length === 0) return 0
  if (data.length === 1) return data[0].high - data[0].low

  const trueRanges: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i]
    const previous = data[i - 1]
    
    const tr1 = current.high - current.low
    const tr2 = Math.abs(current.high - previous.close)
    const tr3 = Math.abs(current.low - previous.close)
    
    trueRanges.push(Math.max(tr1, tr2, tr3))
  }
  
  // Use available data if less than period
  const actualPeriod = Math.min(period, trueRanges.length)
  const sum = trueRanges.slice(-actualPeriod).reduce((a, b) => a + b, 0)
  
  return sum / actualPeriod
}

export function findSupportResistanceLevels(data: OHLCV[], lookbackPeriod: number = 5): SupportResistance {
  if (data.length < 3) {
    return { support: [], resistance: [] }
  }

  const support: number[] = []
  const resistance: number[] = []
  
  for (let i = lookbackPeriod; i < data.length - lookbackPeriod; i++) {
    const current = data[i]
    let isSupport = true
    let isResistance = true
    
    // Check if current low is a local minimum (support)
    for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
      if (j !== i && data[j].low <= current.low) {
        isSupport = false
        break
      }
    }
    
    // Check if current high is a local maximum (resistance)
    for (let j = i - lookbackPeriod; j <= i + lookbackPeriod; j++) {
      if (j !== i && data[j].high >= current.high) {
        isResistance = false
        break
      }
    }
    
    if (isSupport) support.push(current.low)
    if (isResistance) resistance.push(current.high)
  }
  
  // Sort and remove duplicates
  const uniqueSupport = [...new Set(support)].sort((a, b) => b - a) // Descending
  const uniqueResistance = [...new Set(resistance)].sort((a, b) => a - b) // Ascending
  
  return {
    support: uniqueSupport.slice(0, 5), // Top 5 support levels
    resistance: uniqueResistance.slice(0, 5) // Top 5 resistance levels
  }
}

export function calculateFibonacciRetracement(param1: number, param2: number): Record<string, number> {
  // Determine actual high and low regardless of parameter order
  const actualHigh = Math.max(param1, param2)
  const actualLow = Math.min(param1, param2)
  const range = actualHigh - actualLow
  
  const levels = {
    '0%': actualLow,
    '23.6%': actualLow + (range * 0.236),
    '38.2%': actualLow + (range * 0.382),
    '50%': actualLow + (range * 0.5),
    '61.8%': actualLow + (range * 0.618),
    '100%': actualHigh
  }
  
  return levels
}

export function calculateEntryPoints(data: OHLCV[], currentPrice: number): EntryPoints {
  const levels = findSupportResistanceLevels(data)
  const atr = calculateATR(data)
  
  // Find recent high and low for Fibonacci
  const recentData = data.slice(-20) // Last 20 periods
  const recentHigh = Math.max(...recentData.map(d => d.high))
  const recentLow = Math.min(...recentData.map(d => d.low))
  
  const fibLevels = calculateFibonacciRetracement(recentHigh, recentLow)
  
  // Conservative: Support level + 2% buffer
  let conservative = currentPrice
  if (levels.support.length > 0) {
    const nearestSupport = levels.support.find(s => s < currentPrice) || levels.support[0]
    conservative = nearestSupport * 1.02
  }
  
  // Moderate: Fibonacci 61.8% retracement or current price - 1 ATR
  const moderate = Math.min(fibLevels['61.8%'], currentPrice - atr)
  
  // Aggressive: Current price or slight discount
  const aggressive = Math.min(currentPrice * 0.98, moderate)
  
  return {
    conservative: Math.round(conservative * 100) / 100,
    moderate: Math.round(moderate * 100) / 100,
    aggressive: Math.round(aggressive * 100) / 100,
    methods: {
      conservative: `Support level (${levels.support[0]?.toFixed(2) || 'N/A'}) + 2% buffer`,
      moderate: 'Fibonacci 61.8% retracement or current price - 1 ATR',
      aggressive: 'Current price with 2% discount'
    }
  }
}

export function calculateStopLoss(
  data: OHLCV[], 
  entryPrice: number, 
  method: 'percentage' | 'atr' | 'support' = 'atr',
  customPercentage?: number
): StopLoss {
  let price: number
  let percentage: number
  let explanation: string
  
  switch (method) {
    case 'percentage': {
      const percent = customPercentage || 5 // Default 5%
      price = entryPrice * (1 - percent / 100)
      percentage = percent
      explanation = `${percent}% below entry price`
      break
    }
    
    case 'atr': {
      const atr = calculateATR(data)
      price = entryPrice - (atr * 2) // 2x ATR
      percentage = ((entryPrice - price) / entryPrice) * 100
      explanation = `2x ATR (${atr.toFixed(2)}) below entry price`
      break
    }
    
    case 'support': {
      const levels = findSupportResistanceLevels(data)
      const nearestSupport = levels.support.find(s => s < entryPrice) || levels.support[0]
      price = nearestSupport ? nearestSupport * 0.98 : entryPrice * 0.95 // 2% below support or 5% below entry
      percentage = ((entryPrice - price) / entryPrice) * 100
      explanation = nearestSupport 
        ? `2% below nearest support level (${nearestSupport.toFixed(2)})`
        : '5% below entry price (no support found)'
      break
    }
  }
  
  return {
    price: Math.round(price * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    method,
    explanation
  }
}

export function calculateProfitTargets(data: OHLCV[], entryPrice: number, stopLossPrice: number): ProfitTargets {
  const risk = entryPrice - stopLossPrice
  const levels = findSupportResistanceLevels(data)
  
  // Risk-reward based targets
  const target1 = entryPrice + (risk * 2) // 1:2 risk-reward
  const target2 = entryPrice + (risk * 3) // 1:3 risk-reward
  
  // Fibonacci extension or resistance-based target
  const recentData = data.slice(-20)
  const recentHigh = Math.max(...recentData.map(d => d.high))
  const recentLow = Math.min(...recentData.map(d => d.low))
  
  const fibExtensions = {
    '127.2%': recentHigh + (recentHigh - recentLow) * 0.272,
    '161.8%': recentHigh + (recentHigh - recentLow) * 0.618
  }
  
  let target3 = entryPrice + (risk * 4) // Default 1:4 risk-reward
  
  // Use resistance levels if available and reasonable
  if (levels.resistance.length > 0) {
    const nextResistance = levels.resistance.find(r => r > entryPrice)
    if (nextResistance && nextResistance > target2) {
      target3 = Math.max(target3, nextResistance)
    }
  }
  
  // Use Fibonacci extension if reasonable
  if (fibExtensions['161.8%'] > target2) {
    target3 = Math.max(target3, fibExtensions['127.2%'])
  }
  
  const riskRewardRatio = (target1 - entryPrice) / risk
  
  return {
    target1: Math.round(target1 * 100) / 100,
    target2: Math.round(target2 * 100) / 100,
    target3: Math.round(target3 * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 10) / 10,
    methods: {
      target1: `1:2 risk-reward ratio (Risk: $${risk.toFixed(2)})`,
      target2: `1:3 risk-reward ratio`,
      target3: `Resistance level or Fibonacci extension`
    }
  }
}

export function analyzePricePoints(data: OHLCV[], currentPrice: number, timeHorizon: TimeInterval): PriceAnalysis {
  const entryPoints = calculateEntryPoints(data, currentPrice)
  
  // Use moderate entry point for stop loss and profit calculations
  const entryPrice = entryPoints.moderate
  const stopLoss = calculateStopLoss(data, entryPrice, 'atr')
  const profitTargets = calculateProfitTargets(data, entryPrice, stopLoss.price)
  
  // Calculate confidence based on data quality and market conditions
  let confidence = 0.5 // Base confidence
  
  // Increase confidence with more data points
  confidence += Math.min(data.length / 50, 0.2) // Up to +0.2 for 50+ data points
  
  // Increase confidence with clear support/resistance levels
  const levels = findSupportResistanceLevels(data)
  confidence += Math.min((levels.support.length + levels.resistance.length) / 20, 0.2) // Up to +0.2
  
  // Decrease confidence for very short timeframes (more volatile)
  if (['5m', '15m'].includes(timeHorizon)) {
    confidence -= 0.1
  }
  
  // Clamp confidence between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence))
  
  // Risk assessment based on timeframe
  let riskAssessment: string
  if (['5m', '15m'].includes(timeHorizon)) {
    riskAssessment = 'High - Short timeframe with increased volatility and noise'
  } else if (['30m', '1h', '4h'].includes(timeHorizon)) {
    riskAssessment = 'Medium - Balanced timeframe suitable for swing trading'
  } else {
    riskAssessment = 'Low to Medium - Longer timeframe with reduced noise'
  }
  
  return {
    entryPoints,
    stopLoss,
    profitTargets,
    timeHorizon,
    riskAssessment,
    confidence: Math.round(confidence * 100) / 100
  }
}