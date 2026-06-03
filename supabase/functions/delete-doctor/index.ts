import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_shared/rateLimit.ts'

const getAllowedOrigin = () => {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || []
  if (allowedOrigins.length === 0) {
    return '*'
  }
  return allowedOrigins
}

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigin()
  const originHeader = (origin && Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado. Token de autenticación requerido.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      )
    }

    let supabaseUrl = Deno.env.get('SUPABASE_URL') ||
                      Deno.env.get('SUPABASE_PROJECT_URL') ||
                      Deno.env.get('SUPABASE_PROJECT_REF') || ''

    let supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl) {
      const projectRef = Deno.env.get('SUPABASE_PROJECT_REF')
      if (projectRef) supabaseUrl = `https://${projectRef}.supabase.co`
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes:', {
        supabaseUrl: supabaseUrl ? '✓' : '✗',
        supabaseServiceKey: supabaseServiceKey ? '✓' : '✗',
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Variables de entorno no configuradas.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticación inválido o expirado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single()
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado en el sistema.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 },
      )
    }
    if (userData.role !== 'pabellon') {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado. Solo usuarios de Pabellón pueden eliminar médicos.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 },
      )
    }

    const { allowed, retryAfterSecs } = await checkRateLimit(supabaseAdmin, user.id, 'delete-doctor', 5, 60)
    if (!allowed) {
      return new Response(
        JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intente nuevamente en una hora.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSecs ?? 3600) }, status: 429 },
      )
    }

    const { doctorId } = await req.json()

    if (!doctorId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Debes proporcionar el ID del médico a eliminar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      )
    }

    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id, user_id, rut, email, nombre, apellido')
      .eq('id', doctorId)
      .single()

    if (doctorError || !doctorData) {
      return new Response(
        JSON.stringify({ success: false, error: `No se encontró el médico con ID: ${doctorId}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 },
      )
    }

    const userId = doctorData.user_id
    const doctorEmail = doctorData.email
    const doctorRut = doctorData.rut
    const doctorNombre = `${doctorData.nombre} ${doctorData.apellido}`

    // PASO 1: Eliminar datos relacionados en orden correcto

    // 1.1: Obtener IDs de solicitudes quirúrgicas del doctor
    const { data: surgeryRequests, error: errSRFetch } = await supabaseAdmin
      .from('surgery_requests').select('id').eq('doctor_id', doctorId)
    if (errSRFetch) throw new Error(`Error al obtener solicitudes del médico: ${errSRFetch.message}`)

    const surgeryRequestIds = surgeryRequests?.map(sr => sr.id) || []

    // 1.2: Eliminar insumos y cirugías asociadas a las solicitudes
    if (surgeryRequestIds.length > 0) {
      const { data: surgeries, error: errSurgFetch } = await supabaseAdmin
        .from('surgeries').select('id').in('surgery_request_id', surgeryRequestIds)
      if (errSurgFetch) throw new Error(`Error al obtener cirugías: ${errSurgFetch.message}`)

      const surgeryIds = surgeries?.map(s => s.id) || []

      if (surgeryIds.length > 0) {
        const { error: errSS } = await supabaseAdmin
          .from('surgery_supplies').delete().in('surgery_id', surgeryIds)
        if (errSS) throw new Error(`Error al eliminar insumos de cirugía: ${errSS.message}`)
      }

      const { error: errSurgDel } = await supabaseAdmin
        .from('surgeries').delete().in('surgery_request_id', surgeryRequestIds)
      if (errSurgDel) throw new Error(`Error al eliminar cirugías: ${errSurgDel.message}`)

      const { error: errSRS } = await supabaseAdmin
        .from('surgery_request_supplies').delete().in('surgery_request_id', surgeryRequestIds)
      if (errSRS) throw new Error(`Error al eliminar insumos de solicitud: ${errSRS.message}`)
    }

    // 1.3: Eliminar solicitudes quirúrgicas
    const { error: errSRDel } = await supabaseAdmin
      .from('surgery_requests').delete().eq('doctor_id', doctorId)
    if (errSRDel) throw new Error(`Error al eliminar solicitudes: ${errSRDel.message}`)

    // 1.4: Eliminar pacientes del doctor
    const { error: errPat } = await supabaseAdmin
      .from('patients').delete().eq('doctor_id', doctorId)
    if (errPat) throw new Error(`Error al eliminar pacientes: ${errPat.message}`)

    // 1.5: Eliminar bloqueos de horario del doctor
    const { error: errBlk } = await supabaseAdmin
      .from('schedule_blocks').delete().eq('doctor_id', doctorId)
    if (errBlk) throw new Error(`Error al eliminar bloqueos de horario: ${errBlk.message}`)

    // 1.6: Eliminar recordatorios y notificaciones del usuario
    const { error: errRem } = await supabaseAdmin
      .from('reminders').delete().eq('user_id', userId)
    if (errRem) throw new Error(`Error al eliminar recordatorios: ${errRem.message}`)

    const { error: errNot } = await supabaseAdmin
      .from('notifications').delete().eq('user_id', userId)
    if (errNot) throw new Error(`Error al eliminar notificaciones: ${errNot.message}`)

    // PASO 2: Eliminar el registro del doctor
    const { error: deleteDoctorError } = await supabaseAdmin
      .from('doctors').delete().eq('id', doctorId)
    if (deleteDoctorError) throw new Error(`Error al eliminar médico: ${deleteDoctorError.message}`)

    // PASO 3: Eliminar usuario de auth.users (CASCADE elimina de users)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('Error al eliminar usuario de Auth:', deleteUserError)
      return new Response(
        JSON.stringify({
          success: true,
          warning: `Médico eliminado pero hubo un problema al eliminar el usuario de autenticación: ${deleteUserError.message}`,
          deleted: { doctor: doctorNombre, rut: doctorRut, email: doctorEmail }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Médico y todos sus datos eliminados completamente',
        deleted: { doctor: doctorNombre, rut: doctorRut, email: doctorEmail, userId }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Error en delete-doctor:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Error desconocido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
