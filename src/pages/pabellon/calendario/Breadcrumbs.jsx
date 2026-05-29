import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, getWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { MESES } from './constants'

export default function Breadcrumbs({ anio, view, selectedMonth, selectedWeek, selectedDay, onNavigate }) {
  const monthName = selectedMonth !== null ? MESES[selectedMonth].nombre : ''
  const weekNumber = selectedWeek
    ? getWeek(selectedWeek, { weekStartsOn: 1 }) - getWeek(startOfMonth(selectedWeek), { weekStartsOn: 1 }) + 1
    : ''

  return (
    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 leading-relaxed" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate('year')}
        className={`hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation px-1 py-0.5 rounded ${view === 'year' ? 'text-slate-900' : ''}`}
        aria-current={view === 'year' ? 'page' : undefined}
      >
        <span className="hidden sm:inline">Año </span>{anio}
      </button>

      {(view === 'month' || view === 'week' || view === 'day') && (
        <>
          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {selectedMonth !== null && (
              <>
                <button
                  onClick={() => {
                    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
                    const newAnio = selectedMonth === 0 ? anio - 1 : anio
                    onNavigate('month', newAnio, newMonth)
                  }}
                  className="p-1 rounded hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigate('month')}
                  className={`hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation px-1 py-0.5 rounded truncate max-w-[120px] sm:max-w-none ${view === 'month' ? 'text-slate-900' : ''}`}
                  aria-current={view === 'month' ? 'page' : undefined}
                >
                  {monthName}
                </button>
                <button
                  onClick={() => {
                    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
                    const newAnio = selectedMonth === 11 ? anio + 1 : anio
                    onNavigate('month', newAnio, newMonth)
                  }}
                  className="p-1 rounded hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </button>
              </>
            )}
            {selectedMonth === null && (
              <button
                onClick={() => onNavigate('month')}
                className={`hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation px-1 py-0.5 rounded truncate max-w-[120px] sm:max-w-none ${view === 'month' ? 'text-slate-900' : ''}`}
                aria-current={view === 'month' ? 'page' : undefined}
              >
                {monthName}
              </button>
            )}
          </div>
        </>
      )}

      {(view === 'week' || view === 'day') && (
        <>
          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300 flex-shrink-0" />
          <button
            onClick={() => onNavigate('week')}
            className={`hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation px-1 py-0.5 rounded ${view === 'week' ? 'text-slate-900' : ''}`}
            aria-current={view === 'week' ? 'page' : undefined}
          >
            Semana {weekNumber}
          </button>
        </>
      )}

      {view === 'day' && selectedDay && (
        <>
          <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-900 px-1 py-0.5 truncate max-w-[150px] sm:max-w-none" aria-current="page">
            {format(selectedDay, 'EEEE d', { locale: es })}
          </span>
        </>
      )}
    </nav>
  )
}
