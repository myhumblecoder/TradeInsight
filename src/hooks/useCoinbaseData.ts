import { useState, useEffect } from 'react'
import logger from '../utils/logger'

interface CoinbaseData {
  price: number | null
  candles: any[]
  error: string | null
  loading: boolean
}

// Simple in-memory cache
const cache = new Map<string, { data: { price: number | null, candles: any[] }, timestamp: number }>()
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for price/candles

// Map CoinGecko symbols to Coinbase product IDs
const coinbaseProductMap: Record<string, string> = {
  bitcoin: 'BTC-USD',
  ethereum: 'ETH-USD',
  xrp: 'XRP-USD',
  ripple: 'XRP-USD', // In case API returns 'ripple' as ID
  // Add more as needed
}

export const useCoinbaseData = (symbol: string, granularity: number = 86400, refreshTrigger: number = 0): CoinbaseData => {
  const [price, setPrice] = useState<number | null>(null)
  const [candles, setCandles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `${symbol}-${granularity}`
    const now = Date.now()
    const cached = cache.get(cacheKey)

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setPrice(cached.data.price)
      setCandles(cached.data.candles)
      setLoading(false)
      setError(null)
      return
    }

    const fetchData = async () => {
      try {
        const days = granularity / 86400

        // Fetch price from Coinbase, fallback to CoinGecko
        let currentPrice = null
        const coinbaseProduct = coinbaseProductMap[symbol]
        if (coinbaseProduct) {
          try {
            const priceRes = await fetch(
              `https://api.coinbase.com/v2/prices/${coinbaseProduct}/spot`
            )
            if (priceRes.ok) {
              const priceData = await priceRes.json()
              currentPrice = parseFloat(priceData.data?.amount) || null
            }
          } catch (err) {
            logger.warn({ error: err instanceof Error ? err.message : String(err) }, `Coinbase price API failed for ${coinbaseProduct}, trying CoinGecko`)
          }
        }

        if (currentPrice === null) {
          try {
            const fallbackRes = await fetch(
              `/api/simple/price?ids=${symbol}&vs_currencies=usd`
            )
            if (fallbackRes.ok) {
              const data = await fallbackRes.json()
              currentPrice = data[symbol]?.usd || null
            } else if (fallbackRes.status === 429) {
              throw new Error('Rate limited, please try again later.')
            }
          } catch (err) {
            logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Fallback price API failed')
            setError('Failed to fetch price data')
            setLoading(false)
            return
          }
        }

        // Fetch candles from CoinGecko (free alternative)
        const candlesRes = await fetch(
          `/api/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`
        )
        let candlesData = []
        if (candlesRes.ok) {
          const data = await candlesRes.json()
          // CoinGecko returns {prices: [[timestamp, price], ...]}
          candlesData = data.prices?.map(([ts, price]: [number, number]) => [ts, price, price, price, price]) || [] // Mock OHLC as close
        } else {
          if (candlesRes.status === 429) {
            throw new Error('Rate limited, please try again later.')
          }
          logger.warn({ status: candlesRes.status, statusText: candlesRes.statusText }, 'Candles API failed')
          setError('Failed to fetch candles data')
          setLoading(false)
          return
        }

        setPrice(currentPrice)
        setCandles(candlesData)
        if (process.env.NODE_ENV !== 'test') {
          cache.set(cacheKey, { data: { price: currentPrice, candles: candlesData }, timestamp: now })
        }
      } catch (err) {
        logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to fetch Coinbase data')
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol, granularity, refreshTrigger])

  return { price, candles, error, loading }
}