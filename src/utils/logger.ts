import pino from 'pino'

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(process.env.NODE_ENV !== 'test' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
  // Ensure synchronous logging in tests to avoid unhandled promise rejections
  ...(process.env.NODE_ENV === 'test' && {
    sync: true,
  }),
})

export default logger
