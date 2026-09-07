import { useAuth } from '@/context/AuthContext'
import { useLocation, Navigate } from 'react-router-dom'
import { Chrome, BookOpen, CalendarCheck, LayoutList } from 'lucide-react'

/**
 * Página de inicio de sesión con Google OAuth.
 * Redirige al dashboard si el usuario ya tiene sesión activa.
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading, signInWithGoogle, error } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  // Si ya hay sesión, redirigir al destino original
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const features = [
    { icon: LayoutList, label: 'Gestión de tareas con DataTable avanzado' },
    { icon: CalendarCheck, label: 'Vista de calendario mensual y semanal' },
    { icon: BookOpen, label: 'Matriz de prioridad Eisenhower integrada' },
  ]

  return (
    <div className="min-h-screen bg-base-100 flex">
      {/* Panel izquierdo: Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/90 to-secondary/80 flex-col justify-between p-12 relative overflow-hidden">
        {/* Círculos decorativos de fondo */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AgendaPro</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Tu agenda académica,
            <br />
            <span className="text-white/80">inteligente y organizada.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Gestiona todas tus actividades académicas con claridad, desde el planning diario hasta la planificación anual.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-white/90">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho: Formulario de Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="text-base-content font-bold text-xl tracking-tight">AgendaPro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-base-content mb-2">Bienvenido de nuevo</h2>
            <p className="text-base-content/60">
              Inicia sesión con tu cuenta de Google institucional para continuar.
            </p>
          </div>

          {/* Error de Auth */}
          {error && (
            <div className="alert alert-error mb-6 animate-fade-in">
              <span className="text-sm">{error.message}</span>
            </div>
          )}

          {/* Botón de Google */}
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="btn btn-outline w-full gap-3 h-12 text-base font-medium border-base-300 hover:bg-base-200 hover:border-base-300 transition-all duration-200"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-xs text-base-content/40 leading-relaxed">
            Al iniciar sesión, aceptas nuestros{' '}
            <a href="#" className="link link-primary">Términos de Servicio</a>
            {' '}y{' '}
            <a href="#" className="link link-primary">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
