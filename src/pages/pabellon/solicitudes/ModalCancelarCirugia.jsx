import { AlertCircle } from 'lucide-react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'

export default function ModalCancelarCirugia({ isOpen, onClose, solicitud, onConfirmar, isPending }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar cirugía programada">
      {solicitud && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-sm text-amber-800 font-semibold">
              La cirugía de{' '}
              <strong>{solicitud.patients?.nombre} {solicitud.patients?.apellido}</strong>{' '}
              volverá a estado <strong>pendiente</strong> y el médico podrá solicitar una nueva fecha.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>Volver</Button>
            <Button onClick={onConfirmar} loading={isPending} className="bg-slate-700 hover:bg-slate-800">
              Sí, cancelar cirugía
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
