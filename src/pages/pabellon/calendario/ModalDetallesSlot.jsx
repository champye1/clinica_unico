import { Clock, Calendar as CalendarIcon, Info, CheckCircle2, XCircle, Activity, Stethoscope } from 'lucide-react'
import { format, isPast, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import Modal from '../../../components/common/Modal'

export default function ModalDetallesSlot({
  isOpen,
  onClose,
  slotDetalle,
  historialCirugia,
  editandoObservaciones,
  setEditandoObservaciones,
  observacionesEditadas,
  setObservacionesEditadas,
  editarObservaciones,
  marcarEnProceso,
  completarCirugia,
  onCancelarCirugia,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slotDetalle?.type === 'occupied' ? 'Detalles de Cirugía' : 'Detalles del Horario'}
    >
      {slotDetalle && (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {slotDetalle.type === 'occupied' && slotDetalle.data ? (
            <>
              {/* Paciente */}
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl md:text-2xl shadow-lg bg-red-600 flex-shrink-0">
                  {slotDetalle.data.patients?.nombre?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Paciente</div>
                  <div className="font-black text-slate-800 text-sm sm:text-base md:text-lg uppercase leading-none break-words">
                    {slotDetalle.data.patients?.nombre || 'N/A'} {slotDetalle.data.patients?.apellido || ''}
                  </div>
                  {slotDetalle.data.patients?.rut && (
                    <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">
                      RUT: {slotDetalle.data.patients.rut}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor */}
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-blue-600 flex-shrink-0">
                  <Stethoscope size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Cirujano</div>
                  <div className="font-black text-slate-800 text-sm sm:text-base md:text-lg uppercase leading-none break-words">
                    Dr. {slotDetalle.data.doctors?.apellido || slotDetalle.data.doctors?.nombre || 'General'}
                  </div>
                  {slotDetalle.data.doctors?.especialidad && (
                    <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">
                      {slotDetalle.data.doctors.especialidad}
                    </div>
                  )}
                </div>
              </div>

              {/* Procedimiento */}
              {(() => {
                const codigoOperacion = slotDetalle.data.surgery_requests?.codigo_operacion || slotDetalle.data.codigo_operacion
                if (!codigoOperacion) return null
                const codigoObj = codigosOperaciones.find(c => c.codigo === codigoOperacion)
                return (
                  <div className="p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                    <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Procedimiento</div>
                    <div className="font-black text-slate-800 text-sm sm:text-base break-words">{codigoObj?.nombre || codigoOperacion}</div>
                    <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">Código: {codigoOperacion}</div>
                  </div>
                )
              })()}

              {/* Horario y Pabellón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                    <Clock size={9} className="sm:w-2.5 sm:h-2.5" /> Horario
                  </div>
                  <div className="font-black text-slate-800 text-sm sm:text-base">
                    {slotDetalle.data.hora_inicio?.substring(0, 5)} - {slotDetalle.data.hora_fin?.substring(0, 5)}
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                    <CalendarIcon size={9} className="sm:w-2.5 sm:h-2.5" /> Pabellón
                  </div>
                  <div className="font-black text-slate-800 text-sm sm:text-base break-words">{slotDetalle.pabellon}</div>
                </div>
              </div>

              {/* Fecha */}
              <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                  <CalendarIcon size={9} className="sm:w-2.5 sm:h-2.5" /> Fecha
                </div>
                <div className="font-black text-slate-800 text-sm sm:text-base break-words">
                  {format(slotDetalle.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              </div>

              {/* Observaciones */}
              <div className="p-3 sm:p-4 md:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones</span>
                  {!editandoObservaciones && (
                    <button
                      onClick={() => { setEditandoObservaciones(true); setObservacionesEditadas(slotDetalle.data.observaciones || '') }}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                  )}
                </div>
                {editandoObservaciones ? (
                  <div className="space-y-2">
                    <textarea
                      value={observacionesEditadas}
                      onChange={e => setObservacionesEditadas(e.target.value)}
                      rows={3}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Agregar observaciones…"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarObservaciones.mutate({ cirugiaId: slotDetalle.data.id, observaciones: observacionesEditadas })}
                        disabled={editarObservaciones.isPending}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                      >
                        {editarObservaciones.isPending ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditandoObservaciones(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-slate-700 break-words">
                    {slotDetalle.data.observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Estado</div>
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold text-[10px] sm:text-xs ${
                  slotDetalle.data.estado === 'programada' ? 'bg-green-100 text-green-700' :
                  slotDetalle.data.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                  slotDetalle.data.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <CheckCircle2 size={10} className="sm:w-3 sm:h-3" />
                  {slotDetalle.data.estado === 'programada' ? 'Programada' : slotDetalle.data.estado === 'en_proceso' ? 'En Proceso' : slotDetalle.data.estado}
                </div>
              </div>

              {/* Acciones de estado */}
              {slotDetalle.data.estado !== 'cancelada' && slotDetalle.date && !isPast(startOfDay(slotDetalle.date)) && (
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100 space-y-2">
                  {slotDetalle.data.estado === 'programada' && (
                    <button
                      onClick={() => marcarEnProceso.mutate(slotDetalle.data.id)}
                      disabled={marcarEnProceso.isPending}
                      className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <Activity size={16} />
                      {marcarEnProceso.isPending ? 'Actualizando…' : 'Iniciar Cirugía'}
                    </button>
                  )}
                  {slotDetalle.data.estado === 'en_proceso' && (
                    <button
                      onClick={() => completarCirugia.mutate(slotDetalle.data.id)}
                      disabled={completarCirugia.isPending}
                      className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <CheckCircle2 size={16} />
                      {completarCirugia.isPending ? 'Actualizando…' : 'Completar Cirugía'}
                    </button>
                  )}
                  {(slotDetalle.data.estado === 'programada' || slotDetalle.data.estado === 'en_proceso') && (
                    <button
                      onClick={onCancelarCirugia}
                      className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <XCircle size={16} />
                      Cancelar Cirugía
                    </button>
                  )}
                </div>
              )}

              {/* Historial */}
              {historialCirugia.length > 0 && (
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Clock size={9} /> Historial de cambios de fecha
                  </div>
                  <ul className="space-y-2">
                    {historialCirugia.map((h, i) => (
                      <li key={i} className="text-[10px] sm:text-xs text-slate-600 flex items-start gap-2">
                        <span className="shrink-0 font-bold text-slate-400">{i + 1}.</span>
                        <span>
                          <span className="line-through text-slate-400">{h.fecha_anterior} {h.hora_inicio_anterior}</span>
                          {' → '}
                          <span className="font-semibold text-slate-700">{h.fecha_nueva} {h.hora_inicio_nueva}</span>
                          {h.motivo && <span className="text-slate-400"> — {h.motivo}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Aviso histórico */}
              {slotDetalle.date && isPast(startOfDay(slotDetalle.date)) && (
                <div className="p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Info size={16} className="sm:w-5 sm:h-5" />
                    <p className="text-xs sm:text-sm font-bold">
                      Esta cirugía pertenece a un día histórico. Solo se puede consultar información.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : slotDetalle.type === 'available' ? (
            <>
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 bg-green-50 rounded-xl sm:rounded-2xl border border-green-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg bg-green-600 flex-shrink-0">
                  <CheckCircle2 size={24} className="sm:w-8 sm:h-8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] sm:text-[9px] font-black text-green-400 uppercase tracking-widest mb-0.5">Horario Disponible</div>
                  <div className="font-black text-slate-800 text-sm sm:text-base md:text-lg uppercase leading-none break-words">{slotDetalle.pabellon}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">{slotDetalle.time}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                    <Clock size={9} className="sm:w-2.5 sm:h-2.5" /> Hora
                  </div>
                  <div className="font-black text-slate-800 text-sm sm:text-base">{slotDetalle.time}</div>
                </div>
                <div className="p-3 sm:p-4 md:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                    <CalendarIcon size={9} className="sm:w-2.5 sm:h-2.5" /> Fecha
                  </div>
                  <div className="font-black text-slate-800 text-sm sm:text-base break-words">
                    {format(slotDetalle.date, "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-5 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100">
                <div className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1">
                  <Info size={9} className="sm:w-2.5 sm:h-2.5" /> Información
                </div>
                <div className="text-xs sm:text-sm text-slate-700 break-words">
                  Este horario está disponible para agendar una nueva cirugía. Para proceder con el agendamiento, primero debe seleccionar una solicitud desde la bandeja de solicitudes.
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
