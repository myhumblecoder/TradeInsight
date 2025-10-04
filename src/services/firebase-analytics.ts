import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  setCurrentScreen,
  type Analytics,
} from 'firebase/analytics'
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { z } from 'zod'
import crypto from 'crypto'

export const AnalyticsConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  authDomain: z.string().min(1, 'Auth domain is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  storageBucket: z.string().min(1, 'Storage bucket is required'),
  messagingSenderId: z.string().min(1, 'Messaging sender ID is required'),
  appId: z.string().min(1, 'App ID is required'),
  measurementId: z.string().optional(), // GA4 measurement ID
  enableDebugMode: z.boolean().default(false),
})

export const UserPropertiesSchema = z.object({
  subscription_status: z.string().min(1).optional(),
  user_role: z.string().min(1).optional(),
  signup_method: z.string().min(1).optional(),
  custom_properties: z.record(z.string(), z.any()).optional(),
})

export const TrackEventDataSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  parameters: z.record(z.string(), z.any()).default({}),
})

export const ConversionEventSchema = z.object({
  name: z.string().min(1),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency codes
  transaction_id: z.string().optional(),
  parameters: z.record(z.string(), z.any()).default({}),
})

export type AnalyticsConfig = z.infer<typeof AnalyticsConfigSchema>
export type UserProperties = z.infer<typeof UserPropertiesSchema>
export type TrackEventData = z.infer<typeof TrackEventDataSchema>
export type ConversionEvent = z.infer<typeof ConversionEventSchema>

export type ConsentSettings = {
  analytics_storage: 'granted' | 'denied'
  ad_storage: 'granted' | 'denied'
  functionality_storage: 'granted' | 'denied'
  personalization_storage: 'granted' | 'denied'
  security_storage: 'granted' | 'denied'
}

export type GA4Config = {
  custom_map?: Record<string, string>
  send_page_view?: boolean
  [key: string]: any
}

export type DebugInfo = {
  isInitialized: boolean
  isEnabled: boolean
  measurementId?: string
  debugMode: boolean
  eventsTracked: number
  lastError: string | null
}

interface QueuedEvent {
  type: 'event' | 'user_property' | 'user_id'
  data: any
  timestamp: number
}

export class FirebaseAnalyticsService {
  private app: FirebaseApp
  private analytics: Analytics
  private config: AnalyticsConfig
  private isEnabled: boolean = true
  private eventsTracked: number = 0
  private lastError: string | null = null
  private eventQueue: QueuedEvent[] = []
  private isAnonymized: boolean = false

