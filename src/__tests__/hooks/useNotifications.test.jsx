import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import toast from 'react-hot-toast'
import { useNotifications } from '../../hooks/useNotifications'

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn().mockReturnValue('mock-toast-id'),
    dismiss: vi.fn(),
  }),
}))

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns all notification functions', () => {
    const { result } = renderHook(() => useNotifications())
    expect(typeof result.current.showSuccess).toBe('function')
    expect(typeof result.current.showError).toBe('function')
    expect(typeof result.current.showLoading).toBe('function')
    expect(typeof result.current.dismiss).toBe('function')
    expect(typeof result.current.showInfo).toBe('function')
  })

  it('showSuccess calls toast.success with correct message', () => {
    const { result } = renderHook(() => useNotifications())
    result.current.showSuccess('Guardado correctamente')
    expect(toast.success).toHaveBeenCalledWith('Guardado correctamente', expect.objectContaining({ duration: 4000 }))
  })

  it('showError calls toast.error with correct message', () => {
    const { result } = renderHook(() => useNotifications())
    result.current.showError('Ocurrió un error')
    expect(toast.error).toHaveBeenCalledWith('Ocurrió un error', expect.objectContaining({ duration: 5000 }))
  })

  it('showLoading calls toast.loading and returns toast id', () => {
    const { result } = renderHook(() => useNotifications())
    const id = result.current.showLoading('Cargando...')
    expect(toast.loading).toHaveBeenCalledWith('Cargando...')
    expect(id).toBe('mock-toast-id')
  })

  it('dismiss calls toast.dismiss with the given id', () => {
    const { result } = renderHook(() => useNotifications())
    result.current.dismiss('some-toast-id')
    expect(toast.dismiss).toHaveBeenCalledWith('some-toast-id')
  })

  it('showInfo calls toast with info icon', () => {
    const { result } = renderHook(() => useNotifications())
    result.current.showInfo('Información importante')
    expect(toast).toHaveBeenCalledWith('Información importante', expect.objectContaining({ icon: 'ℹ️' }))
  })

  it('functions are stable across re-renders (useCallback)', () => {
    const { result, rerender } = renderHook(() => useNotifications())
    const first = result.current.showSuccess
    rerender()
    expect(result.current.showSuccess).toBe(first)
  })
})
