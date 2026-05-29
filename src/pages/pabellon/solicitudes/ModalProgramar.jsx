import { Clock, X, Activity, Lock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { sanitizeString } from '../../../utils/sanitizeInput'
import { HORAS_SELECT } from '../../../utils/horasOpciones'
import LoadingSpinner from '../../../components/common/LoadingSpinner'

export default function ModalProgramar({
  solicitud,
  onClose,
  formProgramacion,
  setFormProgramacion,
  onSubmit,
  pabellones,
  pabellonesMostrar,
  slotsHorarios,
  getSlotStatus,
  cirugiasFecha,
  bloqueosFecha,
  isPending,
  showError,
}) {
  if (!solicitud) return null

  const handleClose = () => {
    onClose()
    sessionStorage.removeItem('solicitud_gestionando')
    sessionStorage.removeItem('slot_seleccionado')
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Programar Cirugía"
        className="bg-white rounded-[2.5rem] w-full max-w-6xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Programar Cirugía</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Agendamiento Quirúrgico</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Cerrar programación">
            <X size={24} className="text-white" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Fecha y hora fin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha *</label>
              <input
                type="date"
                value={formProgramacion.fecha}
                onChange={e => setFormProgramacion({ ...formProgramacion, fecha: sanitizeString(e.target.value) })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                required
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora Fin *</label>
              <select
                value={formProgramacion.hora_fin ? String(formProgramacion.hora_fin).slice(0, 5) : ''}
                onChange={e => setFormProgramacion({ ...formProgramacion, hora_fin: sanitizeString(e.target.value) })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                required
              >
                <option value="">Seleccione hora</option>
                {HORAS_SELECT
                  .filter(h => !formProgramacion.hora_inicio || h > String(formProgramacion.hora_inicio).slice(0, 5))
                  .map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 ml-1">Solo hora (sin minutos)</p>
            </div>
          </div>

          {/* Calendario de pabellones */}
          {formProgramacion.fecha && (
            <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
              {/* Sidebar izquierdo */}
              <div className="lg:w-80 flex-shrink-0 space-y-6">
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 transform translate-x-10 -translate-y-10" />
                  <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">Solicitud en curso</h3>
                    <div className="space-y-4 mt-4">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paciente</div>
                        <div className="text-xl font-black uppercase tracking-tighter leading-tight">
                          {solicitud.patients?.nombre} {solicitud.patients?.apellido}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                          RUT: {solicitud.patients?.rut}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                        <Activity size={16} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest truncate">{solicitud.codigo_operacion}</span>
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Cirujano:{' '}
                        <span className="text-white">{solicitud.doctors?.nombre} {solicitud.doctors?.apellido}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-6">
                  <h4 className="text-[10px] font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <span className="w-4 h-4 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 text-xs">?</span>
                    Leyenda
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-200" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Disponible</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-50 border-2 border-red-100" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ocupado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-slate-900" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prioridad / Convenio</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid principal */}
              <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm overflow-hidden relative flex flex-col">
                {/* Header con pabellones */}
                <div className="flex bg-slate-50 border-b border-slate-200 mb-0 flex-shrink-0">
                  <div className="w-24 border-r border-slate-200 flex-shrink-0 flex items-center justify-center py-6">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  {Array.from({ length: 4 }).map((_, index) => {
                    const p = pabellonesMostrar[index]
                    if (!p) {
                      return (
                        <div key={`empty-${index}`} className="flex-1 text-center py-6 border-r last:border-r-0 bg-slate-50/50">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider leading-none">Pabellón {index + 1}</h4>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-1.5 block">No disponible</span>
                        </div>
                      )
                    }
                    const ocupados = slotsHorarios.filter(t => {
                      const { status } = getSlotStatus(p.id, t)
                      return status === 'occupied' || status === 'blocked'
                    }).length
                    const libres = slotsHorarios.length - ocupados
                    return (
                      <div key={p.id} className="flex-1 text-center py-6 border-r last:border-r-0">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">{p.nombre}</h4>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1.5 block">{libres} Libres</span>
                      </div>
                    )
                  })}
                </div>

                {/* Filas de horarios */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar bg-white ${formProgramacion.operating_room_id && formProgramacion.hora_inicio ? 'pb-24' : ''}`}>
                  {slotsHorarios.map(time => {
                    const horaSeleccionada = formProgramacion.hora_inicio === time
                    return (
                      <div key={time} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                        <div className="w-24 border-r border-slate-200 flex-shrink-0 flex items-center justify-center py-10 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                          {time}
                        </div>
                        {Array.from({ length: 4 }).map((_, index) => {
                          const pav = pabellonesMostrar[index]
                          if (!pav) {
                            return (
                              <div key={`${time}-empty-${index}`} className="flex-1 min-h-[110px] border-r last:border-r-0 p-2.5 bg-slate-50/30">
                                <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-2xl border-slate-100 opacity-50">
                                  <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">N/A</span>
                                </div>
                              </div>
                            )
                          }
                          const { status, data } = getSlotStatus(pav.id, time)
                          const isSelected = formProgramacion.operating_room_id === pav.id && horaSeleccionada
                          const isOccupied = status === 'occupied' || status === 'blocked'
                          return (
                            <div
                              key={`${time}-${pav.id}`}
                              onClick={() => {
                                if (isOccupied) {
                                  showError(status === 'occupied' ? 'Este horario ya está ocupado por otra cirugía' : 'Este horario está bloqueado por convenio')
                                  return
                                }
                                setFormProgramacion({ ...formProgramacion, operating_room_id: pav.id, hora_inicio: time })
                              }}
                              className={`flex-1 min-h-[110px] border-r last:border-r-0 p-2.5 transition-all ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50/30'}`}
                            >
                              {status === 'occupied' ? (
                                <div className="h-full w-full bg-red-50 rounded-2xl border border-red-100 p-4 flex flex-col justify-between shadow-sm">
                                  <span className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">Ocupado</span>
                                  <span className="text-xs font-bold text-red-900 leading-tight truncate">
                                    {data.doctors?.apellido ? `Dr. ${data.doctors.apellido}` : data.doctors?.nombre ? `Dr. ${data.doctors.nombre}` : 'Cirugía'}
                                  </span>
                                </div>
                              ) : status === 'blocked' ? (
                                <div className="h-full w-full bg-slate-900 rounded-2xl border-2 border-amber-400/50 p-4 flex flex-col justify-between shadow-lg">
                                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none flex items-center gap-1">
                                    <Lock size={8} /> Convenio
                                  </span>
                                  <span className="text-[11px] font-black text-white uppercase tracking-tighter leading-tight truncate">Bloqueado</span>
                                </div>
                              ) : (
                                <div className={`h-full w-full flex items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-300 ${
                                  isSelected ? 'border-blue-500 bg-blue-50 scale-[0.97] shadow-inner' : 'border-slate-200 group-hover:border-slate-300'
                                }`}>
                                  {isSelected && <CheckCircle2 size={36} className="text-blue-500 animate-in zoom-in duration-300" />}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

                {/* Footer flotante con selección */}
                {formProgramacion.operating_room_id && formProgramacion.hora_inicio && (
                  <div className="absolute bottom-0 left-0 right-0 bg-slate-900 text-white p-6 flex items-center justify-between animate-in slide-in-from-bottom-full duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center gap-6">
                      <div className="bg-blue-600 p-4 rounded-2xl">
                        <Activity size={24} />
                      </div>
                      <div>
                        <div className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em] mb-1">Bloque Seleccionado</div>
                        <div className="font-black text-xl uppercase tracking-tighter">
                          {pabellonesMostrar.find(p => p.id === formProgramacion.operating_room_id)?.nombre || 'Pabellón'}
                          <span className="text-slate-600 mx-3">•</span>
                          {formProgramacion.hora_inicio}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const [hours, minutes] = formProgramacion.hora_inicio.split(':')
                        const finMinutos = Math.min(parseInt(hours) * 60 + parseInt(minutes) + 60, 19 * 60)
                        const horaFinStr = `${Math.floor(finMinutos / 60).toString().padStart(2, '0')}:${(finMinutos % 60).toString().padStart(2, '0')}`
                        setFormProgramacion(prev => ({ ...prev, hora_fin: horaFinStr }))
                      }}
                      className="bg-blue-500 hover:bg-blue-400 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                    >
                      Proceder al agendamiento
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Select manual de pabellón */}
          {!formProgramacion.operating_room_id && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Seleccionar Pabellón Manualmente *
              </label>
              <select
                value={formProgramacion.operating_room_id}
                onChange={e => setFormProgramacion({ ...formProgramacion, operating_room_id: sanitizeString(e.target.value) })}
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                required
              >
                <option value="">-- Seleccionar Pabellón --</option>
                {pabellones.map(pabellon => {
                  let estaOcupado = false
                  if (formProgramacion.fecha && formProgramacion.hora_inicio) {
                    const cirugiaOcupada = cirugiasFecha.find(c =>
                      c.operating_room_id === pabellon.id &&
                      c.hora_inicio <= formProgramacion.hora_inicio + ':00' &&
                      c.hora_fin > formProgramacion.hora_inicio + ':00'
                    )
                    const bloqueo = bloqueosFecha.find(b =>
                      b.operating_room_id === pabellon.id &&
                      b.hora_inicio <= formProgramacion.hora_inicio + ':00' &&
                      b.hora_fin > formProgramacion.hora_inicio + ':00'
                    )
                    estaOcupado = !!cirugiaOcupada || !!bloqueo
                  }
                  return (
                    <option key={pabellon.id} value={pabellon.id} disabled={estaOcupado}>
                      {pabellon.nombre} {estaOcupado ? '(Ocupado)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* Observaciones */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones</label>
            <textarea
              value={formProgramacion.observaciones}
              onChange={e => setFormProgramacion({ ...formProgramacion, observaciones: sanitizeString(e.target.value) })}
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none"
              rows={3}
              placeholder="Notas adicionales sobre la cirugía..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{formProgramacion.observaciones?.length || 0}/500 caracteres</p>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3.5 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2"
              disabled={!formProgramacion.operating_room_id || !formProgramacion.fecha || !formProgramacion.hora_inicio || !formProgramacion.hora_fin || isPending}
            >
              {isPending ? (
                <><LoadingSpinner size="sm" />Programando...</>
              ) : (
                'Programar Cirugía'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
