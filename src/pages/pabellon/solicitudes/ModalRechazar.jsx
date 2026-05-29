import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ModalRechazar({ isOpen, onClose, solicitud, motivoRechazo, setMotivoRechazo, onConfirmar, isPending }) {
  const { theme } = useTheme()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Rechazo">
      {solicitud && (
        <div className="space-y-5">
          <p className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>
            ¿Está seguro de que desea rechazar la solicitud de{' '}
            <span className="font-black">{solicitud.patients?.nombre} {solicitud.patients?.apellido}</span>?
          </p>
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Motivo del rechazo{' '}
              <span className={`font-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
                (opcional — el médico lo verá)
              </span>
            </label>
            <textarea
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ej: Sin disponibilidad esa semana, código de operación incorrecto, paciente sin exámenes pre-quirúrgicos..."
              className={`w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <p className={`text-xs mt-1 text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
              {motivoRechazo.length}/500
            </p>
          </div>
          <div className="flex gap-4 justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button onClick={onConfirmar} loading={isPending} disabled={isPending} className="bg-red-600 hover:bg-red-700">
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
