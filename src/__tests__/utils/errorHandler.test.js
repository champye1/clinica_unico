import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throwIfError, handleMutationError } from '../../utils/errorHandler'

vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  },
}))

vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('throwIfError', () => {
  it('does nothing when error is null', () => {
    expect(() => throwIfError(null)).not.toThrow()
  })

  it('throws when error is a Supabase PostgrestError', () => {
    const err = { message: 'relation not found', code: '42P01', details: '', hint: '' }
    expect(() => throwIfError(err)).toThrow()
  })

  it('throws the exact error object', () => {
    const err = { message: 'not authorized', code: '42501', details: '', hint: '' }
    expect(() => throwIfError(err)).toThrowError(expect.objectContaining({ message: 'not authorized' }))
  })
})

describe('handleMutationError', () => {
  const showError = vi.fn()

  beforeEach(() => { showError.mockClear() })
  afterEach(() => { vi.restoreAllMocks() })

  it('returns false for generic errors not handled specially', () => {
    const err = new Error('something went wrong')
    const result = handleMutationError(err, showError)
    expect(result).toBe(false)
    expect(showError).not.toHaveBeenCalled()
  })

  it('returns true and calls showError for network errors', () => {
    const err = new Error('Failed to fetch')
    const result = handleMutationError(err, showError)
    expect(result).toBe(true)
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('conexión'))
  })

  it('returns true and calls showError for NetworkError', () => {
    const err = new Error('NetworkError when attempting to fetch resource')
    const result = handleMutationError(err, showError)
    expect(result).toBe(true)
    expect(showError).toHaveBeenCalledWith(expect.stringContaining('conexión'))
  })

  it('returns true for 401 status errors (expired session)', () => {
    const err = { status: 401, message: 'Unauthorized' }
    const result = handleMutationError(err, showError)
    expect(result).toBe(true)
  })

  it('returns true for JWT expired errors', () => {
    const err = new Error('JWT expired')
    const result = handleMutationError(err, showError)
    expect(result).toBe(true)
  })

  it('returns true for PGRST301 code (RLS unauthorized)', () => {
    const err = { code: 'PGRST301', message: 'permission denied' }
    const result = handleMutationError(err, showError)
    expect(result).toBe(true)
  })

  it('handles non-Error objects gracefully', () => {
    const result = handleMutationError('simple string error', showError)
    expect(result).toBe(false)
  })

  it('handles null/undefined without crashing', () => {
    expect(() => handleMutationError(null, showError)).not.toThrow()
    expect(() => handleMutationError(undefined, showError)).not.toThrow()
  })
})
