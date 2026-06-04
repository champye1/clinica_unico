import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// EDGE FUNCTION: emit-dte
// Emite boletas y facturas electrónicas chilenas via
// OpenFactura (Haulmer). Guarda el resultado en la
// tabla `facturas`.
//
// POST body: {
//   surgery_id?:          string
//   surgery_request_id?:  string
//   tipo:                 'boleta' | 'factura'
//   descripcion:          string
//   monto_total:          number
//   receptor_nombre:      string
//   receptor_rut?:        string   (requerido para factura)
//   receptor_giro?:       string
//   receptor_dir?:        string
//   receptor_comuna?:     string
//   sandbox?:             boolean  (default true)
// }
// =====================================================

const OPENFACTURA_SANDBOX = 'https://dev-api.haulmer.com/v2/dte/document'
const OPENFACTURA_PROD    = 'https://api.haulmer.com/v2/dte/document'

// Tipo DTE chileno: 39=Boleta, 33=Factura
const TIPO_DTE = { boleta: 39, factura: 33 }

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = Deno.env.get('ALLOWED_ORIGINS')?.split(',').map(s => s.trim()) ?? []
  const allowOrigin = (allowed.length > 0 && origin && allowed.includes(origin)) ? origin : '*'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function calcularIVA(montoTotal: number): { mntNeto: number; iva: number; mntTotal: number } {
  // IVA Chile = 19%. montoTotal viene con IVA incluido.
  const mntNeto = Math.round(montoTotal / 1.19)
  const iva     = montoTotal - mntNeto
  return { mntNeto, iva, mntTotal: montoTotal }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const CORS   = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) return json({ error: 'Variables de entorno no configuradas' }, 500, CORS)

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Autenticación — solo usuarios pabellón
    const token = req.headers.get('Authorization')?.replace('Bearer ', '').trim() ?? ''
    if (!token) return json({ error: 'No autorizado.' }, 401, CORS)
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return json({ error: 'No autorizado.' }, 401, CORS)
    const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    if (userRow?.role !== 'pabellon') return json({ error: 'Acceso denegado.' }, 403, CORS)

    // Leer credenciales facturación
    let cfg: Record<string, string> = {}
    try {
      const { data: secretRow } = await supabase.rpc('read_clinic_secret', { p_key: 'facturacion_config' })
      if (secretRow) cfg = JSON.parse(secretRow)
    } catch {
      const { data: settingsRow } = await supabase
        .from('clinic_settings').select('value').eq('key', 'facturacion_config').maybeSingle()
      cfg = (settingsRow?.value as Record<string, string>) || {}
    }

    const apiKey      = cfg.api_key        || ''
    const rutEmisor   = cfg.rut_emisor     || ''
    const razonSocial = cfg.razon_social   || ''
    const giroEmisor  = cfg.giro           || 'Servicios Médicos'
    const dirOrigen   = cfg.direccion      || ''
    const cmnaOrigen  = cfg.comuna         || ''

    if (!apiKey || !rutEmisor || !razonSocial) {
      return json({ error: 'Facturación no configurada. Ve a Configuración → Facturación Electrónica.' }, 503, CORS)
    }

    // Validar body
    let body: Record<string, unknown>
    try { body = await req.json() }
    catch { return json({ error: 'Body JSON inválido.' }, 400, CORS) }

    const {
      surgery_id,
      surgery_request_id,
      tipo = 'boleta',
      descripcion,
      monto_total,
      receptor_nombre,
      receptor_rut,
      receptor_giro,
      receptor_dir,
      receptor_comuna,
      sandbox = true,
    } = body as Record<string, unknown>

    if (!descripcion || !monto_total || !receptor_nombre) {
      return json({ error: 'Faltan campos: descripcion, monto_total, receptor_nombre' }, 400, CORS)
    }
    if (tipo === 'factura' && !receptor_rut) {
      return json({ error: 'Para facturas se requiere receptor_rut.' }, 400, CORS)
    }

    const tipoDTE    = TIPO_DTE[tipo as 'boleta' | 'factura'] ?? 39
    const esFactura  = tipoDTE === 33
    const montoTotal = Number(monto_total)
    const fechaHoy   = new Date().toISOString().split('T')[0]
    const { mntNeto, iva } = calcularIVA(montoTotal)

    // Construir payload OpenFactura
    const payload: Record<string, unknown> = {
      Encabezado: {
        IdDoc: {
          TipoDTE: tipoDTE,
          FchEmis: fechaHoy,
        },
        Emisor: {
          RUTEmisor: rutEmisor,
          RznSoc:    razonSocial,
          GiroEmis:  giroEmisor,
          DirOrigen: dirOrigen,
          CmnaOrigen: cmnaOrigen,
        },
        Receptor: {
          RUTRecep:    receptor_rut    || '66666666-6',
          RznSocRecep: receptor_nombre,
          ...(esFactura && receptor_giro   ? { GiroRecep:  receptor_giro  } : {}),
          ...(esFactura && receptor_dir    ? { DirRecep:   receptor_dir   } : {}),
          ...(esFactura && receptor_comuna ? { CmnaRecep:  receptor_comuna } : {}),
        },
        Totales: esFactura
          ? { MntNeto: mntNeto, TasaIVA: 19, IVA: iva, MntTotal: montoTotal }
          : { MntTotal: montoTotal },
      },
      Detalle: [
        {
          NmbItem:   String(descripcion),
          CantItem:  1,
          PrcItem:   esFactura ? mntNeto : montoTotal,
          MontoItem: esFactura ? mntNeto : montoTotal,
        },
      ],
    }

    const apiUrl      = sandbox ? OPENFACTURA_SANDBOX : OPENFACTURA_PROD
    const idempotency = crypto.randomUUID()

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'apikey':          apiKey,
        'Idempotency-Key': idempotency,
        'Content-Type':    'application/json',
      },
      body: JSON.stringify(payload),
    })

    const apiData = await apiRes.json().catch(() => ({}))

    if (!apiRes.ok) {
      // Guardar registro con error
      await supabase.from('facturas').insert({
        surgery_id:        surgery_id        || null,
        surgery_request_id: surgery_request_id || null,
        tipo,
        estado:            'error',
        receptor_rut:      String(receptor_rut    || ''),
        receptor_nombre:   String(receptor_nombre),
        receptor_giro:     String(receptor_giro   || ''),
        receptor_dir:      String(receptor_dir    || ''),
        receptor_comuna:   String(receptor_comuna || ''),
        descripcion:       String(descripcion),
        monto_neto:        esFactura ? mntNeto  : null,
        iva:               esFactura ? iva      : null,
        monto_total:       montoTotal,
        error_detalle:     JSON.stringify(apiData),
        sandbox:           Boolean(sandbox),
        emitido_por:       user.id,
      })
      return json({ error: 'Error al emitir DTE', details: apiData }, apiRes.status, CORS)
    }

    // Guardar registro exitoso
    const folio  = apiData?.data?.FolioDoc  ?? apiData?.folio  ?? null
    const pdfUrl = apiData?.data?.URLDTEPDF ?? apiData?.pdf    ?? null
    const xmlUrl = apiData?.data?.URLDTEXML ?? apiData?.xml    ?? null
    const extId  = apiData?.data?.id        ?? apiData?.id     ?? null

    const { data: facturaRow, error: insertErr } = await supabase
      .from('facturas')
      .insert({
        surgery_id:         surgery_id         || null,
        surgery_request_id: surgery_request_id || null,
        tipo,
        estado:             'emitido',
        receptor_rut:       String(receptor_rut    || ''),
        receptor_nombre:    String(receptor_nombre),
        receptor_giro:      String(receptor_giro   || ''),
        receptor_dir:       String(receptor_dir    || ''),
        receptor_comuna:    String(receptor_comuna || ''),
        descripcion:        String(descripcion),
        monto_neto:         esFactura ? mntNeto  : null,
        iva:                esFactura ? iva      : null,
        monto_total:        montoTotal,
        folio,
        pdf_url:            pdfUrl,
        xml_url:            xmlUrl,
        openfactura_id:     extId ? String(extId) : null,
        sandbox:            Boolean(sandbox),
        emitido_por:        user.id,
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    return json({
      success: true,
      factura: facturaRow,
      folio,
      pdf_url: pdfUrl,
    }, 200, CORS)

  } catch (error) {
    console.error('Error en emit-dte:', error)
    return json({ error: error instanceof Error ? error.message : 'Error desconocido' }, 500, CORS)
  }
})
