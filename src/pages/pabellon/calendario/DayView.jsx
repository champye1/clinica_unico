import { useMemo, useState, useEffect, useRef } from 'react'
import { Info, Clock, Lock, Activity, XCircle, CheckCircle2 } from 'lucide-react'
import { format, isSameDay, isPast, startOfDay } from 'date-fns'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import Tooltip from '../../../components/common/Tooltip'
import Button from '../../../components/common/Button'
import { TIME_SLOTS } from './constants'

export default function DayView({ day, pabellones, cirugias, bloqueos, onSlotSelect, selectedSlot, currentRequest, onConfirmSlot, onSlotClick, showError, doctorColorMap = {} }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const scrollRef = useRef(null)
  const [gridWidth, setGridWidth] = useState(800)
  const [isResizing, setIsResizing] = useState(false)
  const gridRef = useRef(null)
  const resizeHandleRef = useRef(null)
  const resizeCleanupRef = useRef(null)

  const esDiaPasado = day ? isPast(startOfDay(day)) && !isSameDay(day, new Date()) : false

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => { resizeCleanupRef.current?.() }
  }, [])

  useEffect(() => {
    if (scrollRef.current && isSameDay(day, new Date())) {
      const currentHour = currentTime.getHours()
      const currentSlotIndex = Math.max(0, currentHour - 8)
      const scrollPosition = currentSlotIndex * 160
      scrollRef.current.scrollTop = scrollPosition - 140
    }
  }, [day, currentTime])

  const PAVILIONS = useMemo(() => {
    const primeros4 = pabellones.slice(0, 4)
    while (primeros4.length < 4) {
      primeros4.push({ id: `empty-${primeros4.length}`, nombre: `Pabellón ${primeros4.length + 1}` })
    }
    return primeros4.map(p => p.nombre)
  }, [pabellones])

  const pabellonesMostrar = useMemo(() => {
    return pabellones.slice(0, 4)
  }, [pabellones])

  const pabellon1Bloqueado = useMemo(() => {
    const pabellon1 = pabellonesMostrar[0]
    if (!pabellon1) return false
    const cirugiaPabellon1_8am = cirugias.find(c =>
      c.operating_room_id === pabellon1.id &&
      c.fecha === format(day, 'yyyy-MM-dd') &&
      c.hora_inicio <= '08:00' && c.hora_fin > '08:00'
    )
    return !!cirugiaPabellon1_8am
  }, [pabellonesMostrar, cirugias, day])

  const getGridStatus = (tIdx, pIdx, selectedDay, bloqueosList) => {
    const time = TIME_SLOTS[tIdx]
    const pabellon = pabellonesMostrar[pIdx]

    if (!pabellon) {
      return { status: 'free' }
    }

    if (pIdx === 0 && pabellon1Bloqueado) {
      return { status: 'blocked_agreement', data: { motivo: 'Pabellón 1 ocupado a las 8:00' } }
    }

    const cirugia = cirugias.find(c =>
      c.operating_room_id === pabellon.id &&
      c.fecha === format(selectedDay, 'yyyy-MM-dd') &&
      c.hora_inicio <= time + ':00' && c.hora_fin > time + ':00'
    )

    if (cirugia) {
      return { status: 'occupied', data: cirugia }
    }

    const fechaDia = format(selectedDay, 'yyyy-MM-dd')
    const slotTime = time.length === 5 ? time : time + ':00'
    const bloqueo = bloqueosList.find(b => {
      const f = typeof b.fecha === 'string' ? b.fecha.slice(0, 10) : format(new Date(b.fecha), 'yyyy-MM-dd')
      if (b.operating_room_id !== pabellon.id || f !== fechaDia) return false
      if (b.vigencia_hasta) {
        const vig = typeof b.vigencia_hasta === 'string' ? b.vigencia_hasta.slice(0, 10) : format(new Date(b.vigencia_hasta), 'yyyy-MM-dd')
        if (vig < fechaDia) return false
      }
      const hin = (b.hora_inicio && typeof b.hora_inicio === 'string') ? b.hora_inicio.slice(0, 5) : b.hora_inicio
      const hfn = (b.hora_fin && typeof b.hora_fin === 'string') ? b.hora_fin.slice(0, 5) : b.hora_fin
      if (!hin || !hfn) return true
      return hin <= slotTime && hfn > slotTime
    })

    if (bloqueo) {
      return { status: 'blocked_agreement', data: bloqueo }
    }

    return { status: 'free' }
  }

  const gridData = useMemo(() =>
    TIME_SLOTS.map((_, tIdx) =>
      PAVILIONS.map((_, pIdx) => getGridStatus(tIdx, pIdx, day, bloqueos))
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, bloqueos, cirugias, pabellonesMostrar, pabellon1Bloqueado]
  )

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-250px)] lg:flex-row gap-4 sm:gap-5 lg:gap-6 xl:gap-8 animate-in fade-in duration-500 px-2 sm:px-0">
      {esDiaPasado && (
        <div className="lg:hidden mb-2 sm:mb-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-start gap-1.5 sm:gap-2">
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[10px] font-black text-blue-900 uppercase tracking-wide leading-tight">
              Modo Consulta - Día Histórico
            </p>
            <p className="text-[8px] sm:text-[9px] text-blue-700 mt-0.5 leading-tight">
              Puede revisar las cirugías realizadas este día. No se pueden realizar modificaciones en fechas pasadas.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6 xl:gap-8 flex-1 min-w-0">
        {/* COLUMNA IZQUIERDA */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="bg-slate-900 p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <h6 className="font-black text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-blue-400 mb-3 sm:mb-4 leading-relaxed">Solicitud en Curso</h6>
            {currentRequest ? (
              <div className="space-y-3 sm:space-y-4 relative z-10">
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-0.5 sm:mb-1">Paciente</div>
                  <div className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide leading-relaxed break-words">{currentRequest.patients?.nombre} {currentRequest.patients?.apellido}</div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10">
                  <Activity size={14} className="sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-relaxed truncate min-w-0 flex-1">
                    {(() => {
                      const codigoObj = codigosOperaciones.find(c => c.codigo === currentRequest.codigo_operacion)
                      return codigoObj?.nombre || currentRequest.codigo_operacion
                    })()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[9px] sm:text-[10px] text-slate-500 italic">Navegación libre por disponibilidad.</p>
            )}
          </div>

          <div className="bg-white p-4 sm:p-5 md:p-6 lg:p-7 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 sm:mb-4 flex items-center gap-2 leading-relaxed">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 text-[10px] sm:text-xs flex-shrink-0">?</span>
              <span className="truncate">Leyenda de Estados</span>
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-green-600" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Disponible</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-4 h-4 rounded border-2 border-slate-300 bg-slate-100 flex items-center justify-center">
                  <XCircle size={12} className="text-slate-500" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-relaxed">Ocupado</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-4 h-4 rounded border-2 border-amber-400 bg-slate-800 flex items-center justify-center">
                  <Lock size={12} className="text-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-relaxed">Bloqueado / Convenio</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-relaxed">Seleccionado</span>
              </div>
            </div>

            {(() => {
              const doctoresHoy = cirugias.reduce((acc, c) => {
                if (c.doctor_id && !acc.find(d => d.id === c.doctor_id)) {
                  acc.push({ id: c.doctor_id, apellido: c.doctors?.apellido || c.doctors?.nombre || 'Dr.' })
                }
                return acc
              }, [])
              if (doctoresHoy.length === 0) return null
              return (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Médicos hoy</p>
                  <div className="space-y-1.5">
                    {doctoresHoy.map(doctor => {
                      const dc = doctorColorMap[doctor.id]?.color
                      return (
                        <div key={doctor.id} className="flex items-center gap-2 px-1">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dc?.dot || '#ef4444' }} />
                          <span className="text-[10px] font-bold text-slate-600 truncate">Dr. {doctor.apellido}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>

          {esDiaPasado && (
            <div className="hidden lg:block bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-2.5 flex items-start gap-1.5 sm:gap-2">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-black text-blue-900 uppercase tracking-wide leading-tight">
                  Modo Consulta - Día Histórico
                </p>
                <p className="text-[8px] sm:text-[9px] text-blue-700 mt-0.5 leading-tight">
                  Puede revisar las cirugías realizadas este día. No se pueden realizar modificaciones en fechas pasadas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* GRILLA PRINCIPAL */}
        <div
          ref={gridRef}
          style={{ width: `${gridWidth}px`, minWidth: '600px', maxWidth: '90%' }}
          className={`relative bg-white rounded-xl sm:rounded-2xl lg:rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col ${esDiaPasado ? 'opacity-90' : ''} ${isResizing ? 'select-none' : ''}`}
        >
          {/* Resize handle */}
          <div
            ref={resizeHandleRef}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!gridRef.current) return

              setIsResizing(true)
              const startX = e.clientX
              const startWidth = gridRef.current.getBoundingClientRect().width

              document.body.style.userSelect = 'none'
              document.body.style.cursor = 'col-resize'

              const handleMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX
                let newWidth = startWidth + deltaX
                if (newWidth < 600) newWidth = 600
                if (newWidth > window.innerWidth * 0.9) newWidth = window.innerWidth * 0.9
                setGridWidth(newWidth)
              }

              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove)
                document.removeEventListener('mouseup', handleUp)
                document.body.style.userSelect = ''
                document.body.style.cursor = ''
                setIsResizing(false)
                resizeCleanupRef.current = null
              }

              resizeCleanupRef.current = handleUp
              document.addEventListener('mousemove', handleMove)
              document.addEventListener('mouseup', handleUp)
            }}
            className={`absolute left-0 top-0 w-4 h-full cursor-col-resize z-30 group ${isResizing ? 'bg-blue-500/30' : 'bg-transparent hover:bg-blue-200/30'} transition-colors`}
            style={{ touchAction: 'none', userSelect: 'none', marginLeft: '-16px', paddingLeft: '16px' }}
            title="Arrastra para redimensionar"
          >
            <div className={`absolute top-1/2 left-2 transform -translate-y-1/2 w-1 h-32 rounded-full transition-all pointer-events-none ${isResizing ? 'bg-blue-600 opacity-100 w-2' : 'bg-blue-400 opacity-0 group-hover:opacity-70 group-hover:w-1.5'}`} />
            <div className={`absolute top-0 left-0 w-0.5 h-full transition-all ${isResizing ? 'bg-blue-500 opacity-100' : 'bg-blue-300 opacity-0 group-hover:opacity-60'}`} />
          </div>

          {/* Cabecera */}
          <div className="flex bg-slate-50 border-b-2 border-slate-200 shadow-sm overflow-x-auto -mx-2 sm:mx-0 scrollbar-hide">
            <div className="w-16 sm:w-20 lg:w-24 border-r-2 border-slate-200 flex-shrink-0 flex items-center justify-center py-3 sm:py-4 lg:py-6 sticky left-0 bg-slate-50 z-20">
              <Clock size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-slate-400" />
            </div>
            {PAVILIONS.map((p, pIdx) => {
              const pabellon = pabellonesMostrar[pIdx]
              if (!pabellon) {
                return (
                  <div key={`empty-${pIdx}`} className="flex-1 min-w-[100px] sm:min-w-[120px] text-center py-3 sm:py-4 lg:py-6 border-r-2 last:border-r-0 border-slate-200 bg-slate-50/50 px-2">
                    <div className="font-black text-slate-800 text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.3em] leading-relaxed truncate">{p}</div>
                    <div className="text-[7px] sm:text-[8px] lg:text-[9px] font-black text-slate-400 uppercase mt-1 sm:mt-1.5">No disponible</div>
                  </div>
                )
              }
              const slotsLibres = gridData.filter(r => r[pIdx].status === 'free').length
              return (
                <div key={pabellon.id} className="flex-1 min-w-[100px] sm:min-w-[120px] text-center py-3 sm:py-4 lg:py-6 border-r-2 last:border-r-0 border-slate-200 hover:bg-slate-100/50 transition-colors px-2">
                  <div className="font-black text-slate-800 text-[9px] sm:text-[10px] lg:text-[11px] uppercase tracking-[0.3em] leading-relaxed truncate">{p}</div>
                  <div className="text-[7px] sm:text-[8px] lg:text-[9px] font-black text-green-500 uppercase mt-1 sm:mt-1.5">
                    {slotsLibres} {slotsLibres === 1 ? 'Libre' : 'Libres'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cuerpo */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-slate-50/30 relative -mx-2 sm:mx-0 scrollbar-hide">
            {TIME_SLOTS.map((time, tIdx) => {
              const isCurrentHour = isSameDay(day, new Date()) &&
                currentTime.getHours() === parseInt(time.split(':')[0]) &&
                currentTime.getHours() >= 8 && currentTime.getHours() < 20

              return (
                <div key={time} className={`flex border-b-2 border-slate-200 last:border-0 hover:bg-white/50 transition-all group relative min-h-[90px] sm:min-h-[100px] lg:min-h-[110px] ${isCurrentHour ? 'bg-gradient-to-r from-blue-50/40 to-transparent' : ''}`}>
                  <div
                    className={`w-16 sm:w-20 lg:w-24 border-r-[3px] border-slate-500 flex-shrink-0 flex items-center justify-center h-full text-[9px] sm:text-[10px] lg:text-[11px] font-black uppercase tracking-widest leading-relaxed transition-all duration-300 relative z-10 bg-white sticky left-0 ${isCurrentHour ? 'text-blue-600 bg-blue-50/30 shadow-sm' : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50/20'}`}
                    aria-label={`Hora ${time}`}
                  >
                    {time}
                  </div>

                  {PAVILIONS.map((pav, pIdx) => {
                    const pabellon = pabellonesMostrar[pIdx]
                    const info = gridData[tIdx][pIdx]
                    const isSelected = selectedSlot?.pabellonId === pabellon?.id && selectedSlot?.time === time
                    const isAvailable = info.status === 'free' && pabellon

                    if (!pabellon) {
                      return (
                        <div key={`${time}-${pav}`} className="flex-1 h-full border-r-2 last:border-r-0 border-slate-200 p-0 bg-slate-50/30">
                          <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-xl border-slate-100 opacity-50 m-1">
                            <span className="text-sm text-slate-300 font-black uppercase tracking-widest">N/A</span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`${time}-${pav}`}
                        onClick={() => {
                          if (esDiaPasado) {
                            if (info.status === 'occupied') {
                              onSlotClick({ type: 'occupied', data: info.data, pabellon: pabellon.nombre, time, date: day })
                            } else {
                              showError('Este día es histórico. Solo se pueden consultar cirugías realizadas.')
                            }
                            return
                          }
                          if (info.status === 'occupied') {
                            onSlotClick({ type: 'occupied', data: info.data, pabellon: pabellon.nombre, time, date: day })
                            return
                          }
                          if (info.status === 'blocked_agreement') {
                            showError('Este horario está bloqueado por convenio')
                            return
                          }
                          if (isAvailable && currentRequest) {
                            onSlotSelect({ pabellonId: pabellon.id, time, date: day })
                          } else if (isAvailable) {
                            onSlotClick({ type: 'available', pabellon: pabellon.nombre, time, date: day })
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && isAvailable && !esDiaPasado) {
                            e.preventDefault()
                            if (currentRequest) {
                              onSlotSelect({ pabellonId: pabellon.id, time, date: day })
                            } else {
                              onSlotClick({ type: 'available', pabellon: pabellon.nombre, time, date: day })
                            }
                          }
                        }}
                        className={`flex-1 h-full border-r-2 last:border-r-0 border-slate-200 pl-1.5 sm:pl-2 lg:pl-4 pr-1.5 sm:pr-2 lg:pr-3 py-1.5 sm:py-2 transition-all flex items-center justify-center bg-white min-w-[90px] sm:min-w-[100px] touch-manipulation ${
                          esDiaPasado
                            ? info.status === 'occupied'
                              ? 'cursor-pointer hover:bg-blue-50/40 opacity-90'
                              : 'cursor-not-allowed opacity-50'
                            : isAvailable || info.status === 'occupied'
                            ? 'cursor-pointer hover:bg-blue-50/40 active:bg-blue-100/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                            : 'cursor-not-allowed'
                        }`}
                        tabIndex={esDiaPasado ? (info.status === 'occupied' ? 0 : -1) : (isAvailable || info.status === 'occupied' ? 0 : -1)}
                      >
                        {info.status === 'occupied' ? (
                          <Tooltip content={
                            <div className="text-left">
                              <div className="font-black mb-1 text-white">Cirugía Programada</div>
                              <div className="text-xs text-slate-200">
                                <div>Dr. {info.data?.doctors?.apellido || info.data?.doctors?.nombre || 'General'}</div>
                                <div className="mt-1">{info.data?.hora_inicio?.substring(0, 5)} - {info.data?.hora_fin?.substring(0, 5)}</div>
                                {info.data?.patients?.nombre && (
                                  <div className="mt-1">{info.data.patients.nombre} {info.data.patients.apellido}</div>
                                )}
                                <div className="mt-2 text-[10px] text-blue-300">Click para ver detalles</div>
                              </div>
                            </div>
                          }>
                            {(() => {
                              const dc = doctorColorMap[info.data?.doctor_id]?.color
                              return (
                                <div
                                  className="w-full h-full border-2 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg active:scale-95 transition-all group/occupied"
                                  style={{ backgroundColor: dc?.bg || '#fef2f2', borderColor: dc?.border || '#fca5a5' }}
                                  role="button" tabIndex={0} aria-label="Horario ocupado"
                                >
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 sm:mb-2 group-hover/occupied:scale-110 transition-transform" style={{ backgroundColor: dc?.dot || '#ef4444' }}>
                                    <XCircle size={12} className="sm:w-4 sm:h-4 text-white" />
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed text-center" style={{ color: dc?.text || '#b91c1c' }}>Ocupado</span>
                                  {info.data?.patients?.nombre && (
                                    <span className="text-[8px] sm:text-[9px] font-bold mt-0.5 sm:mt-1 truncate w-full text-center px-1" style={{ color: dc?.text || '#b91c1c' }}>
                                      {info.data.patients.nombre.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                              )
                            })()}
                          </Tooltip>
                        ) : info.status === 'blocked_agreement' ? (
                          <Tooltip content={
                            info.data?.doctor_id
                              ? `Bloqueado — ${info.data?.doctors?.nombre || ''} ${info.data?.doctors?.apellido || ''}: ${info.data?.motivo || 'Sin motivo'}`
                              : `Bloqueado por convenio${info.data?.motivo ? ` — ${info.data.motivo}` : ''}`
                          }>
                            <div
                              className={`w-full h-full border-2 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center cursor-not-allowed transition-all ${info.data?.doctor_id ? 'bg-purple-900 border-purple-400/50 hover:border-purple-400' : 'bg-slate-800 border-amber-400/50 hover:border-amber-400'}`}
                              role="button" tabIndex={-1} aria-label="Horario bloqueado"
                            >
                              <Lock size={16} className={`sm:w-5 sm:h-5 mb-1 sm:mb-2 ${info.data?.doctor_id ? 'text-purple-300' : 'text-amber-400'}`} />
                              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider leading-relaxed text-center ${info.data?.doctor_id ? 'text-purple-300' : 'text-amber-400'}`}>
                                {info.data?.doctor_id ? `Dr. ${info.data?.doctors?.apellido || 'Médico'}` : 'Bloqueado'}
                              </span>
                            </div>
                          </Tooltip>
                        ) : (
                          <Tooltip content={currentRequest ? "Click para seleccionar este horario" : "Click para ver detalles del horario disponible"}>
                            <div
                              className={`w-full h-full border-2 rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center transition-all active:scale-95 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50'
                                  : isAvailable
                                  ? 'border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 hover:shadow-md active:bg-green-200'
                                  : 'border-slate-200 bg-slate-50'
                              }`}
                              role="button"
                              tabIndex={isAvailable ? 0 : -1}
                              aria-label={isAvailable ? `Horario disponible ${time} en ${pabellon.nombre}` : 'Horario no disponible'}
                            >
                              {isSelected ? (
                                <>
                                  <CheckCircle2 size={16} className="sm:w-5 sm:h-5 text-blue-600 mb-0.5 sm:mb-1" />
                                  <span className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-wider text-center">Seleccionado</span>
                                </>
                              ) : isAvailable ? (
                                <>
                                  <CheckCircle2 size={16} className="sm:w-5 sm:h-5 text-green-600 mb-0.5 sm:mb-1" />
                                  <span className="text-[10px] sm:text-xs font-black text-green-700 uppercase tracking-wider leading-relaxed text-center">Disponible</span>
                                </>
                              ) : (
                                <span className="text-[10px] sm:text-xs text-slate-400 font-bold">N/A</span>
                              )}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Barra inferior de confirmación */}
          {selectedSlot && (
            <div className="bg-slate-900 text-white p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-bottom duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] sticky bottom-0 z-30">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-1 min-w-0 w-full sm:w-auto">
                <div className="bg-blue-600 p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl flex-shrink-0">
                  <Info size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[7px] sm:text-[8px] lg:text-[9px] text-blue-400 font-black uppercase tracking-[0.4em] mb-0.5 sm:mb-1 leading-relaxed">BLOQUE SELECCIONADO</p>
                  <h3 className="text-sm sm:text-base lg:text-xl font-black uppercase tracking-wide leading-relaxed truncate">
                    {pabellonesMostrar.find(p => p.id === selectedSlot.pabellonId)?.nombre}
                    <span className="text-slate-400 mx-1.5 sm:mx-2 lg:mx-3">•</span>
                    {selectedSlot.time}
                  </h3>
                </div>
              </div>
              <Button
                onClick={onConfirmSlot}
                className="w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base touch-manipulation"
              >
                <span className="hidden sm:inline">PROCEDER AL AGENDAMIENTO</span>
                <span className="sm:hidden">CONFIRMAR</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
