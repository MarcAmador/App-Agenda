import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Lock, Mail, CheckCircle2, Globe } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
                Política de Privacidad
              </h1>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                Última actualización: 20 de septiembre de 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-base-content/80 leading-relaxed">
            En <strong>AgendaPro</strong> (en adelante, &quot;la Plataforma&quot;), valoramos y protegemos la privacidad de nuestros usuarios y comunidades académicas. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y salvaguardamos su información personal al utilizar nuestra aplicación de productividad pedagógica y gestión de agenda.
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-3xl p-6 sm:p-10 space-y-8 text-sm text-base-content/80 leading-relaxed">
          
          {/* 1. Información que recopilamos */}
          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Información que Recopilamos
            </h2>
            <p className="mb-3">
              Para brindar nuestros servicios de gestión pedagógica y recordatorios, recopilamos los siguientes datos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-base-content/70">
              <li><strong>Datos de Cuenta y Perfil:</strong> Nombre completo, dirección de correo electrónico institucional o personal, foto de perfil pública (proporcionada mediante Google Sign-In o registro directo).</li>
              <li><strong>Gestión de Tareas y Agenda:</strong> Títulos de actividades, descripciones, fechas de entrega, prioridades pedagógicas de Eisenhower, categorías, enlaces a materiales educativos y estados de cumplimiento.</li>
              <li><strong>Preferencias de Notificación:</strong> Canales seleccionados (correo electrónico, WhatsApp Web, notificaciones del sistema) y horarios personalizados para resúmenes diarios o semanales.</li>
            </ul>
          </section>

          {/* 2. Cláusula de Cumplimiento de Google API & Limited Use */}
          <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-primary" />
              2. Divulgación de Datos de Usuario de las APIs de Google
            </h2>
            <div className="space-y-3 text-base-content/90">
              <p>
                <strong>Cumplimiento de la Política de Uso Limitado (Limited Use Requirements):</strong>
              </p>
              <p className="italic bg-base-100 p-3 rounded-xl border border-primary/20 text-xs sm:text-sm">
                El uso y la transferencia a cualquier otra aplicación de la información recibida de las APIs de Google por parte de AgendaPro se apegan estrictamente a la{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold underline"
                >
                  Política de Datos del Usuario de los Servicios de las APIs de Google
                </a>
                , incluidos los requisitos de Uso Limitado (Limited Use Requirements).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-base-content/80">
                <li><strong>Propósito Estricto:</strong> Las credenciales y permisos de la API de Gmail se utilizan exclusivamente para enviar notificaciones transaccionales, alertas de vencimiento de actividades académicas y resúmenes diarios/semanales solicitados expresamente por el usuario o administrador.</li>
                <li><strong>No Publicidad:</strong> Los datos obtenidos mediante las APIs de Google nunca se transfieren a terceros para publicidad basada en intereses, retargeting ni intermediación comercial.</li>
                <li><strong>No Entrenamiento de Modelos IA:</strong> Sus correos, nombres o contenidos de tareas no se utilizan para entrenar modelos generalizados de inteligencia artificial ni aprendizaje automático.</li>
                <li><strong>No Acceso Humano:</strong> Ningún empleado o desarrollador de AgendaPro lee sus correos o contenidos a menos que usted lo solicite explícitamente para soporte técnico o sea requerido por ley.</li>
              </ul>
            </div>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Finalidad del Tratamiento de Datos
            </h2>
            <p className="mb-2">Utilizamos la información recopilada para:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-base-200/50 border border-base-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs">Organizar y clasificar actividades docentes en la matriz de Eisenhower.</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/50 border border-base-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs">Despachar recordatorios de clases, evaluaciones y reuniones en el horario elegido.</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/50 border border-base-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs">Sincronizar el estado de tareas entre dispositivos en tiempo real.</span>
              </div>
              <div className="p-3 rounded-xl bg-base-200/50 border border-base-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-xs">Proteger la seguridad y autenticidad de las sesiones de usuario.</span>
              </div>
            </div>
          </section>

          {/* 4. Seguridad y Almacenamiento */}
          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Almacenamiento y Seguridad
            </h2>
            <p>
              Toda la comunicación entre su navegador y nuestros servidores se realiza mediante cifrado TLS/HTTPS de grado bancario. Las credenciales confidenciales (como refresh tokens y contraseñas de aplicación) se almacenan cifradas en reposo dentro de nuestra infraestructura gestionada en Supabase (PostgreSQL). Implementamos políticas de Row Level Security (RLS) para asegurar que cada docente únicamente tenga acceso a sus propias tareas y registros.
            </p>
          </section>

          {/* 5. Control del Usuario y Derechos de Eliminación */}
          <section>
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">5</span>
              Sus Derechos y Control de Información
            </h2>
            <p className="mb-2">
              Usted mantiene el control absoluto sobre sus datos personales:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-base-content/70">
              <li><strong>Acceso y Modificación:</strong> Puede ver y editar sus datos personales y preferencias en cualquier momento desde la sección de Configuración.</li>
              <li><strong>Revocación de Permisos Google:</strong> Puede desvincular el acceso de AgendaPro a su cuenta de Google en cualquier momento visitando la sección de permisos de su cuenta en <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">Seguridad de Google</a>.</li>
              <li><strong>Eliminación de Cuenta:</strong> Puede solicitar el borrado permanente de su cuenta y todas las tareas asociadas contactándonos directamente.</li>
            </ul>
          </section>

          {/* 6. Contacto */}
          <section className="border-t border-base-200 pt-6">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              Contacto y Soporte
            </h2>
            <p className="text-base-content/70">
              Si tiene preguntas, inquietudes o solicitudes sobre esta Política de Privacidad o sobre el tratamiento de sus datos personales, puede ponerse en contacto con nuestro equipo de soporte:
            </p>
            <div className="mt-3 p-4 rounded-2xl bg-base-200 flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-base-content">Equipo de Privacidad y Soporte AgendaPro</p>
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
