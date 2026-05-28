import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getLoginAttempts,
  recordFailedAttempt,
  clearLoginAttempts,
  clearAllLoginAttempts,
  isLocked,
  formatRemainingTime,
} from '../../utils/rateLimiter'

// Proxy-based localStorage stub: Object.keys(mock) returns stored keys
const makeLocalStorageMock = () => {
  const store = {}
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'getItem') return (k) => (k in store ? store[k] : null)
      if (prop === 'setItem') return (k, v) => { store[k] = String(v) }
      if (prop === 'removeItem') return (k) => { delete store[k] }
      if (prop === 'key') return (i) => Object.keys(store)[i] ?? null
      if (prop === 'length') return Object.keys(store).length
      return store[prop]
    },
    set(_, prop, value) { store[prop] = String(value); return true },
    ownKeys() { return Object.keys(store) },
    getOwnPropertyDescriptor(_, key) {
      if (key in store) return { value: store[key], writable: true, enumerable: true, configurable: true }
    },
    has(_, key) { return key in store },
  })
}

describe('rateLimiter', () => {
  let lsMock
  beforeEach(() => {
    lsMock = makeLocalStorageMock()
    vi.stubGlobal('localStorage', lsMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('getLoginAttempts', () => {
    it('returns 0 attempts for unknown identifier', () => {
      const { attempts, lockedUntil } = getLoginAttempts('usuario@test.com')
      expect(attempts).toBe(0)
      expect(lockedUntil).toBeNull()
    })

    it('returns stored attempts', () => {
      recordFailedAttempt('usuario@test.com')
      recordFailedAttempt('usuario@test.com')
      const { attempts } = getLoginAttempts('usuario@test.com')
      expect(attempts).toBe(2)
    })

    it('resets expired lockouts', () => {
      const pastLockout = Date.now() - 1000
      localStorage.setItem('login_attempts_test@test.com', JSON.stringify({
        attempts: 5,
        lockedUntil: pastLockout,
        lastAttempt: Date.now(),
      }))
      const { attempts, lockedUntil } = getLoginAttempts('test@test.com')
      expect(attempts).toBe(0)
      expect(lockedUntil).toBeNull()
    })
  })

  describe('recordFailedAttempt', () => {
    it('increments attempts on each call', () => {
      recordFailedAttempt('a@b.com')
      recordFailedAttempt('a@b.com')
      recordFailedAttempt('a@b.com')
      const { attempts } = getLoginAttempts('a@b.com')
      expect(attempts).toBe(3)
    })

    it('locks after 5 attempts', () => {
      for (let i = 0; i < 4; i++) recordFailedAttempt('x@x.com')
      const { isLocked: locked } = recordFailedAttempt('x@x.com')
      expect(locked).toBe(true)
    })

    it('returns remaining attempts', () => {
      const { remainingAttempts } = recordFailedAttempt('y@y.com')
      expect(remainingAttempts).toBe(4)
    })
  })

  describe('clearLoginAttempts', () => {
    it('removes stored data for identifier', () => {
      recordFailedAttempt('z@z.com')
      clearLoginAttempts('z@z.com')
      const { attempts } = getLoginAttempts('z@z.com')
      expect(attempts).toBe(0)
    })
  })

  describe('clearAllLoginAttempts', () => {
    it('removes all login attempt keys', () => {
      recordFailedAttempt('a@a.com')
      recordFailedAttempt('b@b.com')
      window.localStorage.setItem('other_key', 'value')
      clearAllLoginAttempts()
      expect(getLoginAttempts('a@a.com').attempts).toBe(0)
      expect(getLoginAttempts('b@b.com').attempts).toBe(0)
      expect(window.localStorage.getItem('other_key')).toBe('value')
    })
  })

  describe('isLocked', () => {
    it('returns false for non-locked user', () => {
      const result = isLocked('nuevo@test.com')
      expect(result.isLocked).toBe(false)
    })

    it('returns true for locked user', () => {
      for (let i = 0; i < 5; i++) recordFailedAttempt('blocked@test.com')
      const result = isLocked('blocked@test.com')
      expect(result.isLocked).toBe(true)
    })
  })

  describe('formatRemainingTime', () => {
    it('formats seconds only', () => {
      expect(formatRemainingTime(45)).toBe('45 segundos')
    })

    it('formats minutes and seconds', () => {
      expect(formatRemainingTime(125)).toBe('2 minutos y 5 segundos')
    })

    it('returns empty string for null', () => {
      expect(formatRemainingTime(null)).toBe('')
    })

    it('handles 1 second singular', () => {
      expect(formatRemainingTime(1)).toBe('1 segundo')
    })
  })
})
