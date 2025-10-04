import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { LoadingOverlay } from '../LoadingOverlay'

describe('Loading Overlay - Phase 2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    cleanup()
  })

  describe('Basic functionality', () => {
    it('should not render when isVisible is false', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={false} message="Loading..." />
        </ThemeProvider>
      )

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should render when isVisible is true', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading page..." />
        </ThemeProvider>
      )

      expect(screen.getByText('Loading page...')).toBeInTheDocument()
    })

    it('should use default message when none provided', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} />
        </ThemeProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Theme awareness', () => {
    it('should use light theme colors in light mode', () => {
      // Ensure we're in light mode
      document.documentElement.classList.remove('dark')

      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('bg-gray-100/80')
      // In light mode, the dark classes are present but not active
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should use dark theme colors in dark mode', () => {
      // Set dark mode
      document.documentElement.classList.add('dark')

      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('dark:bg-gray-900/80')

      const content = screen
        .getByText('Loading...')
        .closest('div[class*="bg-white"]')
      expect(content).toHaveClass('dark:bg-gray-800')
    })

    it('should adapt to theme changes correctly', () => {
      const { rerender } = render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      // Verify light theme classes are present
      let overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('bg-gray-100/80', 'dark:bg-gray-900/80')

      // Switch to dark mode manually
      document.documentElement.classList.add('dark')

      // Re-render to see changes
      rerender(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      // Verify dark theme is applied
      expect(document.documentElement).toHaveClass('dark')

      // Loading overlay should still have both theme classes (Tailwind CSS handles the switching)
      overlay = screen.getByText('Loading...').closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('bg-gray-100/80', 'dark:bg-gray-900/80')
    })
  })

  describe('Accessibility', () => {
    it('should have proper z-index to appear above content', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('z-50')
    })

    it('should have proper backdrop blur for visual separation', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('backdrop-blur-sm')
    })

    it('should center the loading content', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center')
    })
  })

  describe('Animation and transitions', () => {
    it('should have smooth transition classes', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const overlay = screen
        .getByText('Loading...')
        .closest('div[class*="fixed"]')
      expect(overlay).toHaveClass('transition-all', 'duration-300')
    })

    it('should show loading spinner', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      // Look for spinning element
      const spinner = screen
        .getByText('Loading...')
        .parentElement?.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should have subtle pulse animation for content', () => {
      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      const content = screen
        .getByText('Loading...')
        .closest('div[class*="animate-pulse"]')
      expect(content).toHaveClass('animate-pulse')
    })
  })

  describe('Performance', () => {
    it('should render quickly', () => {
      const startTime = performance.now()

      render(
        <ThemeProvider>
          <LoadingOverlay isVisible={true} message="Loading..." />
        </ThemeProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render very quickly (under 50ms)
      expect(renderTime).toBeLessThan(50)
    })

    it('should handle rapid show/hide without issues', async () => {
      const { rerender } = render(
        <ThemeProvider>
          <LoadingOverlay isVisible={false} message="Loading..." />
        </ThemeProvider>
      )

      // Rapidly toggle visibility
      for (let i = 0; i < 10; i++) {
        rerender(
          <ThemeProvider>
            <LoadingOverlay isVisible={i % 2 === 0} message="Loading..." />
          </ThemeProvider>
        )
      }

      // Should handle this without crashing and end up hidden
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Integration with navigation', () => {
    it('should work correctly during route changes', async () => {
      const TestApp = ({ showLoading }: { showLoading: boolean }) => (
        <ThemeProvider>
          <MemoryRouter>
            <div>Test Page Content</div>
            <LoadingOverlay isVisible={showLoading} message="Navigating..." />
          </MemoryRouter>
        </ThemeProvider>
      )

      const { rerender } = render(<TestApp showLoading={false} />)

      // Verify no loading overlay initially
      expect(screen.queryByText('Navigating...')).not.toBeInTheDocument()

      // Show loading overlay (simulate navigation start)
      rerender(<TestApp showLoading={true} />)
      expect(screen.getByText('Navigating...')).toBeInTheDocument()

      // Hide loading overlay (simulate navigation complete)
      rerender(<TestApp showLoading={false} />)
      expect(screen.queryByText('Navigating...')).not.toBeInTheDocument()

      // Page content should still be visible
      expect(screen.getByText('Test Page Content')).toBeInTheDocument()
    })
  })
})
