import pino from 'pino'

export interface MetricData {
  event: string
  userId?: string
  data?: Record<string, unknown>
  timestamp?: string
}

export interface ErrorData {
  error: Error | string
  userId?: string
  context?: Record<string, unknown>
  level?: 'warn' | 'error' | 'fatal'
}

const isDevelopment = import.meta.env.MODE === 'development'

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  browser: {
    transmit: {
      level: 'error',
      send: function (level, logEvent) {
        if (!isDevelopment && import.meta.env.VITE_MONITORING_ENDPOINT) {
          fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...logEvent,
              level,
              timestamp: new Date().toISOString(),
              source: 'tradeinsight-frontend',
            }),
          }).catch(console.error)
        }
      },
    },
  },
})

export const trackEvent = (metric: MetricData): void => {
  const eventData = {
    ...metric,
    timestamp: metric.timestamp || new Date().toISOString(),
  }

  logger.info(eventData, `Event: ${metric.event}`)

  if (!isDevelopment && typeof gtag === 'function') {
    gtag('event', metric.event, {
      user_id: metric.userId,
      custom_parameters: metric.data,
    })
  }

  if (!isDevelopment && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }).catch((err) => logger.error(err, 'Failed to send analytics event'))
  }
}

export const trackError = (errorData: ErrorData): void => {
  const error =
    typeof errorData.error === 'string'
      ? new Error(errorData.error)
      : errorData.error

  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    userId: errorData.userId,
    context: errorData.context,
    timestamp: new Date().toISOString(),
  }

  const level = errorData.level || 'error'
  logger[level](logData, `Error: ${error.message}`)

  if (!isDevelopment && import.meta.env.VITE_ERROR_TRACKING_ENDPOINT) {
    fetch(import.meta.env.VITE_ERROR_TRACKING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    }).catch(console.error)
  }
}

export const trackUserEngagement = (
  userId: string,
  action: string,
  data?: Record<string, unknown>
): void => {
  trackEvent({
    event: 'user_engagement',
    userId,
    data: {
      action,
      ...data,
      page: window.location.pathname,
      referrer: document.referrer,
    },
  })
}

export const trackSubscriptionEvent = (
  userId: string,
  event: 'subscription_started' | 'subscription_canceled' | 'payment_failed',
  data?: Record<string, unknown>
): void => {
  trackEvent({
    event,
    userId,
    data,
  })
}

export const trackFeatureUsage = (
  userId: string,
  feature: string,
  isSuccessful: boolean = true,
  data?: Record<string, unknown>
): void => {
  trackEvent({
    event: 'feature_usage',
    userId,
    data: {
      feature,
      successful: isSuccessful,
      ...data,
    },
  })
}

export const startPerformanceMonitoring = (): void => {
  if (!isDevelopment && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          trackEvent({
            event: 'page_performance',
            data: {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded:
                navEntry.domContentLoadedEventEnd -
                navEntry.domContentLoadedEventStart,
              firstPaint: navEntry.loadEventEnd - navEntry.fetchStart,
              page: window.location.pathname,
            },
          })
        }
      }
    })

    observer.observe({ entryTypes: ['navigation'] })
  }
}

declare global {
  function gtag(...args: unknown[]): void
}

startPerformanceMonitoring()
