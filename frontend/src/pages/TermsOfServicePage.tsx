import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, Mail, Globe } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-base-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navegación superior */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="btn btn-ghost btn-sm rounded-xl gap-2 text-base-content/70 hover:text-base-content"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
          <span className="text-xs font-semibold text-base-content/50 uppercase tracking-widest">
            AgendaPro Legal
          </span>
        </div>

        {/* Encabezado */}
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-6 sm:p-10 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
                Términos y Condiciones de Servicio
              </h1>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                Última actualización: 20 de septiembre de 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">
            Bienvenido a <strong>AgendaPro</strong>. Al acceder o utilizar nuestra plataforma web y sus servicios relacionados de productividad académica, usted acepta cumplir y estar legalmente sujeto a los siguientes Términos y Condiciones.
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-base-content/80 leading-relaxed">
          
          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Uso Aceptable y Finalidad del Servicio
            </h2>
            <p>
              AgendaPro es una herramienta concebida para la gestión pedagógica, organización docente y seguimiento de tareas mediante la matriz de Eisenhower. Los usuarios se comprometen a utilizar la plataforma de acuerdo con la ley, la ética educativa y las buenas costumbres, absteniéndose de introducir malware o saturar intencionalmente los servicios de mensajería y notificación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              Cuentas de Usuario y Seguridad
            </h2>
            <p>
              Usted es responsable de salvaguardar la confidencialidad de sus credenciales de acceso (correo, contraseña y sesiones iniciadas con Google). Cualquier actividad realizada bajo su cuenta se considerará efectuada por usted. Notifíquenos de inmediato en caso de detectar cualquier uso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Integración con Servicios de Terceros (Google & APIs)
            </h2>
            <p>
              Nuestra plataforma se integra con las APIs de Google (Google Sign-In y Gmail API) para autenticación y despacho de recordatorios programados. El uso de estos servicios externos está sujeto a los términos aplicables de cada proveedor y a nuestra <Link to="/privacidad" className="text-primary font-bold underline">Política de Privacidad</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Disponibilidad y Modificaciones
            </h2>
            <p>
              Nos esforzamos por garantizar una disponibilidad continua y de alta velocidad en la plataforma. Sin embargo, no podemos asegurar que el servicio sea ininterrumpido en caso de tareas de mantenimiento o fallos de conectividad fuera de nuestro control razonable. Nos reservamos el derecho de mejorar o actualizar funciones para optimizar la experiencia de los usuarios.
            </p>
          </section>

          <section className="border-t border-base-200 pt-6">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              Contacto Legal
            </h2>
            <p className="text-base-content/70">
              Para resolver dudas relativas a estos términos de uso:
            </p>
            <div className="mt-3 p-4 rounded-2xl bg-base-200 flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-base-content">AgendaPro SaaS Legal & Soporte</p>
                <p className="text-xs text-primary font-mono mt-0.5">alertas.agendapro@gmail.com</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-base-content/50">
          <p>© {new Date().getFullYear()} AgendaPro SaaS. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link to="/terminos" className="hover:underline text-primary">Términos de Servicio</Link>
            <span>·</span>
            <Link to="/privacidad" className="hover:underline text-primary">Política de Privacidad</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
