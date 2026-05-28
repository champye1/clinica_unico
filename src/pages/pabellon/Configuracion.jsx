import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../config/supabase'
import { MessageSquare, Save, CheckCircle2, AlertTriangle, Phone, Wifi, WifiOff } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { sanitizeString } from '../../utils/sanitizeInput'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const WHATSAPP_KEY = 'whatsapp_config'

export default function Configuracion() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotifications()

  const [form, setForm] = useState({
    numero: '',
    token: '',
    instancia: '',
    activo: false,
  })
  const [cargadoInicial, setCargadoInicial] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | 'error'

  const { isLoading } = useQuery({
    queryKey: ['clinic-settings-whatsapp'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clinic_settings')
        .select('value')
        .eq('key', WHATSAPP_KEY)
        .single()
      return data?.value || {}
    },
    onSuccess: (value) => {
      if (!cargadoInicial) {
        setForm({
          numero: value.numero || '',
          token: value.token || '',
          instancia: value.instancia || '',
          activo: value.activo || false,
        })
        setCargadoInicial(true)
      }
    },
  })

  const guardar = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          key: WHATSAPP_KEY,
          value: {
            numero: sanitizeString(form.numero),
            token: sanitizeString(form.token),
            instancia: sanitizeString(form.instancia),
            activo: form.activo,
          },
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clinic-settings-whatsapp'])
      showSuccess('Configuración de WhatsApp guardada.')
    },
    onError: (e) => showError('Error al guardar: ' + (e.message || e)),
  })

  const probarConexion = useMutation({
    mutationFn: async () => {
      if (!form.instancia || !form.token) {
        throw new Error('Complete el ID de instancia y el token para probar la conexión')
      }
      const baseUrl = /^https?:\/\//.test(form.instancia)
        ? form.instancia.replace(/\/$/, '')
        : `https://${form.instancia.replace(/\/$/, '')}`
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      try {
        const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: { apikey: form.token, 'Content-Type': 'application/json' },
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`)
        return true
      } catch (err) {
        clearTimeout(timeout)
        if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado (6 s)')
        throw err
      }
    },
    onSuccess: () => {
      setTestResult('ok')
      showSuccess('Conexión con WhatsApp API exitosa')
    },
    onError: (e) => {
      setTestResult('error')
      showError('No se pudo conectar: ' + (e.message || e))
    },
  })

  const fieldClass = `w-full px-4 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
  }`
  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className={`text-2xl lg:text-3xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Configuración
        </h2>
        <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
          Integraciones y ajustes del sistema
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Header de sección */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageSquare size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className={`font-black text-sm uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              WhatsApp Business
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Notificaciones automáticas a pacientes y médicos
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activo ? 'bg-green-500' : (isDark ? 'bg-slate-600' : 'bg-slate-200')}`}
              role="switch"
              aria-checked={form.activo}
              aria-label="Activar WhatsApp"
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className={`flex items-start gap-3 rounded-xl p-4 border ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            Se requiere una cuenta de <strong>WhatsApp Business API</strong> (Twilio, Meta Cloud API u otro proveedor). Ingresa las credenciales proporcionadas por tu proveedor.
          </p>
        </div>

        {/* Campos */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className={`h-10 rounded-xl animate-pulse ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />)}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                <Phone size={9} className="inline mr-1" /> Número de envío
              </label>
              <input
                type="tel"
                placeholder="+56912345678"
                value={form.numero}
                onChange={e => { setForm(f => ({ ...f, numero: e.target.value })); setTestResult(null) }}
                className={fieldClass}
              />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Número en formato internacional con código de país</p>
            </div>

            <div>
              <label className={labelClass}>ID de instancia / SID</label>
              <input
                type="text"
                placeholder="instance_id o account_sid"
                value={form.instancia}
                onChange={e => { setForm(f => ({ ...f, instancia: e.target.value })); setTestResult(null) }}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Token de acceso</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={form.token}
                onChange={e => { setForm(f => ({ ...f, token: e.target.value })); setTestResult(null) }}
                className={fieldClass}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        {/* Resultado del test */}
        {testResult && (
          <div className={`flex items-center gap-2 text-xs font-bold rounded-xl px-4 py-3 ${
            testResult === 'ok'
              ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200')
              : (isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200')
          }`}>
            {testResult === 'ok' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {testResult === 'ok' ? 'Conexión exitosa con WhatsApp API' : 'No se pudo conectar — verifique las credenciales'}
          </div>
        )}

        {/* Estado actual */}
        <div className={`flex items-center gap-2 text-xs font-bold rounded-xl px-4 py-3 ${
          form.activo
            ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700')
            : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-50 text-slate-500')
        }`}>
          <CheckCircle2 size={14} />
          {form.activo ? 'Integración activa — se enviarán notificaciones por WhatsApp' : 'Integración desactivada'}
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => probarConexion.mutate()}
            loading={probarConexion.isPending}
            className="flex-1"
          >
            <Wifi size={14} className="mr-2" />
            Probar conexión
          </Button>
          <Button
            onClick={() => guardar.mutate()}
            loading={guardar.isPending}
            className="flex-1"
          >
            <Save size={15} className="mr-2" />
            Guardar
          </Button>
        </div>
      </Card>
    </div>
  )
}
