import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as Storage

global.localStorage = localStorageMock

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason) => {
  // Ignore logger-related unhandled rejections in tests
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = String(reason.message)
    if (message.includes('pino') || message.includes('logger')) {
      return
    }
  }
  console.warn('Unhandled Promise Rejection:', reason)
})

// Mock console methods to prevent noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args: unknown[]) => {
  // Filter out logger-related errors
  if (args.some(arg => typeof arg === 'string' && (arg.includes('pino') || arg.includes('logger')))) {
    return
  }
  originalConsoleError(...args)
}

console.warn = (...args: unknown[]) => {
  // Filter out logger-related warnings
  if (args.some(arg => typeof arg === 'string' && (arg.includes('pino') || arg.includes('logger')))) {
    return
  }
  originalConsoleWarn(...args)
}