import { useState } from 'react'
import { X, User, Stethoscope, Package, FileText, Clock, AlertCircle, Link2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { useTheme } from '../../../contexts/ThemeContext'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import { exportSolicitudPDF, maskRut } from '../../../utils/exportData'
import { PREVISION_LABELS, PREVISION_COLORS } from '../../../utils/previsionConfig'

function getEstadoBadge(estado) {
  const estados = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    aceptada: 'bg-green-100 text-green-800',
    rechazada: 'bg-red-100 text-red-800',
    cancelada: 'bg-gray-100 text-gray-800',
  }
  return estados[estado] || estados.pendiente
}

export default function ModalDetalle({ solicitud, onClose, generarEnlacePaciente, generandoEnlace, enlaceCopiadoId, scrollYRef }) {
  const [exportandoPDF, setExportandoPDF] = useState(false)

  const handleExportPDF = async () => {
    setExportandoPDF(true)
    try {
      await exportSolicitudPDF(solicitud)
    } finally {
      setExportandoPDF(false)
    }
  }
  const { theme } = useTheme()
  if (!solicitud) return null

  const handleClose = () => {
    onClose()
    setTimeout(() => window.scrollTo({ top: scrollYRef.current, behavior: 'instant' }), 0)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalles de la Solicitud"
        onClick={e => e.stopPropagation()}
        className={`rounded-[2rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar ${
          theme === 'dark' ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Detalles de la Solicitud
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
            aria-label="Cerrar detalles"
          >
            <X className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Paciente */}
          <div className={`rounded-2xl p-6 border ${
            theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : theme === 'medical' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <User className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Información del Paciente
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Nombre Completo</p>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                  {solicitud.patients?.nombre} {solicitud.patients?.apellido}
                </p>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>RUT</p>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{maskRut(solicitud.patients?.rut)}</p>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Previsión de Salud</p>
                {solicitud.patients?.prevision ? (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${PREVISION_COLORS[solicitud.patients.prevision] || PREVISION_COLORS.otro}`}>
                    {PREVISION_LABELS[solicitud.patients.prevision] || solicitud.patients.prevision}
                  </span>
                ) : (
                  <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>No especificada</p>
                )}
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Información del Doctor</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</p>
                <p className="text-sm font-bold text-slate-700">{solicitud.doctors?.nombre} {solicitud.doctors?.apellido}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Especialidad</p>
                <p className="text-sm font-bold text-slate-700 capitalize">{solicitud.doctors?.especialidad?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  solicitud.doctors?.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {solicitud.doctors?.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Operación */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Información de la Operación</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Código de Operación</p>
                <p className="text-sm font-bold text-slate-700">{solicitud.codigo_operacion}</p>
                {(() => {
                  const op = codigosOperaciones.find(o => o.codigo === solicitud.codigo_operacion)
                  return op ? (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-600">{op.nombre}</p>
                      {op.descripcion && <p className="text-xs text-slate-500 mt-1">{op.descripcion}</p>}
                    </div>
                  ) : null
                })()}
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                  {solicitud.fecha_preferida ? 'Horario solicitado (slot vacío)' : 'Hora Recomendada'}
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {solicitud.fecha_preferida ? (
                    <>
                      {format(new Date(solicitud.fecha_preferida), 'dd/MM/yyyy')}
                      {solicitud.hora_recomendada && (
                        <> · {String(solicitud.hora_recomendada).slice(0, 5)}
                          {solicitud.hora_fin_recomendada && `–${String(solicitud.hora_fin_recomendada).slice(0, 5)}`}
                        </>
                      )}
                    </>
                  ) : (
                    solicitud.hora_recomendada ? String(solicitud.hora_recomendada).slice(0, 5) : 'No especificada'
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(solicitud.estado)}`}>
                  {solicitud.estado}
                </span>
              </div>
              {solicitud.observaciones && (
                <div className="col-span-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Observaciones</p>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200">{solicitud.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insumos */}
          {solicitud.surgery_request_supplies?.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Insumos Requeridos</h3>
              </div>
              <div className="space-y-2">
                {solicitud.surgery_request_supplies.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{item.supplies?.nombre}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">Código: {item.supplies?.codigo}</span>
                        {item.supplies?.grupo_prestacion && (
                          <span className="text-xs text-blue-600 font-bold">{item.supplies.grupo_prestacion}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                        Cantidad: {item.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className={`rounded-2xl p-6 border ${solicitud.estado === 'rechazada' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${solicitud.estado === 'rechazada' ? 'bg-red-100' : 'bg-slate-200'}`}>
                <Clock className={`w-5 h-5 ${solicitud.estado === 'rechazada' ? 'text-red-600' : 'text-slate-600'}`} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Historial de Estado</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Solicitud creada</p>
                  <p className="text-sm font-bold text-slate-700">{format(new Date(solicitud.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              {solicitud.updated_at && solicitud.updated_at !== solicitud.created_at && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    solicitud.estado === 'rechazada' ? 'bg-red-400' : solicitud.estado === 'aceptada' ? 'bg-green-400' : 'bg-slate-400'
                  }`} />
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Última actualización</p>
                    <p className="text-sm font-bold text-slate-700">{format(new Date(solicitud.updated_at), 'dd/MM/yyyy HH:mm')}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getEstadoBadge(solicitud.estado)}`}>
                      {solicitud.estado}
                    </span>
                  </div>
                </div>
              )}
              {solicitud.motivo_rechazo && (
                <div className="mt-2 bg-red-100 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-1">Motivo de rechazo</p>
                    <p className="text-sm text-red-800 font-medium">{solicitud.motivo_rechazo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => generarEnlacePaciente(solicitud.id)}
              disabled={generandoEnlace}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" />
              {enlaceCopiadoId === solicitud.id ? '¡Enlace copiado!' : 'Compartir con paciente'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exportandoPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exportandoPDF ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
          <button onClick={handleClose} className="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
