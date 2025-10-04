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
const cache = new Map<string, { data: TopCrypto[]; timestamp: number }>()
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes (reduce API calls)

export function useTopCryptos() {
  const [data, setData] = useState<TopCrypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = 'topCryptos'
    const now = Date.now()
    const cached = cache.get(cacheKey)

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      setLoading(false)
      setError(null)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching top cryptos...')
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // Use configured API base if provided. During development and tests we keep an empty
        // base so relative '/api/...' paths still work (Vite dev proxy and tests rely on that).
        const configuredBase = import.meta.env.VITE_API_BASE_URL as
          | string
          | undefined
        const isDevOrTest =
          import.meta.env.MODE === 'development' ||
          import.meta.env.MODE === 'test'
        const API_BASE =
          configuredBase ??
          (isDevOrTest ? '' : 'https://api.coingecko.com/api/v3')
        // If API_BASE is empty (dev/test), use the '/api' prefix so existing Vite proxy and tests
        // that expect '/api/...' continue to work. In production, API_BASE will be an absolute URL.
        const pathPrefix = API_BASE ? API_BASE : '/api'
        const response = await fetch(
          `${pathPrefix}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1`
        )
        console.log('Response status:', response.status)
        if (!response.ok) {
          if (response.status === 429) {
            // Use cached data if available during rate limit
            const lastCached = cache.get(cacheKey)
            if (lastCached?.data && lastCached.data.length > 0) {
              setData(lastCached.data)
              setError(null)
              logger.warn('Using cached top cryptos due to rate limiting')
              return
            }
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
        // Try to use cached data even if expired during errors
        const lastCached = cache.get(cacheKey)
        if (lastCached?.data && lastCached.data.length > 0) {
          setData(lastCached.data)
          setError(null)
          logger.warn('Using expired cached top cryptos due to API failure')
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load top cryptocurrencies'
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
