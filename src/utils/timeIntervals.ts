export type TimeInterval = '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'

export interface TimeIntervalConfig {
  label: string
  seconds: number
  category: 'Short-term' | 'Medium-term' | 'Long-term'
  useCase: string
}

export const TIME_INTERVALS: Record<TimeInterval, TimeIntervalConfig> = {
  '5m': {
    label: '5 Minutes',
    seconds: 300,
    category: 'Short-term',
    useCase: 'Scalping, ultra-short-term'
  },
  '15m': {
    label: '15 Minutes', 
    seconds: 900,
    category: 'Short-term',
    useCase: 'Scalping, short-term trades'
  },
  '30m': {
    label: '30 Minutes',
    seconds: 1800,
    category: 'Medium-term',
    useCase: 'Swing trading, intraday'
  },
  '1h': {
    label: '1 Hour',
    seconds: 3600,
    category: 'Medium-term',
    useCase: 'Swing trading, intraday'
  },
  '4h': {
    label: '4 Hours',
    seconds: 14400,
    category: 'Medium-term',
    useCase: 'Swing trading, daily analysis'
  },
  '1d': {
    label: '1 Day',
    seconds: 86400,
    category: 'Long-term',
    useCase: 'Position trading, investing'
  },
  '1w': {
    label: '1 Week',
    seconds: 604800,
    category: 'Long-term',
    useCase: 'Position trading, long-term investing'
  }
}

export const getTimeIntervalConfig = (interval: TimeInterval): TimeIntervalConfig => {
  const config = TIME_INTERVALS[interval]
  if (!config) {
    throw new Error(`Unsupported time interval: ${interval}`)
  }
  return config
}

export const formatTimeInterval = (interval: TimeInterval): string => {
  return getTimeIntervalConfig(interval).label
}

export const getGranularityFromInterval = (interval: TimeInterval): number => {
  return getTimeIntervalConfig(interval).seconds
}

export const getIntervalsByCategory = () => {
  const categories: Record<string, TimeInterval[]> = {
    'Short-term': [],
    'Medium-term': [],
    'Long-term': []
  }

  Object.entries(TIME_INTERVALS).forEach(([interval, config]) => {
    categories[config.category].push(interval as TimeInterval)
  })

  return categories
}