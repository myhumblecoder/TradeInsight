import { renderHook, waitFor, act } from '@testing-library/react'
import {
  describe,
  it,
  expect,
  vi,
  type MockedFunction,
  beforeEach,
  afterEach,
} from 'vitest'
import { useCoinbaseData } from '../useCoinbaseData'

// Mock fetch
global.fetch = vi.fn()

describe('useCoinbaseData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })
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

    ;(global.fetch as MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPriceResponse),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCandlesResponse),
      } as Response)

    const { result } = renderHook(() => useCoinbaseData('bitcoin'))

    // Advance through all timeouts in the hook (500ms + 800ms)
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    await waitFor(
      () => {
        expect(result.current.price).toBe(50000)
        expect(result.current.candles).toEqual(expectedCandles)
      },
      { timeout: 3000 }
    )
  })

  it('should handle API errors', async () => {
    ;(global.fetch as MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response)

    const { result } = renderHook(() => useCoinbaseData('BTC'))

    // Advance through all timeouts in the hook to let the error handling complete
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    await waitFor(
      () => {
        expect(result.current.error).toBe('Failed to fetch candles data')
      },
      { timeout: 3000 }
    )
  })
})
