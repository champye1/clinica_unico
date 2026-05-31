import { Sun, Moon, Activity } from 'lucide-react'
import Modal from '../../components/common/Modal'

const THEME_OPTIONS = [
  {
    key: 'light',
    icon: Sun,
    label: 'Claro',
    sub: 'Estándar',
    desc: 'Ideal para trabajo diurno',
    iconClass: 'bg-white border-slate-300',
    iconColor: 'text-yellow-500',
    swatches: ['bg-white border-slate-200', 'bg-slate-100 border-slate-200', 'bg-blue-100 border-blue-200'],
  },
  {
    key: 'dark',
    icon: Moon,
    label: 'Oscuro',
    sub: 'Blanco y Negro',
    desc: 'Reduce la fatiga visual',
    iconClass: 'bg-slate-900 border-slate-700',
    iconColor: 'text-slate-300',
    swatches: ['bg-slate-900 border-slate-800', 'bg-slate-800 border-slate-700', 'bg-slate-700 border-slate-600'],
  },
  {
    key: 'medical',
    icon: Activity,
    label: 'Médico',
    sub: 'Clínico',
    desc: 'Para entornos clínicos',
    iconClass: 'bg-blue-600 border-blue-700',
    iconColor: 'text-white',
    swatches: ['bg-blue-600 border-blue-700', 'bg-blue-50 border-blue-200', 'bg-white border-blue-100'],
  },
]

export default function ThemeModal({ isOpen, onClose, theme, changeTheme }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración de Tema">
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-bold text-blue-900 mb-1">Personaliza la apariencia</p>
          <p className="text-xs text-blue-700">El tema se guardará automáticamente.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {THEME_OPTIONS.map(({ key, icon: Icon, label, sub, desc, iconClass, iconColor, swatches }) => (
            <button
              key={key}
              onClick={() => { changeTheme(key); onClose() }}
              className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all text-left hover:shadow-lg ${theme === key ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2 ${iconClass}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase">{label}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">{sub}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-3">{desc}</p>
              <div className="flex gap-1">
                {swatches.map((s, i) => <div key={i} className={`w-6 h-6 rounded border ${s}`} />)}
              </div>
              {theme === key && <div className="mt-3 text-xs font-bold text-blue-600 uppercase">Activo</div>}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
