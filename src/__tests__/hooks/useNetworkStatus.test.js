import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

describe('useNetworkStatus', () => {
  it('returns true when navigator.onLine is true', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)
  })

  it('updates to true when online event fires', () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current).toBe(true)
  })

  it('updates to false when offline event fires', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current).toBe(false)
  })

  it('removes event listeners on unmount', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useNetworkStatus())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
