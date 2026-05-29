import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ModalCompletar({ isOpen, onClose, solicitud, notas, setNotas, onConfirmar, isPending }) {
  const { theme } = useTheme()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marcar cirugía como completada">
      {solicitud && (
        <div className="space-y-4">
          <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Paciente:{' '}
            <span className="font-black">{solicitud.patients?.nombre} {solicitud.patients?.apellido}</span>
          </p>
          <div>
            <label className="label-field">Notas post-operatorias (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              maxLength={1000}
              className="input-field resize-none"
              placeholder="Observaciones, complicaciones, notas del procedimiento..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={onConfirmar} loading={isPending} className="bg-green-600 hover:bg-green-700">
              Marcar como completada
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
