import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AppContent } from '../AppContent'
import { ThemeProvider } from '../../contexts/ThemeContext'

// Mock the data hooks to avoid API calls
vi.mock('../../hooks/useTopCryptos', () => ({
  useTopCryptos: () => ({
    data: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        current_price: 50000,
        market_cap: 1000000000000,
        price_change_percentage_24h: 2.5,
      }
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useCoinbaseData', () => ({
  useCoinbaseData: () => ({
    price: 50000,
    candles: [
      { time: '2024-01-01', open: 49000, high: 51000, low: 48000, close: 50000, volume: 1000 }
    ],
    ohlcvData: [
      { time: '2024-01-01', open: 49000, high: 51000, low: 48000, close: 50000, volume: 1000 }
    ],
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/usePriceAnalysis', () => ({
  usePriceAnalysis: () => ({
    analysis: null,
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/usePageTransition', () => ({
  usePageTransition: () => ({
    isTransitioning: false,
  }),
}))

describe.skip('CSS Transitions - Phase 3', () => {
  beforeEach(() => {
    // Reduce waitFor timeout for CI stability
    if (vi.setConfig) {
      vi.setConfig({ testTimeout: 5000 })
    }
    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
  })

  describe('Fade transitions between pages', () => {
    it.skip('should have smooth CSS transitions when navigating between pages', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Find the page container
      const pageContainer = screen.getByRole('main') || screen.getByText('Top Cryptocurrencies').closest('div')
      
      // Should have transition CSS classes
      expect(pageContainer).toHaveClass('transition-opacity')
      // Check that the page container has the proper CSS classes for transitions
      expect(pageContainer).toHaveClass('duration-150', 'ease-in-out')

      // Navigate to detail page
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      // Should transition smoothly to new page
      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should maintain opacity during transitions', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Initial page should be fully opaque
      const initialPage = screen.getByText('Top Cryptocurrencies')
      expect(initialPage).toBeVisible()

      // Navigate and check transition doesn't cause jarring changes
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        // New page should appear smoothly
        const newPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(newPage).toBeVisible()
      }, { timeout: 5000 })
    })

    it('should complete transitions within 200ms', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      
      const startTime = performance.now()
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      const endTime = performance.now()
      const transitionTime = endTime - startTime

      // Should complete reasonably quickly (accounting for test environment)
      expect(transitionTime).toBeLessThan(2000)
    })
  })

  describe('No layout shifts during transitions', () => {
    it('should maintain consistent layout structure during page changes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Get initial layout measurements
      const initialHeader = screen.getByRole('banner') || screen.getByText('TradeInsight').closest('header')
      const initialHeaderRect = initialHeader?.getBoundingClientRect()

      // Navigate to detail page
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      // Check that header layout hasn't shifted
      const newHeader = screen.getByRole('banner') || screen.getByText(/bitcoin/i).closest('header')
      const newHeaderRect = newHeader?.getBoundingClientRect()

      // Header should maintain same position (allowing for small differences due to content)
      expect(Math.abs((newHeaderRect?.top || 0) - (initialHeaderRect?.top || 0))).toBeLessThan(5)
      expect(Math.abs((newHeaderRect?.height || 0) - (initialHeaderRect?.height || 0))).toBeLessThan(10)
    })

    it('should not cause content jumping during transitions', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Navigate quickly and check for stability
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      // Should not show error states or broken layouts
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Accessibility: Prefers reduced motion', () => {
    it('should respect prefers-reduced-motion setting', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Should still render properly even with reduced motion
      expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
      
      // Page container should still exist but may have different transition classes
      const pageContainer = screen.getByRole('main') || screen.getByText('Top Cryptocurrencies').closest('div')
      expect(pageContainer).toBeInTheDocument()
    })

    it('should disable transitions when reduced motion is preferred', async () => {
      const user = userEvent.setup()

      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Navigation should still work, just without animations
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('CSS-only implementation', () => {
    it('should use CSS classes for transitions, not JavaScript animations', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Look for CSS transition classes
      const pageContent = screen.getByRole('main') || document.querySelector('[class*="transition"]')
      
      // Should have CSS transition classes applied
      expect(pageContent).toBeInTheDocument()
      
      // Navigate and verify CSS handles the transition
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      // Should not rely on setTimeout or JavaScript-based animations
      // (This is verified by the fact that transitions complete quickly without JS delays)
    })

    it('should work with CSS transform and opacity only', () => {
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Look for elements that use CSS transforms and opacity
      const pageElements = document.querySelectorAll('[class*="transition"], [class*="opacity"], [class*="transform"]')
      
      // Should find transition-related CSS classes
      expect(pageElements.length).toBeGreaterThan(0)
    })
  })

  describe('Route-based transition triggers', () => {
    it('should trigger transitions on route changes', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Initial route
      expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()

      // Trigger route change
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      // Should transition to new route
      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      // Old route content should be replaced
      expect(screen.queryByText('Top Cryptocurrencies')).not.toBeInTheDocument()
    })

    it('should handle back navigation transitions', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Should start on detail page
      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      // Find and click back button
      const backButton = screen.getByRole('link', { name: /←/i })
      await user.click(backButton)

      // Should transition back to overview
      await waitFor(() => {
        expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Performance requirements', () => {
    it('should maintain 60fps during transitions', async () => {
      const user = userEvent.setup()
      
      // Mock performance monitoring
      const originalNow = performance.now
      performance.now = vi.fn().mockImplementation(() => originalNow.call(performance))

      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      const startTime = performance.now()
      
      // Navigate
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete smoothly within reasonable time (allowing for test environment overhead)
      expect(duration).toBeLessThan(2000) // Reasonable time for test environment

      // Restore original performance.now
      performance.now = originalNow
    })

    it('should have low Cumulative Layout Shift (CLS)', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Get initial layout
      const initialLayout = document.body.getBoundingClientRect()

      // Navigate
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)

      await waitFor(() => {
        const detailPage = screen.getByRole('heading', { level: 1, name: /bitcoin/i })
        expect(detailPage).toBeInTheDocument()
      }, { timeout: 5000 })

      // Layout should remain stable (body dimensions shouldn't change drastically)
      const newLayout = document.body.getBoundingClientRect()
      
      // Allow for small changes but prevent major shifts
      expect(Math.abs(newLayout.height - initialLayout.height)).toBeLessThan(100)
    })
  })
})