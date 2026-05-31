import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../config/supabase'

const CLINIC_INFO_KEY = 'clinic_info'

export const CLINIC_INFO_DEFAULTS = {
  nombre: 'QuirúrgicaPro',
  tagline: 'Gestión Quirúrgica',
  rut: '',
  telefono: '',
  email: '',
  direccion: '',
  logo_url: '',
}

export function useClinicInfo() {
  return useQuery({
    queryKey: ['clinic-info'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_settings')
        .select('value')
        .eq('key', CLINIC_INFO_KEY)
        .maybeSingle()
      return { ...CLINIC_INFO_DEFAULTS, ...(data?.value || {}) }
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useSaveClinicInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (info) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          key: CLINIC_INFO_KEY,
          value: info,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinic-info'] }),
  })
}
