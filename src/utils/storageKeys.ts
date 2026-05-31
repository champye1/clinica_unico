/** Claves de localStorage usadas en la aplicación. Centralizado para evitar colisiones y typos. */
export const STORAGE_KEYS = {
  THEME: 'app-theme',
  RECORDATORIO_TEMPORAL: 'recordatorio-temporal',
  /** rateLimiter: sufijo dinámico por identificador de usuario */
  LOGIN_ATTEMPTS_PREFIX: 'login_attempts_',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
