import { useState, useEffect } from 'react'
import logger from '../utils/logger'

interface TopCrypto {
  id: string
  name: string
  symbol: string
  current_price: number
  market_cap: number
  price_change_percentage_24h: number
}

// Simple in-memory cache
const cache = new Map<string, { data: TopCrypto[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useTopCryptos() {
  const [data, setData] = useState<TopCrypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = 'topCryptos'
    const now = Date.now()
    const cached = cache.get(cacheKey)

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching top cryptos...')
        const response = await fetch(
          '/api/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1'
        )
        console.log('Response status:', response.status)
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limited, please try again later.')
          }
          throw new Error(`CoinGecko API error: ${response.status}`)
        }
        const result = await response.json()
        console.log('Fetched cryptos:', result.length)
        setData(result)
        setError(null)
        if (process.env.NODE_ENV !== 'test') {
          cache.set(cacheKey, { data: result, timestamp: now })
        }
      } catch (err) {
        console.error('Error fetching top cryptos:', err)
        logger.error({ err }, 'Failed to fetch top cryptos')
        setError(err instanceof Error ? err.message : 'Failed to load top cryptocurrencies')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}