import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { sanitizeString } from '../../../utils/sanitizeInput'
import { useTheme } from '../../../contexts/ThemeContext'
import { codigosOperaciones } from '../../../data/codigosOperaciones'
import { PREVISION_OPTIONS } from '../../../utils/previsionConfig'

const inputClass = (theme) => `w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-lg sm:rounded-xl focus:border-blue-500 focus:outline-none font-bold text-sm sm:text-base touch-manipulation ${
  theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white'
  : theme === 'medical' ? 'bg-white border-blue-200 text-slate-700'
  : 'bg-white border-slate-200 text-slate-700'
}`

const labelClass = (theme) => `text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1.5 sm:mb-2 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`

export default function FiltrosSolicitudes({
  busqueda, setBusqueda,
  filtroEstado, setFiltroEstado,
  filtroDoctor, setFiltroDoctor,
  filtroCodigoOperacion, setFiltroCodigoOperacion,
  filtroPrevision, setFiltroPrevision,
  filtroFechaDesde, setFiltroFechaDesde,
  filtroFechaHasta, setFiltroFechaHasta,
  doctoresUnicos,
  codigosUnicos,
  solicitudes,
  solicitudesFiltradas,
}) {
  const { theme } = useTheme()
  const hayFiltros = busqueda || filtroDoctor !== 'todos' || filtroCodigoOperacion !== 'todos' || filtroEstado !== 'todas' || filtroPrevision !== 'todas' || filtroFechaDesde || filtroFechaHasta

  return (
    <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(sanitizeString(e.target.value))}
          placeholder="Buscar por paciente, RUT, doctor o código..."
          aria-label="Buscar solicitudes"
          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl sm:rounded-2xl focus:border-blue-500 focus:outline-none font-bold text-sm sm:text-base transition-all touch-manipulation ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
            : theme === 'medical' ? 'bg-white border-blue-200 text-slate-700 placeholder-slate-400'
            : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
          }`}
        />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-x-4 lg:gap-y-3">
        <div>
          <label className={labelClass(theme)}>Filtro por Doctor</label>
          <select value={filtroDoctor} onChange={e => setFiltroDoctor(sanitizeString(e.target.value))} className={inputClass(theme)}>
            <option value="todos">Todos los doctores</option>
            {doctoresUnicos.map(doctor => (
              <option key={doctor.id} value={doctor.id}>Dr. {doctor.nombre} {doctor.apellido}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass(theme)}>Filtro por Código de Operación</label>
          <select value={filtroCodigoOperacion} onChange={e => setFiltroCodigoOperacion(sanitizeString(e.target.value))} className={inputClass(theme)}>
            <option value="todos">Todos los códigos</option>
            {codigosUnicos.map(codigo => {
              const codigoObj = codigosOperaciones.find(c => c.codigo === codigo)
              return <option key={codigo} value={codigo}>{codigo} - {codigoObj?.nombre || codigo}</option>
            })}
          </select>
        </div>

        <div>
          <label className={labelClass(theme)}>Filtro por Previsión</label>
          <select value={filtroPrevision} onChange={e => setFiltroPrevision(sanitizeString(e.target.value))} className={inputClass(theme)}>
            <option value="todas">Todas las previsiones</option>
            {PREVISION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass(theme)}>Filtro por Estado</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(sanitizeString(e.target.value))} className={inputClass(theme)}>
            <option value="todas">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aceptada">Aceptadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>

        <div>
          <label className={labelClass(theme)}>Fecha desde</label>
          <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} className={inputClass(theme)} />
        </div>

        <div>
          <label className={labelClass(theme)}>Fecha hasta</label>
          <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} className={inputClass(theme)} />
        </div>
      </div>

      {/* Contador */}
      {hayFiltros && (
        <div className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Mostrando {solicitudesFiltradas.length} de {solicitudes.length} solicitudes
        </div>
      )}

      {/* Chips de estado */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {[
          { value: 'todas', label: 'Todas', count: solicitudes.length },
          { value: 'pendiente', label: 'Pendientes', count: solicitudes.filter(s => s.estado === 'pendiente').length },
          { value: 'aceptada', label: 'Aceptadas', count: solicitudes.filter(s => s.estado === 'aceptada').length },
        ].map(filtro => (
          <motion.button
            key={filtro.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFiltroEstado(filtro.value)}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 sm:gap-2 touch-manipulation active:scale-95 ${
              filtroEstado === filtro.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300'
            }`}
          >
            <span>{filtro.label}</span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
              filtroEstado === filtro.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {filtro.count}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
