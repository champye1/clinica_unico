import { useNavigate } from 'react-router-dom'
import { UserPlus, FileText, Calendar, CheckCircle2, ArrowRight, Stethoscope, Users } from 'lucide-react'

const PASOS = [
  {
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-700',
    titulo: '1. Reserva una hora',
    desc: 'Ve a "Reservar hora", ingresa los datos del paciente, el procedimiento y tu horario preferido. El pabellón recibirá la solicitud al instante.',
  },
  {
    icon: FileText,
    color: 'bg-indigo-100 text-indigo-700',
    titulo: '2. Sigue el estado',
    desc: 'En "Mis Solicitudes" puedes ver si tu cirugía fue aceptada, rechazada o necesita reagendamiento. Recibirás notificaciones automáticas.',
  },
  {
    icon: Calendar,
    color: 'bg-emerald-100 text-emerald-700',
    titulo: '3. Revisa tu calendario',
    desc: 'En "Mi Calendario" verás todas tus cirugías programadas con fecha, pabellón y horario. Puedes solicitar reagendamientos desde ahí.',
  },
  {
    icon: Users,
    color: 'bg-violet-100 text-violet-700',
    titulo: '4. Gestiona tus pacientes',
    desc: 'En "Mis Pacientes" tienes el historial completo de cirugías por paciente, con fechas y procedimientos realizados.',
  },
]

export default function OnboardingMedico({ doctorNombre, onComplete }) {
  const navigate = useNavigate()

  const handleEmpezar = (ruta) => {
    localStorage.setItem('onboarding_medico_completed', '1')
    onComplete()
    if (ruta) navigate(ruta)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-7 text-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Bienvenido al sistema</p>
              <h2 className="text-2xl font-black">
                {doctorNombre ? `¡Hola, ${doctorNombre}!` : '¡Bienvenido!'}
              </h2>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Este es tu portal de gestión quirúrgica. Aquí puedes solicitar cirugías, ver tu calendario y seguir el estado de cada procedimiento.
          </p>
        </div>

        {/* Steps */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
          {PASOS.map((paso) => {
            const Icon = paso.icon
            return (
              <div key={paso.titulo} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${paso.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">{paso.titulo}</p>
                  <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{paso.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="px-8 pb-7 pt-4 border-t border-slate-100 flex-shrink-0 space-y-2">
          <button
            onClick={() => handleEmpezar('/doctor/paciente')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Crear mi primera solicitud
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEmpezar(null)}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold py-1 transition-colors"
          >
            Ir al dashboard primero
          </button>
        </div>
      </div>
    </div>
  )
}
