import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ModalBulkRechazar({ isOpen, onClose, seleccionados, solicitudesFiltradas, motivoBulk, setMotivoBulk, onConfirmar, isPending }) {
  const { theme } = useTheme()
  const afectadas = solicitudesFiltradas.filter(s => seleccionados.has(s.id))
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rechazar ${seleccionados.size} solicitudes`}>
      <div className="space-y-4">
        <div className={`rounded-xl border px-4 py-3 ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
            Se rechazarán {seleccionados.size} solicitud{seleccionados.size !== 1 ? 'es' : ''}:
          </p>
          <ul className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
            {afectadas.map(s => (
              <li key={s.id} className={`text-xs font-medium flex items-center justify-between ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>
                <span>{s.patients?.nombre} {s.patients?.apellido}</span>
                <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                  Dr. {s.doctors?.apellido}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="label-field">Motivo del rechazo (opcional)</label>
          <textarea
            value={motivoBulk}
            onChange={e => setMotivoBulk(e.target.value)}
            rows={3}
            maxLength={500}
            className="input-field resize-none"
            placeholder="Motivo para todas las solicitudes seleccionadas..."
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirmar} loading={isPending} className="bg-red-600 hover:bg-red-700">
            Confirmar rechazo masivo
          </Button>
        </div>
      </div>
    </Modal>
  )
}
