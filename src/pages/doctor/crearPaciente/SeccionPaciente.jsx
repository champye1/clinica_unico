import { AlertCircle, History, ChevronDown, ChevronUp, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatRut, validateRut, isValidRutFormat } from '../../../utils/rutFormatter'
import { sanitizeString, sanitizeRut } from '../../../utils/sanitizeInput'

export default function SeccionPaciente({
  formData,
  setFormData,
  rutError,
  setRutError,
  pacienteEncontrado,
  setPacienteEncontrado,
  buscandoPaciente,
  historialPaciente,
  setHistorialPaciente,
  solicitudDuplicadaAlert,
  setSolicitudDuplicadaAlert,
  showHistorial,
  setShowHistorial,
  onBuscarPaciente,
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5" />
        Datos del Paciente
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-field">Nombre *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: sanitizeString(e.target.value) })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label-field">Apellido *</label>
          <input
            type="text"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: sanitizeString(e.target.value) })}
            className="input-field"
            required
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="label-field">Teléfono WhatsApp del paciente</label>
        <input
          type="tel"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/[^+\d\s]/g, '') })}
          className="input-field"
          placeholder="+56912345678"
        />
        <p className="text-xs text-slate-400 mt-1">Para notificar al paciente cuando se confirme su hora</p>
      </div>
      <div className="mt-4">
        <label className="label-field">RUT *</label>
        <input
          type="text"
          value={formData.rut}
          onChange={(e) => {
            const sanitized = sanitizeRut(e.target.value)
            const formatted = formatRut(sanitized)
            setFormData({ ...formData, rut: formatted })
            if (rutError) setRutError('')
            if (pacienteEncontrado) {
              setPacienteEncontrado(null)
              setHistorialPaciente([])
              setSolicitudDuplicadaAlert(false)
              setShowHistorial(false)
            }
          }}
          onBlur={() => {
            if (formData.rut && isValidRutFormat(formData.rut)) {
              if (!validateRut(formData.rut)) {
                setRutError('El dígito verificador del RUT no es válido')
              } else {
                setRutError('')
                onBuscarPaciente(formData.rut)
              }
            } else if (formData.rut) {
              setRutError('El formato del RUT no es válido')
            }
          }}
          className={`input-field ${rutError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          placeholder="12.345.678-9"
          required
          maxLength={12}
        />
        {rutError && <p className="mt-1 text-sm text-red-600">{rutError}</p>}
        {buscandoPaciente && <p className="mt-1 text-xs text-slate-400">Buscando paciente...</p>}
        {pacienteEncontrado && !buscandoPaciente && (
          <div className="mt-2 space-y-2">
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <UserPlus className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-800">Paciente encontrado — datos completados</p>
                <p className="text-xs text-blue-700">{pacienteEncontrado.nombre} {pacienteEncontrado.apellido}</p>
              </div>
              {historialPaciente.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistorial(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 shrink-0"
                >
                  <History className="w-3 h-3" />
                  {historialPaciente.length} solicitud{historialPaciente.length !== 1 ? 'es' : ''}
                  {showHistorial ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            {solicitudDuplicadaAlert && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Posible duplicado</p>
                  <p className="text-xs text-amber-700">Este paciente tiene solicitudes pendientes. Verifique antes de crear una nueva.</p>
                </div>
              </div>
            )}

            {showHistorial && historialPaciente.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Historial de Solicitudes</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {historialPaciente.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{s.codigo_operacion || '—'}</p>
                        <p className="text-[10px] text-slate-400">{format(new Date(s.created_at), 'dd/MM/yyyy', { locale: es })}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        s.estado === 'aceptada' || s.estado === 'programada' ? 'bg-green-100 text-green-700' :
                        s.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {s.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
