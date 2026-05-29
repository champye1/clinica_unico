import { Activity, Clock, Calendar as CalendarIcon, Stethoscope, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import TimeInput from '../../../components/TimeInput'

export default function ModalConfirmarCupo({
  isOpen,
  onClose,
  selectedSlot,
  currentRequest,
  cirugiaAReagendar,
  pabellones,
  horaFin,
  setHoraFin,
  conflictoAgenda,
  setConflictoAgenda,
  setIgnorarConflicto,
  onConfirmar,
  showError,
  isPending,
}) {
  if (!selectedSlot || !currentRequest) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}
    >
      <div className="space-y-4 sm:space-y-5 md:space-y-6">
        {/* Resumen visual */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-blue-600 flex-shrink-0">
              {currentRequest.patients?.nombre?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5 sm:mb-1">Paciente</div>
              <div className="font-black text-slate-900 text-base sm:text-lg md:text-xl uppercase leading-relaxed tracking-wide truncate">
                {currentRequest.patients?.nombre} {currentRequest.patients?.apellido}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600 font-bold mt-0.5 sm:mt-1">
                RUT: {currentRequest.patients?.rut}
              </div>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-blue-200">
            <div className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 sm:gap-2">
              <Activity size={10} className="sm:w-3 sm:h-3" />
              Procedimiento
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-800 break-words">
              {(() => {
                const codigoObj = codigosOperaciones.find(c => c.codigo === currentRequest.codigo_operacion)
                return codigoObj?.nombre || currentRequest.codigo_operacion
              })()}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">
              Código: {currentRequest.codigo_operacion}
            </div>
          </div>
        </div>

        {/* Detalles del agendamiento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <Clock size={10} className="sm:w-3 sm:h-3" />
              Horario
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 break-words">
              {selectedSlot.time} - {horaFin || '--:--'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <CalendarIcon size={10} className="sm:w-3 sm:h-3" />
              Pabellón
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 break-words">
              {pabellones.find(p => p.id === selectedSlot.pabellonId)?.nombre || 'N/A'}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <CalendarIcon size={10} className="sm:w-3 sm:h-3" />
              Fecha
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 break-words">
              {format(selectedSlot.date, 'EEEE d', { locale: es })}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">
              {format(selectedSlot.date, 'MMMM yyyy', { locale: es })}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <Stethoscope size={10} className="sm:w-3 sm:h-3" />
              Cirujano
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 break-words">
              Dr. {currentRequest.doctors?.apellido || currentRequest.doctors?.nombre}
            </div>
          </div>
        </div>

        {/* Campo hora fin */}
        <div className="space-y-2">
          <label htmlFor="hora-fin" className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
            Hora Fin *
          </label>
          <TimeInput
            id="hora-fin"
            value={horaFin}
            onChange={(e) => {
              const nuevaHoraFin = e.target.value
              if (selectedSlot && nuevaHoraFin && nuevaHoraFin.match(/^\d{2}:\d{2}$/)) {
                const [horaInicioH, horaInicioM] = selectedSlot.time.split(':').map(Number)
                const [horaFinH, horaFinM] = nuevaHoraFin.split(':').map(Number)
                if ((horaFinH * 60 + horaFinM) <= (horaInicioH * 60 + horaInicioM)) {
                  showError('La hora de fin debe ser mayor que la hora de inicio')
                  return
                }
              }
              setHoraFin(nuevaHoraFin)
            }}
            min={selectedSlot ? selectedSlot.time : undefined}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 px-4 sm:px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700 text-base touch-manipulation"
            required
            aria-required="true"
            aria-label="Hora de fin de la cirugía"
          />
          {selectedSlot && horaFin && (() => {
            const [horaInicioH, horaInicioM] = selectedSlot.time.split(':').map(Number)
            const [horaFinH, horaFinM] = horaFin.split(':').map(Number)
            const minutosInicio = horaInicioH * 60 + horaInicioM
            const minutosFin = horaFinH * 60 + horaFinM
            const esValido = minutosFin > minutosInicio
            return !esValido ? (
              <p className="mt-2 text-xs sm:text-sm text-red-600 font-bold" role="alert">
                La hora de fin debe ser mayor que {selectedSlot.time}
              </p>
            ) : (
              <p className="mt-2 text-xs sm:text-sm text-green-600 font-bold">
                ✓ Duración: {Math.round((minutosFin - minutosInicio) / 60)} horas
              </p>
            )
          })()}
        </div>

        {/* Advertencia de conflicto */}
        {conflictoAgenda && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wide">
              <AlertTriangle size={14} />
              Conflicto de agenda — el médico ya tiene {conflictoAgenda.cirugias.length === 1 ? 'una cirugía' : `${conflictoAgenda.cirugias.length} cirugías`} en ese horario
            </div>
            <ul className="space-y-1">
              {conflictoAgenda.cirugias.map(c => (
                <li key={c.id} className="text-xs text-amber-800 font-medium">
                  {c.hora_inicio?.slice(0, 5)}–{c.hora_fin?.slice(0, 5)} · {c.patients?.nombre} {c.patients?.apellido} · {c.operating_rooms?.nombre}
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 font-medium">¿Deseas igualmente confirmar el agendamiento?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConflictoAgenda(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setIgnorarConflicto(true); setConflictoAgenda(null); onConfirmar() }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Sí, confirmar igual
              </button>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={() => { onClose(); setConflictoAgenda(null); setIgnorarConflicto(false) }}
            className="flex-1 w-full sm:w-auto touch-manipulation"
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            loading={isPending}
            onClick={onConfirmar}
            disabled={!horaFin || !!conflictoAgenda || isPending}
            className="flex-1 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white touch-manipulation"
          >
            {cirugiaAReagendar ? 'Confirmar Reagendamiento' : 'Confirmar Agendamiento'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
