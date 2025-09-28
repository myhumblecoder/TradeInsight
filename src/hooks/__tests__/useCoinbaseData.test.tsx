import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useCoinbaseData } from '../useCoinbaseData'

// Mock fetch
global.fetch = vi.fn()

describe('useCoinbaseData', () => {
  it('should fetch current price and historical data', async () => {
    const mockPriceResponse = { data: { amount: '50000' } }
    const mockCandlesResponse = {
      prices: [
        [1640995200000, 50000],
        [1640998800000, 50200],
      ],
    }

    const expectedCandles = [
      [1640995200000, 50000, 50000, 50000, 50000],
      [1640998800000, 50200, 50200, 50200, 50200],
    ]

    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPriceResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCandlesResponse),
      })

    const { result } = renderHook(() => useCoinbaseData('bitcoin'))

    await waitFor(() => {
      expect(result.current.price).toBe(50000)
      expect(result.current.candles).toEqual(expectedCandles)
    })
  })

  it('should handle API errors', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 503,
    })

    const { result } = renderHook(() => useCoinbaseData('BTC'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch candles data')
    })
  })
})