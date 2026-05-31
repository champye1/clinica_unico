import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSecs?: number
}

/**
 * Verifica si el usuario excede el límite de llamadas a un endpoint.
 * Usa la tabla rate_limit_logs en Supabase (solo accesible por service_role).
 * Falla abierto (permite la llamada) si la tabla no existe o hay un error de DB.
 *
 * @param supabase    Cliente Supabase con permisos de service_role
 * @param userId      ID del usuario autenticado
 * @param endpoint    Nombre del endpoint (ej: 'create-doctor')
 * @param maxCalls    Máximo de llamadas permitidas en la ventana
 * @param windowMins  Tamaño de la ventana en minutos
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  maxCalls: number,
  windowMins: number,
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - windowMins * 60 * 1000).toISOString()

    const { count, error: countError } = await supabase
      .from('rate_limit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .gte('created_at', windowStart)

    if (countError) {
      // Fail open: si no podemos verificar, permitimos la llamada
      console.warn('[rateLimit] Error al consultar rate_limit_logs:', countError.message)
      return { allowed: true, remaining: maxCalls }
    }

    const current = count ?? 0

    if (current >= maxCalls) {
      return { allowed: false, remaining: 0, retryAfterSecs: windowMins * 60 }
    }

    await supabase.from('rate_limit_logs').insert({ user_id: userId, endpoint })

    return { allowed: true, remaining: maxCalls - current - 1 }
  } catch (err) {
    console.warn('[rateLimit] Excepción inesperada:', err)
    return { allowed: true, remaining: maxCalls }
  }
}
