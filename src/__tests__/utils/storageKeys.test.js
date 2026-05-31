import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS } from '../../utils/storageKeys'

describe('STORAGE_KEYS', () => {
  it('exports the THEME key', () => {
    expect(STORAGE_KEYS.THEME).toBe('app-theme')
  })

  it('exports the RECORDATORIO_TEMPORAL key', () => {
    expect(STORAGE_KEYS.RECORDATORIO_TEMPORAL).toBe('recordatorio-temporal')
  })

  it('exports the LOGIN_ATTEMPTS_PREFIX key', () => {
    expect(STORAGE_KEYS.LOGIN_ATTEMPTS_PREFIX).toBe('login_attempts_')
  })

  it('has exactly 3 keys', () => {
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(3)
  })

  it('all values are non-empty strings', () => {
    Object.values(STORAGE_KEYS).forEach(v => {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })

  it('all keys are unique', () => {
    const values = Object.values(STORAGE_KEYS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })
})
