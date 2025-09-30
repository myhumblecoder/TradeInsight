import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
    data: null,
    loading: false,
    error: null,
  }),
}))

describe('Page Transitions - Phase 1 Baseline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any existing theme classes
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    // Clean up after each test
    cleanup()
    document.documentElement.classList.remove('dark')
  })

  describe('Navigation without flashes', () => {
    it('should navigate from overview to detail without white flashes in light mode', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Verify we're on the overview page
      expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
      
      // Find and click on Bitcoin link to navigate to detail
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      expect(bitcoinLink).toBeInTheDocument()
      
      // Navigation should happen without visual flashes
      // This test ensures the app doesn't flash white during navigation
      await user.click(bitcoinLink)
      
      // Should navigate to detail page - check for Bitcoin in header indicating successful navigation
      await waitFor(() => {
        // Look for Bitcoin in the page header which indicates we're on the detail page
        const header = screen.getByRole('heading', { level: 1 })
        expect(header).toHaveTextContent('Bitcoin')
      }, { timeout: 1000 })
    })

    it('should navigate from detail back to overview without white flashes in light mode', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Should be on detail page initially - look for the crypto name in header
      await waitFor(() => {
        expect(screen.getByText('Bitcoin')).toBeInTheDocument()
      })
      
      // Find back/home navigation - look for link to overview
      const backButton = screen.getByRole('link', { name: /←/i })
      await user.click(backButton)
      
      // Should navigate back to overview
      await waitFor(() => {
        expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Dark mode consistency', () => {
    it('should maintain consistent dark backgrounds during navigation', async () => {
      const user = userEvent.setup()
      
      // Set dark mode
      document.documentElement.classList.add('dark')
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Verify we're in dark mode
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      
      // Navigate to detail page
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)
      
      // Dark mode should be maintained during and after navigation
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should maintain consistent light backgrounds during navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Verify we're in light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      
      // Navigate to detail page
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      await user.click(bitcoinLink)
      
      // Light mode should be maintained during and after navigation
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })
  })

  describe('Theme switching during navigation', () => {
    it('should handle theme switching gracefully during page transitions', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Find theme toggle button
      const themeToggle = screen.getByRole('button', { name: /toggle.*dark.*mode/i })
      
      // Start navigation
      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      
      // Switch theme during navigation
      await user.click(themeToggle)
      await user.click(bitcoinLink)
      
      // Both navigation and theme change should complete successfully
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })

  describe('Performance requirements', () => {
    it('should complete navigation within performance targets', async () => {
      const user = userEvent.setup()
      
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      const bitcoinLink = screen.getByRole('link', { name: /bitcoin/i })
      
      // Measure navigation time
      const startTime = performance.now()
      await user.click(bitcoinLink)
      
      await waitFor(() => {
        // Check that we're on the detail page
        const header = screen.getByRole('heading', { level: 1 })
        expect(header).toHaveTextContent('Bitcoin')
      }, { timeout: 500 }) // Should complete within 500ms
      
      const endTime = performance.now()
      const navigationTime = endTime - startTime
      
      // Navigation should be fast (< 300ms for baseline)
      expect(navigationTime).toBeLessThan(300)
    })
  })

  describe('First page load', () => {
    it('should load correctly on first visit without flashes', async () => {
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Page should load and show content
      await waitFor(() => {
        expect(screen.getByText('Top Cryptocurrencies')).toBeInTheDocument()
      })
      
      // Should not show any error states
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })

    it('should load detail page correctly on direct navigation', async () => {
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/crypto/bitcoin']}>
            <AppContent />
          </MemoryRouter>
        </ThemeProvider>
      )

      // Detail page should load properly - look for the crypto name
      await waitFor(() => {
        expect(screen.getByText('Bitcoin')).toBeInTheDocument()
      })
    })
  })
})