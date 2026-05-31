type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

const CURRENT_LOG_LEVEL: number = import.meta.env.PROD ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG

export const logger = {
  debug: (...args: unknown[]): void => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) console.log('[DEBUG]', ...args)
  },

  info: (...args: unknown[]): void => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) console.info('[INFO]', ...args)
  },

  warn: (...args: unknown[]): void => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) console.warn('[WARN]', ...args)
  },

  error: (...args: unknown[]): void => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) console.error('[ERROR]', ...args)
  },

  errorWithContext: (context: string, error: unknown, additionalData: Record<string, unknown> = {}): void => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${context}:`, {
        message: error instanceof Error ? error.message : ((error as { message?: string })?.message ?? String(error ?? 'Error desconocido')),
        error,
        ...additionalData,
      })
    }
  },
}
