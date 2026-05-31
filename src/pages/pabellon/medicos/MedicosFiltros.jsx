import { Search } from 'lucide-react'
import { sanitizeString } from '../../../utils/sanitizeInput'

export default function MedicosFiltros({
  busqueda,
  setBusqueda,
  filtroEspecialidad,
  setFiltroEspecialidad,
  filtroEstado,
  setFiltroEstado,
  medicosFiltrados,
  medicos,
  especialidades,
}) {
  return (
    <div className="card">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(sanitizeString(e.target.value))}
            placeholder="Buscar por nombre, apellido, RUT o email..."
            className="input-field pl-10"
            aria-label="Buscar médicos"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field text-sm">Filtrar por Especialidad</label>
            <select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(sanitizeString(e.target.value))}
              className="input-field"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>
                  {esp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field text-sm">Filtrar por Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(sanitizeString(e.target.value))}
              className="input-field"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
        </div>
        {medicosFiltrados.length !== medicos.length && (
          <p className="text-sm text-gray-600">
            Mostrando {medicosFiltrados.length} de {medicos.length} médicos
          </p>
        )}
      </div>
    </div>
  )
}
