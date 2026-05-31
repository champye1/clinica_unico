import { CheckCircle2, XCircle, Edit, Trash2, Palmtree, UserCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatRut } from '../../../utils/rutFormatter'
import Pagination from '../../../components/common/Pagination'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import { TableBodySkeleton } from '../../../components/common/Skeleton'

const SORT_COLUMNS = [
  { field: 'nombre', label: 'Nombre' },
  { field: 'rut', label: 'RUT' },
  { field: 'email', label: 'Correo' },
  { field: 'especialidad', label: 'Especialidad' },
  { field: 'estado', label: 'Estado' },
]

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

function getEstadoBadge(estado, theme) {
  if (theme === 'dark') {
    return estado === 'activo' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'
  }
  return estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
}

export default function MedicosTable({
  isLoading,
  medicosFiltrados,
  medicosPaginados,
  busqueda,
  filtroEspecialidad,
  filtroEstado,
  theme,
  sortField,
  sortDir,
  handleSort,
  cirugiasSemanaPorDoctor,
  iniciarEdicion,
  toggleAccesoWeb,
  toggleEstado,
  eliminarMedico,
  handleEliminar,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}) {
  const isDark = theme === 'dark'
  const thText = isDark ? 'text-slate-200' : 'text-gray-700'
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200'

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${borderColor}`}>
              {SORT_COLUMNS.map(({ field, label }) => (
                <th key={field} className={`text-left py-3 px-4 font-medium ${thText}`}>
                  <button
                    onClick={() => handleSort(field)}
                    className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors"
                    aria-label={`Ordenar por ${label}`}
                  >
                    {label}
                    <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                  </button>
                </th>
              ))}
              <th className={`text-left py-3 px-4 font-medium ${thText}`}>Esta sem.</th>
              <th className={`text-left py-3 px-4 font-medium ${thText}`}>Acceso Web</th>
              <th className={`text-left py-3 px-4 font-medium ${thText}`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableBodySkeleton rows={6} cols={SORT_COLUMNS.length + 3} />
            ) : medicosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={SORT_COLUMNS.length + 3} className={`text-center py-8 ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                  {busqueda || filtroEspecialidad || filtroEstado
                    ? 'No se encontraron médicos con los filtros aplicados'
                    : 'No hay médicos registrados'}
                </td>
              </tr>
            ) : (
              medicosPaginados.map(medico => (
                <tr
                  key={medico.id}
                  className={`border-b transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {medico.nombre} {medico.apellido}
                  </td>
                  <td className={`py-3 px-4 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>{formatRut(medico.rut)}</td>
                  <td className={`py-3 px-4 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>{(medico.email || '').toLowerCase()}</td>
                  <td className={`py-3 px-4 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>
                    {medico.especialidad.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getEstadoBadge(medico.estado, theme)}`}>
                      {medico.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {cirugiasSemanaPorDoctor[medico.id] > 0 ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {cirugiasSemanaPorDoctor[medico.id]}
                      </span>
                    ) : (
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {medico.acceso_web_enabled ? (
                      <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    ) : (
                      <XCircle className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => iniciarEdicion(medico)}
                        className={`p-2 rounded transition-colors ${
                          isDark
                            ? 'text-blue-400 hover:bg-blue-900/30 hover:text-blue-300'
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Editar médico"
                        aria-label="Editar médico"
                      >
                        <Edit className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => toggleAccesoWeb.mutate({ id: medico.id, acceso_web_enabled: !medico.acceso_web_enabled })}
                        className={`p-2 rounded transition-colors ${
                          isDark
                            ? 'text-green-400 hover:bg-green-900/30 hover:text-green-300'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={medico.acceso_web_enabled ? 'Deshabilitar acceso web' : 'Habilitar acceso web'}
                        aria-label={medico.acceso_web_enabled ? 'Deshabilitar acceso web' : 'Habilitar acceso web'}
                        disabled={toggleAccesoWeb.isPending}
                      >
                        {toggleAccesoWeb.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : medico.acceso_web_enabled ? (
                          <XCircle className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleEstado.mutate({ id: medico.id, estado: medico.estado })}
                        className={`p-2 rounded transition-colors ${
                          medico.estado === 'activo'
                            ? isDark
                              ? 'text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300'
                              : 'text-yellow-600 hover:bg-yellow-50'
                            : isDark
                              ? 'text-blue-400 hover:bg-blue-900/30 hover:text-blue-300'
                              : 'text-blue-600 hover:bg-blue-50'
                        }`}
                        title={medico.estado === 'activo' ? 'Poner en vacaciones' : 'Activar médico'}
                        aria-label={medico.estado === 'activo' ? 'Poner en vacaciones' : 'Activar médico'}
                        disabled={toggleEstado.isPending}
                      >
                        {toggleEstado.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : medico.estado === 'activo' ? (
                          <Palmtree className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <UserCheck className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEliminar(medico)}
                        className={`p-2 rounded transition-colors ${
                          isDark
                            ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title="Eliminar médico"
                        aria-label="Eliminar médico"
                        disabled={eliminarMedico.isPending}
                      >
                        {eliminarMedico.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {medicosFiltrados.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={medicosFiltrados.length}
        />
      )}
    </div>
  )
}
