import { type TimeInterval } from './timeIntervals'
import { calculateFibonacciExtensions } from './advancedIndicators'

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
      const rawATR = calculateATR(data)
      
      // Apply minimum ATR based on price level to avoid unrealistic tight stops
      let minATR: number
      if (entryPrice > 50000) {
        minATR = entryPrice * 0.015 // 1.5% minimum for high-value assets like Bitcoin
      } else if (entryPrice > 1000) {
        minATR = entryPrice * 0.02 // 2% minimum for mid-value assets
      } else {
        minATR = entryPrice * 0.03 // 3% minimum for low-value assets
      }
      
      const atr = Math.max(rawATR, minATR)
      
      price = entryPrice - (atr * 2) // 2x ATR
      percentage = ((entryPrice - price) / entryPrice) * 100
      explanation = atr > rawATR 
        ? `2x minimum ATR (${atr.toFixed(2)}) below entry price`
        : `2x ATR (${atr.toFixed(2)}) below entry price`
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
  
  // Ensure minimum meaningful risk for target calculations
  // If risk is too small (less than 1% of entry price), use percentage-based targets
  const minRisk = entryPrice * 0.01 // 1% minimum
  const effectiveRisk = Math.max(risk, minRisk)
  
  // Risk-reward based targets using effective risk
  let target1 = entryPrice + (effectiveRisk * 2) // 1:2 risk-reward
  let target2 = entryPrice + (effectiveRisk * 3) // 1:3 risk-reward
  
  // If still too close to entry price, use percentage-based fallback
  if (target1 - entryPrice < entryPrice * 0.02) { // Less than 2% gain
    target1 = entryPrice * 1.05 // 5% above entry
    target2 = entryPrice * 1.10 // 10% above entry
  }
  
  // Enhanced Fibonacci extension calculations
  const recentData = data.slice(-20)
  const recentHigh = Math.max(...recentData.map(d => d.high))
  const recentLow = Math.min(...recentData.map(d => d.low))
  
  // Use advanced Fibonacci Extensions utility
  const fibExtensions = calculateFibonacciExtensions(recentHigh, recentLow, entryPrice)
  
  let target3 = entryPrice + (effectiveRisk * 4) // Default 1:4 risk-reward
  let target3Method = '1:4 risk-reward ratio'
  
  // Ensure target3 is properly spaced above target2
  if (target3 - target2 < entryPrice * 0.03) { // Less than 3% between targets
    target3 = entryPrice * 1.15 // 15% above entry as fallback
  }
  
  // Use resistance levels if available and reasonable
  if (levels.resistance.length > 0) {
    const nextResistance = levels.resistance.find(r => r > entryPrice)
    if (nextResistance && nextResistance > target2) {
      target3 = Math.max(target3, nextResistance)
      target3Method = `Resistance level at $${nextResistance.toFixed(2)}`
    }
  }
  
  // Use Fibonacci extension if it provides better target
  if (fibExtensions.targets.length > 0) {
    const fib127 = fibExtensions.targets.find(t => t.level === '127.2%')
    const fib161 = fibExtensions.targets.find(t => t.level === '161.8%')
    
    if (fib127 && fib127.price > target2 && fib127.price > target3) {
      target3 = fib127.price
      target3Method = `Fibonacci 127.2% extension`
    } else if (fib161 && fib161.price > target2 && fib161.price < target3 * 1.5) { // Reasonable upper bound
      target3 = Math.max(target3, fib161.price)
      target3Method = `Fibonacci 161.8% extension`
    }
  }
  
  // Calculate risk-reward ratio using the same risk that was used for target calculation
  let riskRewardRatio: number
  const actualReward = target1 - entryPrice
  const actualRisk = entryPrice - stopLossPrice
  
  if (actualRisk <= 0 || !isFinite(actualRisk)) {
    riskRewardRatio = NaN // Will be handled in the display component
  } else {
    riskRewardRatio = actualReward / actualRisk
  }
  
  return {
    target1: Math.round(target1 * 100) / 100,
    target2: Math.round(target2 * 100) / 100,
    target3: Math.round(target3 * 100) / 100,
    riskRewardRatio: isFinite(riskRewardRatio) ? Math.round(riskRewardRatio * 10) / 10 : NaN,
    methods: {
      target1: `1:2 risk-reward ratio (Risk: $${risk.toFixed(2)})`,
      target2: `1:3 risk-reward ratio`,
      target3: target3Method
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