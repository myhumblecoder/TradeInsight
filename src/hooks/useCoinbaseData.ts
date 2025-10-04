import { useState, useEffect } from 'react'
import logger from '../utils/logger'
import { convertCandlesToOHLCV } from '../utils/dataConversion'
import { type OHLCV } from '../utils/priceAnalysis'

interface CoinbaseData {
  price: number | null
  candles: number[][]
  ohlcvData: OHLCV[]
  error: string | null
  loading: boolean
}

// Simple in-memory cache
const cache = new Map<
  string,
  { data: { price: number | null; candles: number[][] }; timestamp: number }
>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for price/candles (reduce API calls)

// Map CoinGecko symbols to Coinbase product IDs
const coinbaseProductMap: Record<string, string> = {
  bitcoin: 'BTC-USD',
  ethereum: 'ETH-USD',
  xrp: 'XRP-USD',
  ripple: 'XRP-USD', // In case API returns 'ripple' as ID
  // Add more as needed
}

export const useCoinbaseData = (
  symbol: string,
  granularity: number = 86400,
  refreshTrigger: number = 0
): CoinbaseData => {
  const [price, setPrice] = useState<number | null>(null)
  const [candles, setCandles] = useState<number[][]>([])
  const [ohlcvData, setOhlcvData] = useState<OHLCV[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cacheKey = `${symbol}-${granularity}`
    const now = Date.now()
    const cached = cache.get(cacheKey)

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setPrice(cached.data.price)
      setCandles(cached.data.candles)
      setOhlcvData(convertCandlesToOHLCV(cached.data.candles))
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
            logger.warn(
              { error: err instanceof Error ? err.message : String(err) },
              `Coinbase price API failed for ${coinbaseProduct}, trying CoinGecko`
            )
          }
        }

        if (currentPrice === null) {
          try {
            // Add delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500))
            const configuredBase = import.meta.env.VITE_API_BASE_URL as
              | string
              | undefined
            const isDevOrTest =
              import.meta.env.MODE === 'development' ||
              import.meta.env.MODE === 'test'
            const API_BASE =
              configuredBase ??
              (isDevOrTest ? '' : 'https://api.coingecko.com/api/v3')
            const pathPrefix = API_BASE ? API_BASE : '/api'
            const fallbackRes = await fetch(
              `${pathPrefix}/simple/price?ids=${symbol}&vs_currencies=usd`
            )
            if (fallbackRes.ok) {
              const data = await fallbackRes.json()
              currentPrice = data[symbol]?.usd || null
            } else if (fallbackRes.status === 429) {
              // Use last cached price if available during rate limit
              const lastCached = cache.get(cacheKey)
              if (lastCached?.data.price) {
                currentPrice = lastCached.data.price
                logger.warn('Using cached price due to rate limiting')
              } else {
                throw new Error('Rate limited, please try again later.')
              }
            }
          } catch (err) {
            logger.error(
              { error: err instanceof Error ? err.message : String(err) },
              'Fallback price API failed'
            )
            // Try to use cached data even if expired
            const lastCached = cache.get(cacheKey)
            if (lastCached?.data.price) {
              currentPrice = lastCached.data.price
              logger.warn('Using expired cached price due to API failure')
            } else {
              setError('Failed to fetch price data')
              setLoading(false)
              return
            }
          }
        }

        // Fetch candles from CoinGecko (free alternative)
        // Add delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 800))
        const configuredBase = import.meta.env.VITE_API_BASE_URL as
          | string
          | undefined
        const isDevOrTest =
          import.meta.env.MODE === 'development' ||
          import.meta.env.MODE === 'test'
        const API_BASE =
          configuredBase ??
          (isDevOrTest ? '' : 'https://api.coingecko.com/api/v3')
        const pathPrefix = API_BASE ? API_BASE : '/api'
        const candlesRes = await fetch(
          `${pathPrefix}/coins/${symbol}/market_chart?vs_currency=usd&days=${days}`
        )
        let candlesData = []
        if (candlesRes.ok) {
          const data = await candlesRes.json()
          // CoinGecko returns {prices: [[timestamp, price], ...]}
          candlesData =
            data.prices?.map(([ts, price]: [number, number]) => [
              ts,
              price,
              price,
              price,
              price,
            ]) || [] // Mock OHLC as close
        } else {
          if (candlesRes.status === 429) {
            // Use last cached candles if available during rate limit
            const lastCached = cache.get(cacheKey)
            if (
              lastCached?.data.candles &&
              lastCached.data.candles.length > 0
            ) {
              candlesData = lastCached.data.candles
              logger.warn('Using cached candles due to rate limiting')
            } else {
              throw new Error('Rate limited, please try again later.')
            }
          } else {
            logger.warn(
              { status: candlesRes.status, statusText: candlesRes.statusText },
              'Candles API failed'
            )
            // Try to use cached data
            const lastCached = cache.get(cacheKey)
            if (
              lastCached?.data.candles &&
              lastCached.data.candles.length > 0
            ) {
              candlesData = lastCached.data.candles
              logger.warn('Using expired cached candles due to API failure')
            } else {
              setError('Failed to fetch candles data')
              setLoading(false)
              return
            }
          }
        }

        const ohlcv = convertCandlesToOHLCV(candlesData)

        setPrice(currentPrice)
        setCandles(candlesData)
        setOhlcvData(ohlcv)
        if (process.env.NODE_ENV !== 'test') {
          cache.set(cacheKey, {
            data: { price: currentPrice, candles: candlesData },
            timestamp: now,
          })
        }
      } catch (err) {
        logger.error(
          { error: err instanceof Error ? err.message : String(err) },
          'Failed to fetch Coinbase data'
        )
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol, granularity, refreshTrigger])

  return { price, candles, ohlcvData, error, loading }
}
