import { forwardRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell } from 'lucide-react'

const NotificationsDropdown = forwardRef(function NotificationsDropdown(
  { isDark, isMedical, showDropdown, onToggle, unreadCount, notifications, onMarkAllRead, onNotificationClick },
  ref
) {
  const btnClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-blue-400 hover:bg-slate-700'
    : isMedical
    ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
    : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50'

  const dropdownClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  const headerBorder = isDark ? 'border-slate-700' : 'border-slate-200'
  const titleClass = isDark ? 'text-white' : 'text-slate-900'
  const emptyClass = isDark ? 'text-slate-400' : 'text-slate-500'
  const divideClass = isDark ? 'divide-slate-700' : 'divide-slate-200'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-8 h-8 sm:w-10 sm:h-10 ${btnClass} rounded-xl flex items-center justify-center border transition-all relative`}
        aria-label="Notificaciones"
        aria-expanded={showDropdown}
      >
        <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden rounded-2xl border shadow-xl z-50 flex flex-col ${dropdownClass}`}>
          <div className={`flex items-center justify-between px-4 py-3 border-b ${headerBorder}`}>
            <h3 className={`font-bold text-sm uppercase tracking-tight ${titleClass}`}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button type="button" onClick={onMarkAllRead} className="text-xs font-semibold text-blue-600 hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className={`px-4 py-6 text-center text-sm ${emptyClass}`}>No hay notificaciones</p>
            ) : (
              <ul className={`divide-y ${divideClass}`}>
                {notifications.map(n => (
                  <li
                    key={n.id}
                    onClick={() => onNotificationClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNotificationClick(n) }}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      n.vista
                        ? isDark ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'hover:bg-slate-50'
                        : isDark ? 'bg-blue-900/20 hover:bg-slate-700/50' : 'bg-blue-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.titulo}</p>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.mensaje}</p>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {n.created_at ? format(new Date(n.created_at), 'd MMM yyyy, HH:mm', { locale: es }) : '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default NotificationsDropdown
