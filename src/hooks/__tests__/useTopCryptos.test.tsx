import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTopCryptos } from '../useTopCryptos'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useTopCryptos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock setTimeout to avoid delays in tests
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
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
    } as Response)

    const { result } = renderHook(() => useTopCryptos())

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBe(null)

    // Fast-forward past the setTimeout delay and let async operations complete
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1'
    )
  })

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTopCryptos())

    // Fast-forward past the setTimeout delay and let async operations complete
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    expect(result.current.data).toEqual([])
    expect(result.current.error).toBe('Network error')
  })
})