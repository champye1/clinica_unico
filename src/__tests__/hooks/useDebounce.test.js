import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hola', 300))
    expect(result.current).toBe('hola')
  })

  it('does not update before the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'hola' },
    })
    rerender({ value: 'mundo' })
    vi.advanceTimersByTime(200)
    expect(result.current).toBe('hola')
  })

  it('updates after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'hola' },
    })
    rerender({ value: 'mundo' })
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('mundo')
  })

  it('resets the timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'ab' })
    vi.advanceTimersByTime(200)
    rerender({ value: 'abc' })
    vi.advanceTimersByTime(200)
    expect(result.current).toBe('a')
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('abc')
  })

  it('uses default delay of 500ms when no delay given', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    })
    rerender({ value: 'y' })
    vi.advanceTimersByTime(400)
    expect(result.current).toBe('x')
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('y')
  })
})
