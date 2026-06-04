import { useState } from 'react'
import { supabase } from '../../config/supabase'
import { Receipt, X, CheckCircle2, AlertTriangle, FileText, Download, ExternalLink } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { sanitizeString } from '../../utils/sanitizeInput'
import { formatRut, validateRut } from '../../utils/rutFormatter'

/**
 * Modal para emitir una boleta o factura electrónica desde una cirugía.
 * Props:
 *   surgery      — objeto cirugía con patient, doctor, codigo_operacion
 *   onClose      — fn al cerrar
 */
export default function ModalEmitirDTE({ surgery, onClose }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [tipo, setTipo]                   = useState('boleta')
  const [monto, setMonto]                 = useState('')
  const [descripcion, setDescripcion]     = useState(surgery?.codigo_operacion || surgery?.surgery_request?.codigo_operacion || '')
  const [receptorNombre, setReceptorNombre] = useState(
    surgery?.patient
      ? `${surgery.patient.nombre} ${surgery.patient.apellido}`
      : ''
  )
  const [receptorRut, setReceptorRut]     = useState(surgery?.patient?.rut || '')
  const [receptorGiro, setReceptorGiro]   = useState('')
  const [receptorDir, setReceptorDir]     = useState('')
  const [receptorComuna, setReceptorComuna] = useState('')
  const [sandbox, setSandbox]             = useState(true)

  const [emitiendo, setEmitiendo]         = useState(false)
  const [resultado, setResultado]         = useState(null) // { ok, folio, pdf_url, error }
  const [errorForm, setErrorForm]         = useState(null)

  const inputClass = `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900'
  }`
  const labelClass = `block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`

  const handleEmitir = async () => {
    setErrorForm(null)

    const montoNum = parseInt(monto.replace(/\D/g, ''), 10)
    if (!descripcion.trim())      return setErrorForm('Ingresa una descripción del servicio.')
    if (!montoNum || montoNum < 1) return setErrorForm('Ingresa un monto válido.')
    if (!receptorNombre.trim())   return setErrorForm('Ingresa el nombre del receptor.')
    if (tipo === 'factura') {
      if (!receptorRut.trim())    return setErrorForm('Para facturas se requiere el RUT del receptor.')
      if (!validateRut(receptorRut)) return setErrorForm('El RUT del receptor no es válido.')
    }

    setEmitiendo(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('emit-dte', {
        body: {
          surgery_id:          surgery?.id          || null,
          surgery_request_id:  surgery?.surgery_request_id || null,
          tipo,
          descripcion:         descripcion.trim(),
          monto_total:         montoNum,
          receptor_nombre:     receptorNombre.trim(),
          receptor_rut:        receptorRut.trim()   || undefined,
          receptor_giro:       receptorGiro.trim()  || undefined,
          receptor_dir:        receptorDir.trim()   || undefined,
          receptor_comuna:     receptorComuna.trim() || undefined,
          sandbox,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (error || data?.error) throw new Error(data?.error || error?.message)

      setResultado({ ok: true, folio: data.folio, pdf_url: data.pdf_url })
    } catch (e) {
      setResultado({ ok: false, error: e.message })
    } finally {
      setEmitiendo(false)
    }
  }

  const formatMonto = (val) => {
    const digits = val.replace(/\D/g, '')
    return digits ? Number(digits).toLocaleString('es-CL') : ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
              <Receipt size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
            </div>
            <div>
              <h2 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Emitir DTE</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Boleta o Factura Electrónica</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={18} />
          </button>
        </div>

        {/* Resultado final */}
        {resultado ? (
          <div className="p-6 space-y-4">
            {resultado.ok ? (
              <>
                <div className={`flex items-center gap-3 p-4 rounded-xl ${isDark ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className={`font-black text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      {tipo === 'boleta' ? 'Boleta' : 'Factura'} emitida correctamente
                    </p>
                    {resultado.folio && (
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        Folio N° {resultado.folio}
                      </p>
                    )}
                    {sandbox && (
                      <p className={`text-xs mt-0.5 font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        ⚠️ Documento de prueba (sandbox) — no válido ante el SII
                      </p>
                    )}
                  </div>
                </div>

                {resultado.pdf_url && (
                  <a
                    href={resultado.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    <Download size={15} />
                    Descargar PDF
                    <ExternalLink size={13} />
                  </a>
                )}
              </>
            ) : (
              <div className={`flex items-start gap-3 p-4 rounded-xl ${isDark ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className={`font-black text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>Error al emitir</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{resultado.error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!resultado.ok && (
                <button
                  onClick={() => setResultado(null)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  Reintentar
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-600 hover:bg-slate-700 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario */
          <div className="p-6 space-y-4">

            {/* Tipo DTE */}
            <div>
              <label className={labelClass}>Tipo de documento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'boleta',  label: 'Boleta',  desc: 'Consumidor final, sin RUT' },
                  { value: 'factura', label: 'Factura', desc: 'Empresa, requiere RUT' },
                ].map(op => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setTipo(op.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      tipo === op.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : (isDark ? 'border-slate-600 bg-slate-700/40' : 'border-slate-200 bg-white')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className={tipo === op.value ? 'text-emerald-600' : (isDark ? 'text-slate-400' : 'text-slate-500')} />
                      <span className={`font-black text-xs ${tipo === op.value ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : (isDark ? 'text-white' : 'text-slate-800')}`}>{op.label}</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{op.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción + Monto */}
            <div>
              <label className={labelClass}>Descripción del servicio <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={descripcion}
                onChange={e => setDescripcion(sanitizeString(e.target.value))}
                placeholder="Ej: Colecistectomía laparoscópica"
                maxLength={150}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Monto total (CLP, con IVA) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>$</span>
                <input
                  type="text"
                  value={monto}
                  onChange={e => setMonto(formatMonto(e.target.value))}
                  placeholder="150.000"
                  className={`${inputClass} pl-7`}
                />
              </div>
              {tipo === 'factura' && monto && (
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Neto: ${Math.round(parseInt(monto.replace(/\D/g,''),10)/1.19).toLocaleString('es-CL')} + IVA 19%
                </p>
              )}
            </div>

            {/* Receptor */}
            <div>
              <label className={labelClass}>Nombre receptor <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={receptorNombre}
                onChange={e => setReceptorNombre(sanitizeString(e.target.value))}
                placeholder="Juan Pérez"
                maxLength={100}
                className={inputClass}
              />
            </div>

            {tipo === 'factura' && (
              <>
                <div>
                  <label className={labelClass}>RUT receptor <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={receptorRut}
                    onChange={e => setReceptorRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    maxLength={12}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Giro</label>
                    <input type="text" value={receptorGiro} onChange={e => setReceptorGiro(sanitizeString(e.target.value))} placeholder="Servicios" maxLength={80} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Comuna</label>
                    <input type="text" value={receptorComuna} onChange={e => setReceptorComuna(sanitizeString(e.target.value))} placeholder="Santiago" maxLength={50} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <input type="text" value={receptorDir} onChange={e => setReceptorDir(sanitizeString(e.target.value))} placeholder="Av. Principal 123" maxLength={80} className={inputClass} />
                </div>
              </>
            )}

            {/* Sandbox */}
            <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${isDark ? 'bg-slate-700/50' : 'bg-amber-50 border border-amber-100'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-amber-700'}`}>
                Modo sandbox (prueba)
              </p>
              <button
                type="button"
                onClick={() => setSandbox(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${sandbox ? 'bg-amber-400' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sandbox ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {errorForm && (
              <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl ${isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <AlertTriangle size={13} />
                {errorForm}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleEmitir}
                disabled={emitiendo}
                className="flex-1 py-2.5 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white transition-colors flex items-center justify-center gap-2"
              >
                {emitiendo
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Emitiendo...</>
                  : <><Receipt size={14} />Emitir {tipo === 'boleta' ? 'Boleta' : 'Factura'}</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
