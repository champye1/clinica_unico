import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'

export default function ModalCancelarCirugia({
  isOpen,
  onClose,
  cirugiaACancelar,
  pabellonNombre,
  onConfirmar,
  isPending,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Cancelación"
    >
      {cirugiaACancelar && (
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-lg sm:rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-slate-900 font-bold mb-2">
                ¿Está seguro de que desea cancelar esta cirugía?
              </p>
              <div className="text-xs sm:text-sm text-slate-700 space-y-1">
                <p><span className="font-bold">Paciente:</span> {cirugiaACancelar.patients?.nombre} {cirugiaACancelar.patients?.apellido}</p>
                <p><span className="font-bold">Doctor:</span> Dr. {cirugiaACancelar.doctors?.apellido || cirugiaACancelar.doctors?.nombre}</p>
                <p><span className="font-bold">Fecha:</span> {format(new Date(cirugiaACancelar.fecha), 'dd/MM/yyyy')}</p>
                <p><span className="font-bold">Horario:</span> {cirugiaACancelar.hora_inicio?.substring(0, 5)} - {cirugiaACancelar.hora_fin?.substring(0, 5)}</p>
                <p><span className="font-bold">Pabellón:</span> {pabellonNombre || 'N/A'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Esta acción no se puede deshacer. El doctor será notificado automáticamente de la cancelación.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
              className="w-full sm:w-auto touch-manipulation"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirmar}
              loading={isPending}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto touch-manipulation"
            >
              Confirmar Cancelación
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
