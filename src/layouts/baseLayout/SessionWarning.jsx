import { supabase } from '../../config/supabase'
import Modal from '../../components/common/Modal'
import { Bell } from 'lucide-react'

export default function SessionWarning({
  showWarning,
  onCloseWarning,
  minutosRestantes,
  showExpired,
}) {
  const handleRenew = async () => {
    const { error } = await supabase.auth.refreshSession()
    if (!error) onCloseWarning()
  }

  const handleGoToLogin = async () => {
    const { clearAllAppData } = await import('../../utils/storageCleaner')
    clearAllAppData()
    window.location.href = '/'
  }

  return (
    <>
      <Modal isOpen={showWarning} onClose={onCloseWarning} title="Sesión por vencer">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Tu sesión expira pronto</p>
              <p className="text-sm text-amber-700 mt-1">
                {minutosRestantes != null && minutosRestantes > 0
                  ? `Quedan aproximadamente ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}.`
                  : 'Tu sesión está a punto de expirar.'}{' '}
                Guarda tu trabajo para no perder cambios.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRenew} className="btn-primary flex-1">Renovar sesión</button>
            <button onClick={onCloseWarning} className="btn-secondary flex-1">Cerrar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExpired} onClose={() => {}} title="Sesión expirada" hideClose>
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <Bell className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Tu sesión ha expirado</p>
              <p className="text-sm text-red-700 mt-1">
                Por seguridad, la sesión fue cerrada automáticamente. Por favor, inicia sesión nuevamente para continuar.
              </p>
            </div>
          </div>
          <button onClick={handleGoToLogin} className="btn-primary w-full">
            Ir al inicio de sesión
          </button>
        </div>
      </Modal>
    </>
  )
}
