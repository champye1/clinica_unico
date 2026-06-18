import { useQueryClient } from '@tanstack/react-query'
import { useNotifications } from './useNotifications'

// Realtime WebSocket deshabilitado — se usa polling via React Query (refetchInterval)
// Re-habilitar cuando Supabase Realtime esté estable en este proyecto
export function useRealtimeNotifications(_userId, _doctorId = null) {
  useQueryClient()
  useNotifications()
}