  constructor(config: AnalyticsConfig) {
    try {
      this.config = AnalyticsConfigSchema.parse(config)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Analytics configuration: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      throw error
    }

    try {
      this.app = initializeApp(this.config)
      this.analytics = getAnalytics(this.app)

      // Set up GA4 if measurement ID is provided
      if (
        this.config.measurementId &&
        typeof window !== 'undefined' &&
        window.gtag
      ) {
        this.setupGA4()
      }

      // Set up offline event queueing
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this.processOfflineQueue())
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error)
      // Don't throw to allow graceful degradation
    }
  }

  private setupGA4(): void {
    if (
      !this.config.measurementId ||
      typeof window === 'undefined' ||
      !window.gtag
    ) {
      return
    }

    // Configure GA4
    window.gtag('config', this.config.measurementId, {
      debug_mode: this.config.enableDebugMode,
    })
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  private queueEvent(type: QueuedEvent['type'], data: any): void {
    this.eventQueue.push({
      type,
      data,
      timestamp: Date.now(),
    })

    // Limit queue size
    if (this.eventQueue.length > 100) {
      this.eventQueue = this.eventQueue.slice(-50)
    }
  }

  private sanitizeParameters(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(params)) {
      // Skip null, undefined, and empty string values
      if (value === null || value === undefined) {
        continue
      }

      // Allow empty strings for some specific cases but skip most
      if (value === '' && !['currency', 'method'].includes(key)) {
        continue
      }

      sanitized[key] = value
    }

    return sanitized
  }

  private validateEventParameters(
    eventName: string,
    parameters: Record<string, any>
  ): void {
    // GA4 limits
    const parameterCount = Object.keys(parameters).length
    if (parameterCount > 25) {
      throw new Error(
        'Too many parameters: GA4 allows maximum 25 custom parameters per event'
      )
    }

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.length > 100) {
        throw new Error(
          `Parameter value too long: "${key}" exceeds 100 characters`
        )
      }
    }
  }

  private hashUserId(userId: string): string {
    if (!this.isAnonymized) {
      return userId
    }

    return crypto.createHash('sha256').update(userId).digest('hex')
  }

  // User identification
  setUserId(userId: string | null): void {
    if (!this.isEnabled) return

    try {
      const processedUserId = userId ? this.hashUserId(userId) : null

      if (this.isOnline()) {
        setUserId(this.analytics, processedUserId)

        if (
          this.config.measurementId &&
          typeof window !== 'undefined' &&
          window.gtag
        ) {
          window.gtag('config', this.config.measurementId, {
            user_id: processedUserId,
          })
        }
      } else {
        this.queueEvent('user_id', processedUserId)
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to set user ID:', error)
    }
  }

  setUserProperties(properties: UserProperties): void {
    if (!this.isEnabled) return

    try {
      UserPropertiesSchema.parse(properties)

      const flattenedProps = {
        ...properties,
        ...(properties.custom_properties || {}),
      }
      delete flattenedProps.custom_properties

      if (this.isOnline()) {
        setUserProperties(this.analytics, flattenedProps)

        if (
          this.config.measurementId &&
          typeof window !== 'undefined' &&
          window.gtag
        ) {
          window.gtag('config', this.config.measurementId, {
            custom_map: flattenedProps,
          })
        }
      } else {
        this.queueEvent('user_property', flattenedProps)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid user properties: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to set user properties:', error)
    }
  }

  // Event tracking
  trackEvent(eventData: TrackEventData): void {
    if (!this.isEnabled) return

    try {
      const validatedData = TrackEventDataSchema.parse(eventData)
      const sanitizedParams = this.sanitizeParameters(validatedData.parameters)

      this.validateEventParameters(validatedData.event_name, sanitizedParams)

      if (this.isOnline()) {
        logEvent(this.analytics, validatedData.event_name, sanitizedParams)

        if (
          this.config.measurementId &&
          typeof window !== 'undefined' &&
          window.gtag
        ) {
          window.gtag('event', validatedData.event_name, sanitizedParams)
        }

        this.eventsTracked++
      } else {
        this.queueEvent('event', {
          name: validatedData.event_name,
          parameters: sanitizedParams,
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid event data: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to track event:', error)
    }
  }

  trackUserEngagement(
    userId: string,
    action: string,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'user_engagement',
      parameters: {
        action,
        user_id: userId,
        page: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        ...additionalData,
      },
    })
  }

  trackSubscriptionEvent(
    userId: string,
    eventType:
      | 'subscription_started'
      | 'subscription_canceled'
      | 'payment_failed',
    data?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: eventType,
      parameters: {
        user_id: userId,
        ...data,
      },
    })
  }

  trackFeatureUsage(
    userId: string,
    feature: string,
    isSuccessful: boolean = true,
    data?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'feature_usage',
      parameters: {
        user_id: userId,
        feature,
        successful: isSuccessful,
        ...data,
      },
    })
  }

  // Conversion tracking
  trackConversion(conversionEvent: ConversionEvent): void {
    try {
      ConversionEventSchema.parse(conversionEvent)

      this.trackEvent({
        event_name: conversionEvent.name,
        parameters: {
          value: conversionEvent.value,
          currency: conversionEvent.currency,
          transaction_id: conversionEvent.transaction_id,
          ...conversionEvent.parameters,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid conversion event: ${error.errors.map((e) => e.message).join(', ')}`
        )
      }
      throw error
    }
  }

  trackSignup(
    userId: string,
    method: string,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'sign_up',
      parameters: {
        user_id: userId,
        method,
        ...additionalData,
      },
    })
  }

  trackPurchase(
    userId: string,
    purchaseData: {
      transaction_id: string
      value: number
      currency: string
      items?: Array<{
        item_id: string
        item_name: string
        category: string
        quantity: number
        price: number
      }>
      coupon?: string
    }
  ): void {
    this.trackEvent({
      event_name: 'purchase',
      parameters: {
        user_id: userId,
        transaction_id: purchaseData.transaction_id,
        value: purchaseData.value,
        currency: purchaseData.currency,
        items: purchaseData.items,
        coupon: purchaseData.coupon,
      },
    })
  }

  // Performance tracking
  trackPerformance(
    metricType: string,
    performanceData: Record<string, number>
  ): void {
    this.trackEvent({
      event_name: 'page_performance',
      parameters: {
        metric_type: metricType,
        ...performanceData,
      },
    })
  }

  trackAPIPerformance(
    endpoint: string,
    performanceData: {
      response_time: number
      status_code: number
      cache_hit?: boolean
    }
  ): void {
    this.trackEvent({
      event_name: 'api_performance',
      parameters: {
        endpoint,
        response_time: performanceData.response_time,
        status_code: performanceData.status_code,
        cache_hit: performanceData.cache_hit || false,
      },
    })
  }

  trackCustomMetric(
    metricName: string,
    metricValue: number,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'custom_metric',
      parameters: {
        metric_name: metricName,
        metric_value: metricValue,
        ...additionalData,
      },
    })
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent({
      event_name: 'app_error',
      parameters: {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack?.substring(0, 500), // Limit stack trace length
        ...context,
      },
    })
  }

  trackJSError(errorInfo: {
    message: string
    filename?: string
    line?: number
    column?: number
    stack?: string
  }): void {
    this.trackEvent({
      event_name: 'js_error',
      parameters: {
        error_message: errorInfo.message,
        filename: errorInfo.filename,
        line: errorInfo.line,
        column: errorInfo.column,
        stack: errorInfo.stack?.substring(0, 500),
      },
    })
  }

  trackHandledException(
    exceptionType: string,
    message: string,
    context?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'handled_exception',
      parameters: {
        exception_type: exceptionType,
        exception_message: message,
        ...context,
      },
    })
  }

  // Screen and navigation tracking
  trackScreenView(
    screenPath: string,
    screenName: string,
    additionalData?: Record<string, any>
  ): void {
    try {
      setCurrentScreen(this.analytics, screenName)

      this.trackEvent({
        event_name: 'screen_view',
        parameters: {
          screen_name: screenName,
          screen_path: screenPath,
          ...additionalData,
        },
      })
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to track screen view:', error)
    }
  }

  trackNavigation(
    fromPath: string,
    toPath: string,
    additionalData?: Record<string, any>
  ): void {
    this.trackEvent({
      event_name: 'navigation',
      parameters: {
        from_path: fromPath,
        to_path: toPath,
        ...additionalData,
      },
    })
  }

  // Custom dimensions and events
  setCustomDimensions(dimensions: Record<string, string>): void {
    this.setUserProperties({ custom_properties: dimensions })
  }

  trackCustomEvent(eventName: string, parameters: Record<string, any>): void {
    this.trackEvent({
      event_name: eventName,
      parameters,
    })
  }

  // Session management
  startSession(userId: string, sessionData?: Record<string, any>): void {
    this.trackEvent({
      event_name: 'session_start',
      parameters: {
        user_id: userId,
        session_id: sessionData?.session_id || `session_${Date.now()}`,
        ...sessionData,
      },
    })
  }

  endSession(
    userId: string,
    sessionData?: {
      session_duration?: number
      pages_viewed?: number
      actions_taken?: number
    }
  ): void {
    this.trackEvent({
      event_name: 'session_end',
      parameters: {
        user_id: userId,
        session_duration: sessionData?.session_duration,
        pages_viewed: sessionData?.pages_viewed,
        actions_taken: sessionData?.actions_taken,
      },
    })
  }

  // GA4 configuration
  configureGA4(config: GA4Config): void {
    if (
      !this.config.measurementId ||
      typeof window === 'undefined' ||
      !window.gtag
    ) {
      return
    }

    window.gtag('config', this.config.measurementId, config)
  }

  // Consent and privacy
  setConsentSettings(consent: ConsentSettings): void {
    if (
      this.config.measurementId &&
      typeof window !== 'undefined' &&
      window.gtag
    ) {
      window.gtag('consent', 'update', consent)
    }
  }

  setAnalyticsEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  enableDataAnonymization(enable: boolean): void {
    this.isAnonymized = enable
  }

  // Offline support
  processOfflineQueue(): void {
    if (!this.isOnline() || this.eventQueue.length === 0) {
      return
    }

    const queueToProcess = [...this.eventQueue]
    this.eventQueue = []

    for (const queuedEvent of queueToProcess) {
      try {
        switch (queuedEvent.type) {
          case 'event':
            logEvent(
              this.analytics,
              queuedEvent.data.name,
              queuedEvent.data.parameters
            )
            this.eventsTracked++
            break
          case 'user_property':
            setUserProperties(this.analytics, queuedEvent.data)
            break
          case 'user_id':
            setUserId(this.analytics, queuedEvent.data)
            break
        }
      } catch (error) {
        console.error('Failed to process queued event:', error)
      }
    }
  }

  // Debugging and monitoring
  getDebugInfo(): DebugInfo {
    return {
      isInitialized: !!this.analytics,
      isEnabled: this.isEnabled,
      measurementId: this.config.measurementId,
      debugMode: this.config.enableDebugMode,
      eventsTracked: this.eventsTracked,
      lastError: this.lastError,
    }
  }

  // Utility methods
  getAnalytics(): Analytics {
    return this.analytics
  }

  getApp(): FirebaseApp {
    return this.app
  }
}

// Global gtag function declaration
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
