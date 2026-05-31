import { useCallback } from 'react'
import toast from 'react-hot-toast'

interface Notifications {
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showLoading: (message: string) => string
  dismiss: (toastId: string) => void
  showInfo: (message: string) => void
}

export function useNotifications(): Notifications {
  const showSuccess = useCallback((message: string) => {
    toast.success(message, { icon: '✅', duration: 4000 })
  }, [])

  const showError = useCallback((message: string) => {
    toast.error(message, { icon: '❌', duration: 5000 })
  }, [])

  const showLoading = useCallback((message: string) => {
    return toast.loading(message)
  }, [])

  const dismiss = useCallback((toastId: string) => {
    toast.dismiss(toastId)
  }, [])

  const showInfo = useCallback((message: string) => {
    toast(message, { icon: 'ℹ️', duration: 4000 })
  }, [])

  return { showSuccess, showError, showLoading, dismiss, showInfo }
}
