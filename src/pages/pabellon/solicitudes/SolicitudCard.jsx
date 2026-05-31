import { Eye, CalendarClock, CheckCircle, CheckCircle2, XCircle, Ban, CheckSquare, Square } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useTheme } from '../../../contexts/ThemeContext'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import { PREVISION_LABELS, PREVISION_COLORS } from '../../../utils/previsionConfig'

function getInitial(nombre) { return nombre?.charAt(0).toUpperCase() || '?' }

function getPriorityColor(solicitud) {
  if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta') return 'bg-red-500'
  if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta') return 'bg-red-500'
  return 'bg-blue-500'
}

function getPriorityBadge(solicitud) {
  if (solicitud.prioridad === 'alta' || solicitud.prioridad === 'Alta') return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
  if (solicitud.estado === 'pendiente' && solicitud.urgencia === 'alta') return { text: 'PRIORIDAD ALTA', bg: 'bg-red-500', textColor: 'text-white' }
  return { text: 'PRIORIDAD MEDIA', bg: 'bg-blue-500', textColor: 'text-white' }
}

function getProcedureName(codigo) {
  const codigoObj = codigosOperaciones.find(c => c.codigo === codigo)
  return codigoObj?.nombre || codigo
}

export default function SolicitudCard({
  solicitud,
  seleccionados,
  onToggleSeleccion,
  onVerDetalle,
  onCompletar,
  onCancelarCirugia,
  onAceptarHorarioMedico,
  onReagendar,
  onAceptarYProgramar,
  onRechazar,
  tieneHorarioPreferido,
  isAceptandoHorario,
  aceptandoId,
}) {
  const { theme } = useTheme()
  const initial = getInitial(solicitud.patients?.nombre)
  const priorityColor = getPriorityColor(solicitud)
  const priorityBadge = getPriorityBadge(solicitud)
  const procedureName = getProcedureName(solicitud.codigo_operacion)
  const tieneHP = tieneHorarioPreferido(solicitud)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl sm:rounded-[2rem] border shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between hover:shadow-xl transition-all ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700'
        : theme === 'medical' ? 'bg-white border-blue-100'
        : 'bg-white border-slate-100'
      }`}
    >
      {/* Checkbox para pendientes */}
      {solicitud.estado === 'pendiente' && (
        <button
          onClick={() => onToggleSeleccion(solicitud.id)}
          className="mr-2 flex-shrink-0 self-center"
          aria-label={seleccionados.has(solicitud.id) ? 'Deseleccionar solicitud' : 'Seleccionar solicitud'}
        >
          {seleccionados.has(solicitud.id)
            ? <CheckSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
            : <Square className="w-5 h-5 text-slate-400" aria-hidden="true" />}
        </button>
      )}

      {/* Avatar */}
      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${priorityColor} rounded-full flex items-center justify-center font-black text-base sm:text-lg text-white shadow-inner mb-3 sm:mb-0 flex-shrink-0`}>
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 mx-0 sm:mx-4 lg:mx-6 mb-3 sm:mb-0 min-w-0 w-full sm:w-auto text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-2">
          <h4 className={`text-lg sm:text-xl font-black tracking-tight truncate w-full sm:w-auto ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {solicitud.patients?.nombre} {solicitud.patients?.apellido}
          </h4>
          <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${priorityBadge.bg} ${priorityBadge.textColor} flex-shrink-0`}>
            {priorityBadge.text}
          </span>
        </div>
        <div className={`text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest break-words sm:break-normal flex flex-wrap items-center gap-x-2 gap-y-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {procedureName} • <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
            Dr. {solicitud.doctors?.apellido || solicitud.doctors?.nombre || 'N/A'}
          </span>
          {solicitud.patients?.prevision && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${PREVISION_COLORS[solicitud.patients.prevision] || 'bg-slate-100 text-slate-600'}`}>
              {PREVISION_LABELS[solicitud.patients.prevision] || solicitud.patients.prevision}
            </span>
          )}
        </div>
        {solicitud.reagendamiento_notificado_at && (
          <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 w-fit ${
            theme === 'dark' ? 'bg-amber-900/40 text-amber-200 border border-amber-700' : 'bg-amber-100 text-amber-900 border border-amber-200'
          }`}>
            <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>El doctor solicitó reagendamiento ({format(new Date(solicitud.reagendamiento_notificado_at), 'dd/MM/yyyy HH:mm')})</span>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
        {/* Ver detalles */}
        <button
          onClick={() => onVerDetalle(solicitud)}
          className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all border touch-manipulation active:scale-95 ${
            theme === 'dark' ? 'text-blue-400 hover:bg-blue-900/30 border-blue-800 hover:border-blue-600'
            : 'text-blue-600 hover:bg-blue-50 border-blue-100 hover:border-blue-300'
          }`}
          title="Ver detalles"
          aria-label="Ver detalles de la solicitud"
        >
          <Eye className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </button>

        {/* Completar / Cancelar (aceptadas con cirugía activa) */}
        {solicitud.estado === 'aceptada' && solicitud.surgeries?.[0] && solicitud.surgeries[0].estado !== 'completada' && (
          <>
            <button
              onClick={() => onCompletar(solicitud)}
              className="bg-green-600 hover:bg-green-700 text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl shadow-lg active:scale-95 transition-all touch-manipulation"
              title="Marcar cirugía como completada"
              aria-label="Marcar cirugía como completada"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => onCancelarCirugia(solicitud)}
              className="bg-slate-500 hover:bg-slate-600 text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl shadow-lg active:scale-95 transition-all touch-manipulation"
              title="Cancelar cirugía (vuelve a pendiente)"
              aria-label="Cancelar cirugía programada"
            >
              <Ban className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Reagendamiento solicitado por el doctor */}
        {solicitud.estado === 'aceptada' && solicitud.reagendamiento_notificado_at && (
          <>
            {tieneHP && (
              <button
                onClick={() => onAceptarHorarioMedico(solicitud)}
                disabled={isAceptandoHorario}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all touch-manipulation flex items-center gap-2"
              >
                {isAceptandoHorario && aceptandoId === solicitud.id ? (
                  <><LoadingSpinner size="sm" />Aceptando horario...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />ACEPTAR HORARIO MÉDICO</>
                )}
              </button>
            )}
            <button
              onClick={() => onReagendar(solicitud)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all touch-manipulation flex items-center gap-2"
            >
              <CalendarClock className="w-4 h-4" />REAGENDAR
            </button>
          </>
        )}

        {/* Gestión de cupo (pendientes) */}
        {solicitud.estado === 'pendiente' && (
          <>
            {tieneHP && (
              <button
                onClick={() => onAceptarHorarioMedico(solicitud)}
                disabled={isAceptandoHorario}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all touch-manipulation flex-1 sm:flex-initial flex items-center justify-center gap-2"
              >
                {isAceptandoHorario && aceptandoId === solicitud.id ? (
                  <><LoadingSpinner size="sm" />Aceptando horario...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" />ACEPTAR HORARIO MÉDICO</>
                )}
              </button>
            )}
            <button
              onClick={() => onAceptarYProgramar(solicitud)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-3.5 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all touch-manipulation flex-1 sm:flex-initial"
            >
              GESTIONAR CUPO
            </button>
            <button
              onClick={() => onRechazar(solicitud)}
              className="bg-red-600 hover:bg-red-700 text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl shadow-lg active:scale-95 transition-all touch-manipulation"
              title="Rechazar solicitud"
              aria-label="Rechazar solicitud"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
