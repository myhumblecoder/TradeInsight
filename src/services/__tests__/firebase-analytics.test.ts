import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  FirebaseAnalyticsService,
  type AnalyticsConfig,
  type TrackEventData,
  type UserProperties,
  type ConversionEvent,
} from '../firebase-analytics'

// Mock Firebase Analytics
const mockAnalytics = {
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
  setCurrentScreen: vi.fn(),
}

const mockGtag = vi.fn()

vi.mock('firebase/analytics', () => ({
  getAnalytics: () => mockAnalytics,
  logEvent: (...args: unknown[]) => mockAnalytics.logEvent(...args),
  setUserId: (...args: unknown[]) => mockAnalytics.setUserId(...args),
  setUserProperties: (...args: unknown[]) =>
    mockAnalytics.setUserProperties(...args),
  setCurrentScreen: (...args: unknown[]) =>
    mockAnalytics.setCurrentScreen(...args),
}))

// Mock Firebase App
const mockApp = { name: 'test-app' }

vi.mock('firebase/app', () => ({
  initializeApp: () => mockApp,
}))

// Mock global gtag
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

describe('FirebaseAnalyticsService', () => {
  let analyticsService: FirebaseAnalyticsService
  const mockConfig: AnalyticsConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-domain.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-bucket',
    messagingSenderId: '123456789',
    appId: 'test-app-id',
    measurementId: 'G-TEST123',
    enableDebugMode: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    analyticsService = new FirebaseAnalyticsService(mockConfig)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(analyticsService).toBeInstanceOf(FirebaseAnalyticsService)
    })

    it('should throw error with invalid configuration', () => {
      const invalidConfig = { ...mockConfig, projectId: '' }
      expect(() => new FirebaseAnalyticsService(invalidConfig)).toThrow()
    })

    it('should initialize in debug mode when enabled', () => {
      const debugConfig = { ...mockConfig, enableDebugMode: true }
      const debugService = new FirebaseAnalyticsService(debugConfig)

      expect(debugService).toBeInstanceOf(FirebaseAnalyticsService)
    })

    it('should work without measurement ID for Firebase-only analytics', () => {
      const configWithoutGA = { ...mockConfig }
      delete (configWithoutGA as any).measurementId

      expect(() => new FirebaseAnalyticsService(configWithoutGA)).not.toThrow()
    })
  })

  describe('user identification', () => {
    it('should set user ID correctly', () => {
      analyticsService.setUserId('user-123')

      expect(mockAnalytics.setUserId).toHaveBeenCalledWith(
        mockAnalytics,
        'user-123'
      )
    })

    it('should set user properties correctly', () => {
      const userProps: UserProperties = {
        subscription_status: 'active',
        user_role: 'premium',
        signup_method: 'google',
        custom_properties: {
          favorite_crypto: 'bitcoin',
          trading_experience: 'intermediate',
        },
      }

      analyticsService.setUserProperties(userProps)

      expect(mockAnalytics.setUserProperties).toHaveBeenCalledWith(
        mockAnalytics,
        expect.objectContaining({
          subscription_status: 'active',
          user_role: 'premium',
          signup_method: 'google',
          favorite_crypto: 'bitcoin',
          trading_experience: 'intermediate',
        })
      )
    })

    it('should clear user ID when provided null', () => {
      analyticsService.setUserId(null)

      expect(mockAnalytics.setUserId).toHaveBeenCalledWith(mockAnalytics, null)
    })

    it('should validate user properties', () => {
      const invalidProps = {
        subscription_status: '', // Invalid empty string
        user_role: 123 as any, // Invalid type
      }

      expect(() => analyticsService.setUserProperties(invalidProps)).toThrow()
    })
  })

  describe('event tracking', () => {
    it('should track basic events correctly', () => {
      const eventData: TrackEventData = {
        event_name: 'page_view',
        parameters: {
          page_title: 'Bitcoin Analysis',
          page_location: '/analysis/bitcoin',
        },
      }

      analyticsService.trackEvent(eventData)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'page_view',
        expect.objectContaining({
          page_title: 'Bitcoin Analysis',
          page_location: '/analysis/bitcoin',
        })
      )
    })

    it('should track user engagement events', () => {
      analyticsService.trackUserEngagement(
        'user-123',
        'crypto_analysis_viewed',
        {
          crypto_symbol: 'BTC',
          analysis_type: 'technical',
        }
      )

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'user_engagement',
        expect.objectContaining({
          action: 'crypto_analysis_viewed',
          user_id: 'user-123',
          crypto_symbol: 'BTC',
          analysis_type: 'technical',
        })
      )
    })

    it('should track subscription events', () => {
      analyticsService.trackSubscriptionEvent(
        'user-123',
        'subscription_started',
        {
          plan: 'monthly',
          amount: 9.99,
          currency: 'USD',
        }
      )

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'subscription_started',
        expect.objectContaining({
          user_id: 'user-123',
          plan: 'monthly',
          amount: 9.99,
          currency: 'USD',
        })
      )
    })

    it('should track feature usage events', () => {
      analyticsService.trackFeatureUsage('user-123', 'ai_analysis', true, {
        model_used: 'gemini-pro',
        response_time: 2.5,
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'feature_usage',
        expect.objectContaining({
          user_id: 'user-123',
          feature: 'ai_analysis',
          successful: true,
          model_used: 'gemini-pro',
          response_time: 2.5,
        })
      )
    })

    it('should validate event data before tracking', () => {
      const invalidEventData = {
        event_name: '', // Invalid empty name
        parameters: {
          invalid_param: undefined, // Invalid undefined value
        },
      } as any

      expect(() => analyticsService.trackEvent(invalidEventData)).toThrow()
    })

    it('should sanitize event parameters', () => {
      const eventData: TrackEventData = {
        event_name: 'test_event',
        parameters: {
          valid_param: 'test',
          null_param: null,
          undefined_param: undefined,
          empty_string: '',
          zero_number: 0,
        },
      }

      analyticsService.trackEvent(eventData)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'test_event',
        expect.objectContaining({
          valid_param: 'test',
          zero_number: 0,
          // null and undefined should be filtered out
        })
      )
    })
  })

  describe('conversion tracking', () => {
    it('should track conversion events', () => {
      const conversionEvent: ConversionEvent = {
        name: 'purchase',
        value: 9.99,
        currency: 'USD',
        transaction_id: 'txn_123',
        parameters: {
          item_category: 'subscription',
          payment_method: 'stripe',
        },
      }

      analyticsService.trackConversion(conversionEvent)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'purchase',
        expect.objectContaining({
          value: 9.99,
          currency: 'USD',
          transaction_id: 'txn_123',
          item_category: 'subscription',
          payment_method: 'stripe',
        })
      )
    })

    it('should track signup conversions', () => {
      analyticsService.trackSignup('user-456', 'email', {
        campaign: 'crypto_newsletter',
        source: 'organic',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'sign_up',
        expect.objectContaining({
          user_id: 'user-456',
          method: 'email',
          campaign: 'crypto_newsletter',
          source: 'organic',
        })
      )
    })

    it('should track purchase events with enhanced ecommerce data', () => {
      analyticsService.trackPurchase('user-123', {
        transaction_id: 'sub_789',
        value: 99.99,
        currency: 'USD',
        items: [
          {
            item_id: 'annual_plan',
            item_name: 'Annual Subscription',
            category: 'subscription',
            quantity: 1,
            price: 99.99,
          },
        ],
        coupon: 'SAVE20',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'purchase',
        expect.objectContaining({
          user_id: 'user-123',
          transaction_id: 'sub_789',
          value: 99.99,
          currency: 'USD',
          items: expect.arrayContaining([
            expect.objectContaining({
              item_id: 'annual_plan',
              item_name: 'Annual Subscription',
              category: 'subscription',
              quantity: 1,
              price: 99.99,
            }),
          ]),
          coupon: 'SAVE20',
        })
      )
    })

    it('should validate conversion event data', () => {
      const invalidConversion = {
        name: 'purchase',
        value: -10, // Invalid negative value
        currency: 'INVALID', // Invalid currency code
      } as ConversionEvent

      expect(() =>
        analyticsService.trackConversion(invalidConversion)
      ).toThrow()
    })
  })

  describe('performance tracking', () => {
    it('should track page performance metrics', () => {
      const performanceData = {
        page_load_time: 1200,
        dom_content_loaded: 800,
        first_paint: 600,
        largest_contentful_paint: 1000,
        cumulative_layout_shift: 0.05,
      }

      analyticsService.trackPerformance('page_load', performanceData)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'page_performance',
        expect.objectContaining({
          metric_type: 'page_load',
          page_load_time: 1200,
          dom_content_loaded: 800,
          first_paint: 600,
          largest_contentful_paint: 1000,
          cumulative_layout_shift: 0.05,
        })
      )
    })

    it('should track API performance', () => {
      analyticsService.trackAPIPerformance('/api/analysis', {
        response_time: 2500,
        status_code: 200,
        cache_hit: false,
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'api_performance',
        expect.objectContaining({
          endpoint: '/api/analysis',
          response_time: 2500,
          status_code: 200,
          cache_hit: false,
        })
      )
    })

    it('should track custom performance metrics', () => {
      analyticsService.trackCustomMetric('ai_analysis_time', 3200, {
        model: 'gemini-pro',
        complexity: 'high',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'custom_metric',
        expect.objectContaining({
          metric_name: 'ai_analysis_time',
          metric_value: 3200,
          model: 'gemini-pro',
          complexity: 'high',
        })
      )
    })
  })

  describe('error tracking', () => {
    it('should track errors with context', () => {
      const error = new Error('API request failed')
      const context = {
        endpoint: '/api/crypto/bitcoin',
        user_id: 'user-123',
        timestamp: Date.now(),
      }

      analyticsService.trackError(error, context)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'app_error',
        expect.objectContaining({
          error_message: 'API request failed',
          error_name: 'Error',
          endpoint: '/api/crypto/bitcoin',
          user_id: 'user-123',
        })
      )
    })

    it('should track JavaScript errors', () => {
      const jsError = {
        message: 'Cannot read property of undefined',
        filename: 'app.js',
        line: 42,
        column: 15,
        stack: 'Error: Cannot read property of undefined\n    at app.js:42:15',
      }

      analyticsService.trackJSError(jsError)

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'js_error',
        expect.objectContaining({
          error_message: 'Cannot read property of undefined',
          filename: 'app.js',
          line: 42,
          column: 15,
        })
      )
    })

    it('should track handled exceptions', () => {
      analyticsService.trackHandledException(
        'ValidationError',
        'Invalid email format',
        {
          input_value: 'invalid-email',
          validation_rule: 'email',
        }
      )

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'handled_exception',
        expect.objectContaining({
          exception_type: 'ValidationError',
          exception_message: 'Invalid email format',
          input_value: 'invalid-email',
          validation_rule: 'email',
        })
      )
    })
  })

  describe('screen and navigation tracking', () => {
    it('should track screen views', () => {
      analyticsService.trackScreenView('/dashboard', 'Dashboard', {
        user_type: 'premium',
        load_time: 1200,
      })

      expect(mockAnalytics.setCurrentScreen).toHaveBeenCalledWith(
        mockAnalytics,
        'Dashboard'
      )

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'screen_view',
        expect.objectContaining({
          screen_name: 'Dashboard',
          screen_path: '/dashboard',
          user_type: 'premium',
          load_time: 1200,
        })
      )
    })

    it('should track navigation events', () => {
      analyticsService.trackNavigation('/analysis/bitcoin', '/dashboard', {
        navigation_type: 'click',
        element_id: 'nav_dashboard',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'navigation',
        expect.objectContaining({
          from_path: '/analysis/bitcoin',
          to_path: '/dashboard',
          navigation_type: 'click',
          element_id: 'nav_dashboard',
        })
      )
    })
  })

  describe('custom dimensions and metrics', () => {
    it('should set custom dimensions', () => {
      const customDimensions = {
        subscription_tier: 'premium',
        user_segment: 'active_trader',
        feature_flags: 'new_ui,beta_analysis',
      }

      analyticsService.setCustomDimensions(customDimensions)

      expect(mockAnalytics.setUserProperties).toHaveBeenCalledWith(
        mockAnalytics,
        expect.objectContaining(customDimensions)
      )
    })

    it('should track custom events with dimensions', () => {
      analyticsService.trackCustomEvent('crypto_watchlist_updated', {
        watchlist_size: 15,
        coins_added: 3,
        user_tier: 'premium',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'crypto_watchlist_updated',
        expect.objectContaining({
          watchlist_size: 15,
          coins_added: 3,
          user_tier: 'premium',
        })
      )
    })
  })

  describe('session management', () => {
    it('should start session tracking', () => {
      analyticsService.startSession('user-123', {
        session_id: 'session_456',
        utm_source: 'google',
        utm_campaign: 'crypto_analysis',
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'session_start',
        expect.objectContaining({
          user_id: 'user-123',
          session_id: 'session_456',
          utm_source: 'google',
          utm_campaign: 'crypto_analysis',
        })
      )
    })

    it('should end session tracking', () => {
      analyticsService.endSession('user-123', {
        session_duration: 1800, // 30 minutes
        pages_viewed: 5,
        actions_taken: 12,
      })

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'session_end',
        expect.objectContaining({
          user_id: 'user-123',
          session_duration: 1800,
          pages_viewed: 5,
          actions_taken: 12,
        })
      )
    })
  })

  describe('Google Analytics 4 integration', () => {
    it('should send events to GA4 when measurement ID is configured', () => {
      const eventData: TrackEventData = {
        event_name: 'purchase',
        parameters: {
          transaction_id: 'txn_123',
          value: 9.99,
          currency: 'USD',
        },
      }

      analyticsService.trackEvent(eventData)

      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        transaction_id: 'txn_123',
        value: 9.99,
        currency: 'USD',
      })
    })

    it('should configure GA4 custom parameters', () => {
      analyticsService.configureGA4({
        custom_map: {
          custom_parameter_1: 'subscription_tier',
          custom_parameter_2: 'user_segment',
        },
        send_page_view: false,
      })

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123', {
        custom_map: {
          custom_parameter_1: 'subscription_tier',
          custom_parameter_2: 'user_segment',
        },
        send_page_view: false,
      })
    })
  })

  describe('data privacy and consent', () => {
    it('should respect consent settings', () => {
      analyticsService.setConsentSettings({
        analytics_storage: 'granted',
        ad_storage: 'denied',
        functionality_storage: 'granted',
        personalization_storage: 'granted',
        security_storage: 'granted',
      })

      if (mockConfig.measurementId) {
        expect(mockGtag).toHaveBeenCalledWith('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'denied',
          functionality_storage: 'granted',
          personalization_storage: 'granted',
          security_storage: 'granted',
        })
      }
    })

    it('should enable/disable analytics based on consent', () => {
      analyticsService.setAnalyticsEnabled(false)

      // Subsequent events should not be tracked
      analyticsService.trackEvent({
        event_name: 'test_event',
        parameters: {},
      })

      expect(mockAnalytics.logEvent).not.toHaveBeenCalled()
    })

    it('should anonymize user data when required', () => {
      analyticsService.enableDataAnonymization(true)

      analyticsService.setUserId('user-123')

      // User ID should be hashed or anonymized
      expect(mockAnalytics.setUserId).toHaveBeenCalledWith(
        mockAnalytics,
        expect.stringMatching(/^[a-f0-9]{64}$/) // SHA-256 hash
      )
    })
  })

  describe('debugging and validation', () => {
    it('should provide debug information in development', () => {
      const debugInfo = analyticsService.getDebugInfo()

      expect(debugInfo).toEqual({
        isInitialized: true,
        isEnabled: true,
        measurementId: 'G-TEST123',
        debugMode: true,
        eventsTracked: expect.any(Number),
        lastError: null,
      })
    })

    it('should validate event parameters against GA4 limits', () => {
      const oversizedEvent: TrackEventData = {
        event_name: 'test_event',
        parameters: {},
      }

      // Add 26 parameters (GA4 limit is 25)
      for (let i = 1; i <= 26; i++) {
        oversizedEvent.parameters[`param_${i}`] = `value_${i}`
      }

      expect(() => analyticsService.trackEvent(oversizedEvent)).toThrow(
        'Too many parameters'
      )
    })

    it('should validate parameter value lengths', () => {
      const longValueEvent: TrackEventData = {
        event_name: 'test_event',
        parameters: {
          long_param: 'a'.repeat(101), // GA4 limit is 100 characters
        },
      }

      expect(() => analyticsService.trackEvent(longValueEvent)).toThrow(
        'Parameter value too long'
      )
    })
  })

  describe('offline and error handling', () => {
    it('should queue events when offline', () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      })

      analyticsService.trackEvent({
        event_name: 'offline_event',
        parameters: { test: 'value' },
      })

      // Event should be queued, not sent immediately
      expect(mockAnalytics.logEvent).not.toHaveBeenCalled()

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      })

      // Trigger queue processing
      analyticsService.processOfflineQueue()

      expect(mockAnalytics.logEvent).toHaveBeenCalledWith(
        mockAnalytics,
        'offline_event',
        expect.objectContaining({ test: 'value' })
      )
    })

    it('should handle analytics initialization failures gracefully', () => {
      const failingConfig = { ...mockConfig, apiKey: 'invalid' }

      expect(() => new FirebaseAnalyticsService(failingConfig)).not.toThrow()
    })
  })
})
