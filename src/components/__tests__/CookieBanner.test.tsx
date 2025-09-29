import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CookieBanner } from '../CookieBanner'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show banner when no consent is stored', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CookieBanner />)

    expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument()
    expect(screen.getByText('Accept All')).toBeInTheDocument()
    expect(screen.getByText('Manage Preferences')).toBeInTheDocument()
  })

  it('should not show banner when consent is already given', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: Date.now()
    }))

    render(<CookieBanner />)

    expect(screen.queryByText('We use cookies to improve your experience')).not.toBeInTheDocument()
  })

  it('should save consent when Accept All is clicked', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CookieBanner />)

    fireEvent.click(screen.getByText('Accept All'))

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      expect.stringContaining('"necessary":true,"analytics":true,"marketing":true')
    )
  })

  it('should show preferences modal when Manage Preferences is clicked', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CookieBanner />)

    fireEvent.click(screen.getByText('Manage Preferences'))

    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.getByText('Necessary cookies are required for basic site functionality')).toBeInTheDocument()
  })

  it('should allow individual cookie type selection in preferences', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CookieBanner />)

    fireEvent.click(screen.getByText('Manage Preferences'))

    const analyticsCheckbox = screen.getByLabelText('Analytics cookies help us understand how you use our site')

    fireEvent.click(analyticsCheckbox)
    fireEvent.click(screen.getByText('Save Preferences'))

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cookie-consent',
      expect.stringContaining('"necessary":true,"analytics":true,"marketing":false')
    )
  })

  it('should close preferences modal when Cancel is clicked', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(<CookieBanner />)

    fireEvent.click(screen.getByText('Manage Preferences'))
    fireEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
    expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument()
  })

  it('should show expired consent banner after 30 days', () => {
    const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000)
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: false,
      timestamp: thirtyOneDaysAgo
    }))

    render(<CookieBanner />)

    expect(screen.getByText(/We use cookies to improve your experience/)).toBeInTheDocument()
  })
})