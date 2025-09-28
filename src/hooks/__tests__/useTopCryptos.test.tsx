import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTopCryptos } from '../useTopCryptos'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useTopCryptos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches top cryptos successfully', async () => {
    const mockData = [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        current_price: 50000,
        market_cap: 1000000000000,
        price_change_percentage_24h: 2.5,
      },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { result } = renderHook(() => useTopCryptos())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1'
    )
  })

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTopCryptos())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.error).toBe('Network error')
  })
})