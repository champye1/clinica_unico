import { useMemo } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, isSameDay, isPast, startOfDay, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export default function WeekView({ weekStart, cirugias, pabellonId, onDayClick, pabellones, selectedDay }) {
  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
  }, [weekStart])

  const getOcupacionGlobal = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const cirugiasDia = cirugias.filter(c => {
      if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
      return c.fecha === dayStr
    })
    const minutosOcupados = cirugiasDia.reduce((acc, curr) => {
      const [h1, m1] = curr.hora_inicio.split(':').map(Number)
      const [h2, m2] = curr.hora_fin.split(':').map(Number)
      return acc + (h2 * 60 + m2) - (h1 * 60 + m1)
    }, 0)
    const totalMinutos = pabellones.length * 12 * 60
    return Math.min(100, Math.round((minutosOcupados / totalMinutos) * 100))
  }

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-4 lg:px-0">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 flex items-center gap-3 sm:gap-4 lg:gap-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-black text-blue-900 uppercase tracking-wide leading-relaxed">Semana Laboral</h3>
          <p className="text-xs sm:text-sm font-medium text-blue-600 mt-1 sm:mt-2 truncate">
            {format(weekStart, 'd', { locale: es })} - {format(addDays(weekStart, 6), 'd MMMM', { locale: es })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7 auto-rows-fr items-stretch">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const esDiaPasado = isPast(startOfDay(day)) && !isSameDay(day, new Date())
          const esSeleccionado = selectedDay && isSameDay(day, selectedDay)
          const ocupacionGlobal = getOcupacionGlobal(day)
          const cirugiasDia = cirugias.filter(c => {
            if (pabellonId !== 'todos' && c.operating_room_id !== pabellonId) return false
            return c.fecha === dayStr
          })

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`bg-white rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] border-2 p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 flex flex-col h-full text-left hover:shadow-xl transition-all group w-full min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] xl:min-h-[220px] 2xl:min-h-[240px] active:scale-[0.98] touch-manipulation ${
                esDiaPasado
                  ? 'border-slate-200 opacity-75 hover:border-slate-300 hover:opacity-90 cursor-pointer'
                  : esSeleccionado
                  ? 'border-blue-500 shadow-lg shadow-blue-200/50 bg-blue-50/30 ring-2 ring-blue-500 ring-offset-2'
                  : 'border-slate-100 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
              aria-label={`${format(day, 'EEEE d MMMM', { locale: es })} - ${ocupacionGlobal}% ocupado${esDiaPasado ? ' (modo consulta)' : ''}`}
              aria-pressed={esSeleccionado}
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6 w-full gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className={`text-base sm:text-lg lg:text-xl xl:text-xl font-black uppercase mb-1 sm:mb-2 whitespace-nowrap transition-colors ${
                    esDiaPasado ? 'text-slate-400' : esSeleccionado ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {format(day, 'EEEE', { locale: es })}
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-sm font-bold text-slate-500 uppercase tracking-wider leading-relaxed whitespace-nowrap">
                    {format(day, 'd MMMM', { locale: es })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-black leading-none ${
                    esDiaPasado ? 'text-slate-400' : esSeleccionado ? 'text-blue-600' : 'text-blue-600'
                  }`}>
                    {ocupacionGlobal}%
                  </div>
                  <div className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-0.5 sm:mt-1 leading-relaxed">
                    OCUP.
                  </div>
                </div>
              </div>

              <div className={`flex-1 flex flex-col justify-end mt-auto space-y-1.5 sm:space-y-2`}>
                <div className={`h-2.5 sm:h-3 w-full rounded-full overflow-hidden shadow-inner ${esDiaPasado ? 'bg-slate-100' : 'bg-slate-100'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${esDiaPasado ? 'bg-slate-400' : 'bg-blue-500'}`}
                    style={{ width: `${ocupacionGlobal}%` }}
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    {cirugiasDia.length} cirugía{cirugiasDia.length !== 1 ? 's' : ''}
                  </span>
                  {esDiaPasado && (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">HISTÓRICO</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
