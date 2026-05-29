import { Package } from 'lucide-react'
import { sanitizeNumber } from '../../../utils/sanitizeInput'
import SearchableSelect from '../../../components/SearchableSelect'

export default function SeccionInsumos({
  formData,
  theme,
  insumoSeleccionado,
  setInsumoSeleccionado,
  cantidadInsumo,
  setCantidadInsumo,
  insumosDisponibles,
  packData,
  grupoFonasa,
  onAgregar,
  onEliminar,
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Insumos Requeridos
      </h2>
      {formData.codigo_operacion && packData?.packItems?.length > 0 && (
        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Los insumos del pack para esta operación se han añadido automáticamente. Los recomendados aparecen primero en la lista.
        </p>
      )}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <SearchableSelect
            options={insumosDisponibles}
            value={insumoSeleccionado}
            onChange={(id) => setInsumoSeleccionado(id)}
            placeholder={grupoFonasa ? `Insumos para esta cirugía (grupo ${grupoFonasa})` : 'Primero elija código de operación'}
            valueKey="id"
            displayFormat={(insumo) => `${insumo.codigo} - ${insumo.nombre}`}
          />
        </div>
        <input
          type="number"
          value={cantidadInsumo}
          onChange={(e) => setCantidadInsumo(parseInt(sanitizeNumber(e.target.value)) || 1)}
          className="input-field w-24"
          min="1"
          placeholder="Cant."
        />
        <button
          type="button"
          onClick={onAgregar}
          className="btn-secondary"
          disabled={!insumoSeleccionado}
        >
          Agregar
        </button>
      </div>

      {formData.insumos.length > 0 && (
        <div className={`border rounded-lg p-4 space-y-2 ${theme === 'dark' ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200'}`}>
          {formData.insumos.map((insumo) => (
            <div
              key={insumo.supply_id}
              className={`flex justify-between items-center p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-gray-50 text-gray-900'}`}
            >
              <span className="font-medium">
                {insumo.nombre} ({insumo.codigo}) - Cantidad: {insumo.cantidad}
              </span>
              <button
                type="button"
                onClick={() => onEliminar(insumo.supply_id)}
                className={theme === 'dark' ? 'text-red-400 hover:text-red-300 font-semibold' : 'text-red-600 hover:text-red-800 font-semibold'}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
