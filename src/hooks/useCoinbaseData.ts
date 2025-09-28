import { useState, useEffect } from 'react'
import logger from '../utils/logger'

interface CoinbaseData {
  price: number | null
  candles: any[]
  error: string | null
  loading: boolean
}

export const useCoinbaseData = (symbol: string): CoinbaseData => {
  const [price, setPrice] = useState<number | null>(null)
  const [candles, setCandles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch price from Coinbase, fallback to CoinGecko
        let btcPrice = null
        try {
          const priceRes = await fetch(
            `https://api.coinbase.com/v2/prices/BTC-USD/spot`
          )
          if (priceRes.ok) {
            const priceData = await priceRes.json()
            btcPrice = parseFloat(priceData.data?.amount) || null
          }
        } catch (err) {
          logger.warn({ error: err }, 'Coinbase price API failed, trying CoinGecko')
        }

        if (btcPrice === null) {
          try {
            const fallbackRes = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
            )
            if (fallbackRes.ok) {
              const data = await fallbackRes.json()
              btcPrice = data.bitcoin?.usd || null
            }
          } catch (err) {
            logger.error({ error: err }, 'Fallback price API failed')
            setError('Failed to fetch price data')
            setLoading(false)
            return
          }
        }

        // Fetch candles from CoinGecko (free alternative)
        const candlesRes = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1`
        )
        let candlesData = []
        if (candlesRes.ok) {
          const data = await candlesRes.json()
          // CoinGecko returns {prices: [[timestamp, price], ...]}
          candlesData = data.prices?.map(([ts, price]: [number, number]) => [ts, price, price, price, price]) || [] // Mock OHLC as close
        } else {
          logger.warn({ status: candlesRes.status }, 'Candles API failed')
          setError('Failed to fetch candles data')
          setLoading(false)
          return
        }

        setPrice(btcPrice)
        setCandles(candlesData)
      } catch (err) {
        logger.error({ error: err }, 'Failed to fetch Coinbase data')
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [symbol])

  return { price, candles, error, loading }
}