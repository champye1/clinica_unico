import { Link } from 'react-router-dom'
import { Stethoscope, ArrowLeft } from 'lucide-react'

export default function TerminosUso() {
  const año = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">QuirúrgicaPro</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-slate-500 text-sm mb-10">Última actualización: {año}</p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Aceptación de los Términos</h2>
              <p>Al acceder y utilizar el sistema de gestión quirúrgica <strong>QuirúrgicaPro</strong> (en adelante "el Sistema"), el usuario acepta quedar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Sistema.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Descripción del Servicio</h2>
              <p>QuirúrgicaPro es un sistema de software para la gestión de pabellones quirúrgicos, agendamiento de cirugías, administración de médicos, control de insumos médicos y comunicación entre los distintos actores de una clínica quirúrgica privada.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Licencia de Uso</h2>
              <p>La clínica que adquiera una licencia de QuirúrgicaPro recibe el derecho no exclusivo, intransferible y limitado de usar el Sistema para sus operaciones internas. Queda expresamente prohibido:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Sublicenciar, vender, revender o transferir el Sistema a terceros.</li>
                <li>Realizar ingeniería inversa o intentar extraer el código fuente.</li>
                <li>Usar el Sistema para actividades ilegales o contrarias a la normativa sanitaria chilena.</li>
                <li>Compartir credenciales de acceso entre usuarios.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Datos Médicos y Confidencialidad</h2>
              <p>Los datos de pacientes, cirugías y personal médico ingresados al Sistema son propiedad exclusiva de la clínica. QuirúrgicaPro actúa como procesador de datos bajo la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> de Chile y sus modificaciones.</p>
              <p className="mt-2">El proveedor se compromete a:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>No divulgar ni ceder datos a terceros sin autorización expresa.</li>
                <li>Implementar medidas de seguridad técnicas adecuadas.</li>
                <li>Notificar al cliente en caso de brecha de seguridad en un plazo máximo de 72 horas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Disponibilidad del Sistema</h2>
              <p>El proveedor procurará mantener el Sistema disponible de forma continua, sin embargo no garantiza disponibilidad ininterrumpida. El Sistema puede estar sujeto a interrupciones por mantenimiento, actualizaciones o causas de fuerza mayor.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Limitación de Responsabilidad</h2>
              <p>QuirúrgicaPro es una herramienta de gestión y agendamiento. El proveedor no es responsable de decisiones médicas adoptadas por los profesionales de la salud usando el Sistema. La responsabilidad del proveedor se limita al valor del contrato vigente en el período en que ocurrió el daño.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Pagos y Facturación</h2>
              <p>El costo del servicio (licencia, implementación y soporte) se establece en el contrato de servicios suscrito entre las partes. Los pagos se realizarán según los plazos acordados. El incumplimiento de pago puede resultar en la suspensión del acceso al Sistema previa notificación de 15 días.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Soporte Técnico</h2>
              <p>El proveedor ofrecerá soporte técnico según el plan contratado. El soporte básico cubre fallas del Sistema durante horario hábil (lunes a viernes, 9:00–18:00 hrs). Los planes profesional y enterprise incluyen soporte extendido y tiempo de respuesta garantizado.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Modificaciones a los Términos</h2>
              <p>El proveedor se reserva el derecho de modificar estos Términos con previo aviso de 30 días por correo electrónico al administrador de la cuenta. El uso continuado del Sistema después de dicho plazo implica la aceptación de los nuevos términos.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Ley Aplicable y Jurisdicción</h2>
              <p>Estos Términos se rigen por las leyes de la <strong>República de Chile</strong>. Para cualquier controversia, las partes se someten a la jurisdicción de los Tribunales de Justicia de la ciudad de Valparaíso, Chile, renunciando a cualquier otro fuero o domicilio.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contacto</h2>
              <p>Para consultas sobre estos Términos, contactar a través del portal o al correo indicado en el contrato de servicios.</p>
              <p className="mt-2">
                Ver también:{' '}
                <Link to="/politica-privacidad" className="text-blue-600 hover:underline font-semibold">
                  Política de Privacidad
                </Link>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
            © {año} QuirúrgicaPro · Todos los derechos reservados · Chile
          </div>
        </div>
      </main>
    </div>
  )
}
