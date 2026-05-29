import { AlertCircle } from 'lucide-react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import { useTheme } from '../../../contexts/ThemeContext'

export default function ModalInsumosAlert({ isOpen, onClose, insumosConStockCero }) {
  const { theme } = useTheme()
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock insuficiente — no se puede gestionar">
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm text-red-800 font-bold">No hay stock suficiente para gestionar este cupo.</p>
            <p className="text-xs text-red-700 mt-1">Reponga los insumos en la sección de Insumos antes de continuar.</p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {insumosConStockCero.map(ins => (
            <li
              key={ins.nombre}
              className={`flex items-center justify-between text-sm font-medium px-3 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
              }`}
            >
              <span>{ins.nombre} {ins.codigo ? `(${ins.codigo})` : ''}</span>
              <span className="text-xs font-bold shrink-0 ml-3">
                Disponible: <span className="text-red-600">{ins.stock_actual}</span> / Requerido:{' '}
                <span className="font-black">{ins.requerido}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex gap-3 justify-end">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </div>
    </Modal>
  )
}
