import { Calendar, LayoutGrid } from 'lucide-react'
import { sanitizeString } from '../../../utils/sanitizeInput'
import SearchableSelect from '../../../components/SearchableSelect'
import CalendarioPabellonesGrid from '../../../components/CalendarioPabellonesGrid'
import { HORAS_SELECT } from '../../../utils/horasOpciones'
import { codigosOperaciones } from '../../../data/codigosOperaciones'

export default function SeccionHorarios({
  formData,
  setFormData,
  slot1Seleccionado,
  setSlot1Seleccionado,
  slot2Seleccionado,
  setSlot2Seleccionado,
  showSegundoHorario,
  setShowSegundoHorario,
  showCalendarioGrid,
  setShowCalendarioGrid,
  pabellonesList,
  theme,
  locationState,
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Datos de la Operación</h2>
      <div>
        <label className="label-field">Código de Operación *</label>
        <SearchableSelect
          options={codigosOperaciones}
          value={formData.codigo_operacion}
          onChange={(codigo) => setFormData({ ...formData, codigo_operacion: codigo })}
          placeholder="Buscar código de operación..."
          required
        />
      </div>

      {/* Selector: doctor elige hora vs pabellón */}
      <div className="mt-4">
        <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>
          Seleccionar hora
        </label>
        <select
          value={formData.dejar_fecha_a_pabellon ? 'pabellon' : 'doctor'}
          onChange={(e) => {
            const esPabellon = e.target.value === 'pabellon'
            setFormData(prev => ({
              ...prev,
              dejar_fecha_a_pabellon: esPabellon,
              ...(esPabellon ? {
                fecha_preferida: '',
                hora_recomendada: '',
                hora_fin_recomendada: '',
                operating_room_id_preferido: '',
                fecha_preferida_2: '',
                hora_recomendada_2: '',
                hora_fin_recomendada_2: '',
                operating_room_id_preferido_2: '',
                horarios_extra: [],
              } : {}),
            }))
            setShowCalendarioGrid(!esPabellon)
          }}
          className={`input-field max-w-md ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
        >
          <option value="doctor">Seleccionar hora</option>
          <option value="pabellon">Pabellón toma la hora</option>
        </select>
      </div>

      {/* Doctor elige hora */}
      {!formData.dejar_fecha_a_pabellon && (
        <>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowCalendarioGrid(prev => !prev)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600'
                  : 'bg-white border border-slate-300 text-gray-700 hover:bg-slate-100'
              }`}
              title="Ver día actual y disponibilidad por pabellón"
            >
              <Calendar className="w-5 h-5" />
              <span>{showCalendarioGrid ? 'Ocultar calendario' : 'Ver calendario y disponibilidad de pabellones'}</span>
              <LayoutGrid className="w-4 h-4 opacity-70" />
            </button>
            <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
              {formData.fecha_preferida
                ? 'Ve en qué pabellón está libre cada slot. Puede cambiar de día y volver a elegir.'
                : 'Se muestra el día actual con todos los pabellones (libre, ocupado, bloqueado). Elija día y hora desde el calendario.'}
            </p>
          </div>

          {showCalendarioGrid && (
            <div className={`mt-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <CalendarioPabellonesGrid
                theme={theme}
                inlineMode
                initialFecha={locationState?.fecha || new Date().toISOString().split('T')[0]}
                onCerrar={() => setShowCalendarioGrid(false)}
                onConfirm={(payload) => {
                  if (!payload.slot1) {
                    setShowCalendarioGrid(false)
                    return
                  }
                  const yaTienePrimerHorario = formData.fecha_preferida && formData.hora_recomendada
                  const eligioSoloUnSlot = !payload.slot2
                  if (yaTienePrimerHorario && eligioSoloUnSlot) {
                    setFormData(prev => ({
                      ...prev,
                      fecha_preferida_2: payload.fechaPreferida || '',
                      hora_recomendada_2: payload.slot1.horaInicio || '',
                      hora_fin_recomendada_2: payload.slot1.horaFin || '',
                      operating_room_id_preferido_2: payload.slot1.operating_room_id || '',
                    }))
                    setSlot2Seleccionado({
                      operating_room_id: payload.slot1.operating_room_id,
                      nombre_pabellon: payload.slot1.nombrePabellon || '',
                      hora_inicio: payload.slot1.horaInicio,
                      hora_fin: payload.slot1.horaFin,
                    })
                    setShowSegundoHorario(true)
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      fecha_preferida: payload.fechaPreferida || '',
                      hora_recomendada: payload.slot1.horaInicio || '',
                      hora_fin_recomendada: payload.slot1.horaFin || '',
                      operating_room_id_preferido: payload.slot1.operating_room_id || '',
                      fecha_preferida_2: payload.slot2 ? (payload.fechaPreferida2 || payload.fechaPreferida) : '',
                      hora_recomendada_2: payload.slot2?.horaInicio || '',
                      hora_fin_recomendada_2: payload.slot2?.horaFin || '',
                      operating_room_id_preferido_2: payload.slot2?.operating_room_id || '',
                    }))
                    setSlot1Seleccionado({
                      operating_room_id: payload.slot1.operating_room_id,
                      nombre_pabellon: payload.slot1.nombrePabellon || '',
                      hora_inicio: payload.slot1.horaInicio,
                      hora_fin: payload.slot1.horaFin,
                    })
                    setSlot2Seleccionado(payload.slot2 ? {
                      operating_room_id: payload.slot2.operating_room_id,
                      nombre_pabellon: payload.slot2.nombrePabellon || '',
                      hora_inicio: payload.slot2.horaInicio,
                      hora_fin: payload.slot2.horaFin,
                    } : null)
                    if (payload.slot2) setShowSegundoHorario(true)
                  }
                  setShowCalendarioGrid(false)
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Pabellón elige hora */}
      {formData.dejar_fecha_a_pabellon && (
        <div className={`mt-3 flex flex-wrap items-center gap-2 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>
            La fecha y hora serán asignadas por pabellón. Al enviar la solicitud se notificará a pabellón para que la persona a cargo elija una hora apropiada.
          </p>
        </div>
      )}

      {/* Horarios fijados */}
      {!formData.dejar_fecha_a_pabellon && formData.fecha_preferida && (
        <div className={`mt-4 p-4 rounded-xl border space-y-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
            Horario fijado desde el calendario. No se puede cambiar hasta que lo elimine; para elegir otro, pulse Quitar y vuelva a usar el calendario.
          </p>

          {/* 1º horario */}
          <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-200'}`}>
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
              1º — {slot1Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido)?.nombre || 'Pabellón'} · {formData.fecha_preferida ? new Date(formData.fecha_preferida + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada || ''}–{formData.hora_fin_recomendada || ''}
            </span>
            <button
              type="button"
              onClick={() => {
                setSlot1Seleccionado(null)
                setSlot2Seleccionado(null)
                setShowSegundoHorario(false)
                setFormData(prev => ({
                  ...prev,
                  fecha_preferida: '',
                  hora_recomendada: '',
                  hora_fin_recomendada: '',
                  operating_room_id_preferido: '',
                  fecha_preferida_2: '',
                  hora_recomendada_2: '',
                  hora_fin_recomendada_2: '',
                  operating_room_id_preferido_2: '',
                }))
              }}
              className={`ml-auto text-sm font-medium underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Quitar
            </button>
          </div>

          {formData.fecha_preferida && formData.hora_recomendada && !showSegundoHorario && (
            <button
              type="button"
              onClick={() => { setShowSegundoHorario(true); setShowCalendarioGrid(true) }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-gray-700 hover:bg-slate-100'}`}
            >
              Agregar otro día
            </button>
          )}

          {showSegundoHorario && (
            <>
              {(formData.fecha_preferida_2 || formData.hora_recomendada_2) ? (
                <div className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-50 border-blue-200'}`}>
                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
                    2º — {slot2Seleccionado?.nombre_pabellon || pabellonesList.find(p => p.id === formData.operating_room_id_preferido_2)?.nombre || 'Pabellón'} · {formData.fecha_preferida_2 ? new Date(formData.fecha_preferida_2 + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} · {formData.hora_recomendada_2 || ''}–{formData.hora_fin_recomendada_2 || ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSlot2Seleccionado(null)
                      setFormData(prev => ({
                        ...prev,
                        fecha_preferida_2: '',
                        hora_recomendada_2: '',
                        hora_fin_recomendada_2: '',
                        operating_room_id_preferido_2: '',
                      }))
                      setShowSegundoHorario(false)
                    }}
                    className={`ml-auto text-sm font-medium underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                  Abra el calendario de arriba y elija otro día; use «Usar como 1º y elegir 2º (otro día)» para fijar el segundo horario.
                </p>
              )}

              {formData.horarios_extra.map((extra, idx) => (
                <div key={extra._key} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>
                      {idx + 3}º horario
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        horarios_extra: prev.horarios_extra.filter((_, i) => i !== idx),
                      }))}
                      className={`text-sm underline ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Día</label>
                      <input
                        type="date"
                        value={extra.fecha_preferida || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, fecha_preferida: sanitizeString(e.target.value) } : h),
                        }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-field mt-0 w-auto min-w-[140px]"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Pabellón</label>
                      <select
                        value={extra.operating_room_id || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, operating_room_id: e.target.value || '' } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[140px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">Seleccione</option>
                        {pabellonesList.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Hora inicio</label>
                      <select
                        value={extra.hora_recomendada || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_recomendada: e.target.value } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[90px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">--</option>
                        {HORAS_SELECT.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>Hora fin</label>
                      <select
                        value={extra.hora_fin_recomendada || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          horarios_extra: prev.horarios_extra.map((h, i) => i === idx ? { ...h, hora_fin_recomendada: e.target.value } : h),
                        }))}
                        className={`input-field mt-0 w-auto min-w-[90px] ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}`}
                      >
                        <option value="">--</option>
                        {HORAS_SELECT.filter(h => !extra.hora_recomendada || h > extra.hora_recomendada).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  horarios_extra: [...prev.horarios_extra, { _key: Date.now(), fecha_preferida: '', operating_room_id: '', hora_recomendada: '', hora_fin_recomendada: '' }],
                }))}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-gray-700 hover:bg-slate-100'}`}
              >
                Añadir otra hora
              </button>
            </>
          )}
        </div>
      )}

      {/* Observaciones */}
      <div className="mt-4">
        <label className="label-field">Observaciones</label>
        <textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: sanitizeString(e.target.value) })}
          className="input-field"
          rows="3"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.observaciones?.length || 0}/500 caracteres
        </p>
      </div>
    </div>
  )
}
