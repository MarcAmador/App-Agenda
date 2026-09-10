import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { authService } from '@/services/auth.service'
import {
  Chrome,
  BookOpen,
  CalendarCheck,
  LayoutList,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react'

/**
 * Página de autenticación con múltiple modalidad:
 * 1. Google OAuth institucional
 * 2. Registro e inicio de sesión con Correo y Contraseña Hasheada (Supabase Auth)
 * 3. Recuperación de contraseña (exclusiva para cuentas con correo)
 * 4. Actualización / Restablecimiento seguro de nueva contraseña
 */
export default function LoginPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    error: authError,
  } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null)

  // Detectar si la URL trae ?mode=reset-password o ?mode=forgot-password
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlMode = params.get('mode')
    if (urlMode === 'reset-password' || urlMode === 'forgot-password') {
      setMode(urlMode)
    }
  }, [location.search])

  // Si ya hay sesión activa y NO estamos restableciendo contraseña, redirigir al destino original
  if (!authLoading && isAuthenticated && mode !== 'reset-password') {
    return <Navigate to={from} replace />
  }

  const features = [
    { icon: LayoutList, label: 'Gestión de tareas con DataTable avanzado' },
    { icon: CalendarCheck, label: 'Vista de calendario mensual y semanal' },
    { icon: BookOpen, label: 'Matriz de prioridad Eisenhower integrada' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setRegisterSuccessMsg(null)

    // ─── Modo: Olvido de contraseña ─────────────────────────────────────────
    if (mode === 'forgot-password') {
      if (!email.trim()) {
        setLocalError('Por favor ingresa tu correo electrónico.')
        return
      }
      setFormLoading(true)
      try {
        const res = await authService.requestPasswordReset(email)
        setRegisterSuccessMsg(res.message)
      } catch (err: any) {
        setLocalError(err.message || 'Error al solicitar recuperación.')
      } finally {
        setFormLoading(false)
      }
      return
    }

    // ─── Modo: Restablecimiento de nueva contraseña ─────────────────────────
    if (mode === 'reset-password') {
      if (password.length < 6) {
        setLocalError('La nueva contraseña debe contener al menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden. Verifícalas cuidadosamente.')
        return
      }
      setFormLoading(true)
      try {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          setLocalError(error.message)
        } else {
          setRegisterSuccessMsg('¡Contraseña actualizada exitosamente! Entrando a tu agenda...')
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1500)
        }
      } catch (err: any) {
        setLocalError(err.message || 'Error actualizando la contraseña.')
      } finally {
        setFormLoading(false)
      }
      return
    }

    // ─── Modo: Login / Registro tradicional ────────────────────────────────
    if (!email.trim() || !password) {
      setLocalError('Por favor completa todos los campos requeridos.')
      return
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setLocalError('Ingresa tu nombre completo para tu perfil docente.')
        return
      }
      if (password.length < 6) {
        setLocalError('La contraseña debe contener al menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Las contraseñas no coinciden. Verifícalas cuidadosamente.')
        return
      }

      setFormLoading(true)
      try {
        const { error, data } = await signUpWithPassword(email, password, fullName)
        if (error) {
          setLocalError(error.message)
        } else if (data?.user && !data.session) {
          // Supabase requiere confirmación de email
          setRegisterSuccessMsg(
            '¡Cuenta creada con éxito! Se ha enviado un enlace de confirmación a tu correo. Por favor revísalo para activar tu acceso.'
          )
        } else {
          setRegisterSuccessMsg('¡Cuenta creada e iniciada exitosamente!')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setLocalError(msg)
      } finally {
        setFormLoading(false)
      }
    } else {
      // Modo Login
      setFormLoading(true)
      try {
        const { error } = await signInWithPassword(email, password)
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setLocalError('Correo o contraseña incorrectos. Verifica tus credenciales.')
          } else {
            setLocalError(error.message)
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        setLocalError(msg)
      } finally {
        setFormLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-base-100 flex font-sans">
      {/* ─── Panel Izquierdo: Branding y Presentación ─────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/95 via-primary to-secondary/90 flex-col justify-between p-12 relative overflow-hidden text-white shadow-2xl">
        {/* Elementos decorativos abstractos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-12">
            <img
              src="/logo.png"
              alt="AgendaPro"
              className="w-12 h-12 rounded-2xl shadow-lg border border-white/20 object-cover bg-white"
            />
            <div>
              <span className="text-white font-extrabold text-2xl tracking-tight block">AgendaPro</span>
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Gestión Académica</span>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-5">
            Tu agenda académica,
            <br />
            <span className="text-white/85">inteligente y organizada.</span>
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-lg">
            Coordina entregas, actividades y prioridades en una plataforma centralizada y diseñada para docentes de alto rendimiento.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3.5 text-white/90 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-white">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Panel Derecho: Formulario Autenticación ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in py-6">
          {/* Logo Móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img
              src="/logo.png"
              alt="AgendaPro"
              className="w-10 h-10 rounded-xl shadow-md border border-base-200 object-cover"
            />
            <div className="text-left">
              <span className="text-base-content font-extrabold text-xl tracking-tight block">AgendaPro</span>
              <span className="text-base-content/60 text-[10px] font-semibold uppercase tracking-wider">Gestión Académica</span>
            </div>
          </div>

          {/* Título dinámico */}
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight flex items-center gap-2">
              {mode === 'forgot-password' && <KeyRound className="w-7 h-7 text-primary" />}
              {mode === 'reset-password' && <Lock className="w-7 h-7 text-primary" />}
              {mode === 'login' && 'Bienvenido de nuevo'}
              {mode === 'register' && 'Crea tu cuenta'}
              {mode === 'forgot-password' && '¿Olvidaste tu contraseña?'}
              {mode === 'reset-password' && 'Restablece tu contraseña'}
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              {mode === 'login' && 'Ingresa tus credenciales para acceder a tus tareas y agenda.'}
              {mode === 'register' && 'Empieza a organizar tus actividades académicas en minutos.'}
              {mode === 'forgot-password' &&
                'Ingresa tu correo institucional. Si te registraste con correo, te enviaremos un enlace seguro de recuperación.'}
              {mode === 'reset-password' &&
                'Ingresa tu nueva clave de acceso para continuar organizando tus actividades.'}
            </p>
          </div>

          {/* Selector de Pestañas DaisyUI (Solo visible en Login o Registro) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="tabs tabs-boxed bg-base-200/70 p-1 rounded-2xl mb-6 grid grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setLocalError(null)
                  setRegisterSuccessMsg(null)
                }}
                className={`tab text-xs font-bold rounded-xl transition-all ${
                  mode === 'login' ? 'tab-active bg-base-100 text-base-content shadow-xs' : 'text-base-content/70'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register')
                  setLocalError(null)
                  setRegisterSuccessMsg(null)
                }}
                className={`tab text-xs font-bold rounded-xl transition-all ${
                  mode === 'register' ? 'tab-active bg-base-100 text-base-content shadow-xs' : 'text-base-content/70'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Registrarse
              </button>
            </div>
          )}

          {/* Mensajes de Alerta */}
          {(localError || authError) && (
            <div className="alert alert-error text-xs py-2.5 px-3.5 rounded-xl mb-5 shadow-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{localError || authError?.message}</span>
            </div>
          )}

          {registerSuccessMsg && (
            <div className="alert alert-success text-xs py-2.5 px-3.5 rounded-xl mb-5 shadow-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{registerSuccessMsg}</span>
            </div>
          )}

          {/* Botón de Google OAuth (Solo en login/register) */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={authLoading || formLoading}
                className="btn btn-outline w-full gap-2.5 h-11 text-xs font-bold border-base-300 hover:bg-base-200 hover:border-base-300 transition-all rounded-xl shadow-xs"
              >
                {authLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Chrome className="w-4 h-4 text-primary" />
                )}
                Continuar con Google
              </button>

              {/* Divisor DaisyUI */}
              <div className="divider text-[11px] uppercase tracking-wider text-base-content/40 font-bold my-5">
                o con correo y contraseña
              </div>
            </>
          )}

          {/* ── Formulario Dinámico Según el Modo ──────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Campo: Nombre Completo (solo en registro) */}
            {mode === 'register' && (
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Nombre Completo:</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Prof. Carlos Mendoza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Campo: Correo Electrónico (login, registro y forgot-password) */}
            {mode !== 'reset-password' && (
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Correo Electrónico:</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="docente@institucion.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Campo: Contraseña (login, register y reset-password) */}
            {mode !== 'forgot-password' && (
              <div className="form-control">
                <div className="flex items-center justify-between">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">
                      {mode === 'reset-password' ? 'Nueva Contraseña:' : 'Contraseña:'}
                    </span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password')
                        setLocalError(null)
                        setRegisterSuccessMsg(null)
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered input-sm w-full pl-9 pr-9 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn btn-ghost btn-xs btn-circle absolute right-1.5 top-1/2 -translate-y-1/2 text-base-content/50"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {(mode === 'register' || mode === 'reset-password') && (
                  <span className="text-[10px] text-base-content/50 mt-1">
                    Mínimo 6 caracteres.
                  </span>
                )}
              </div>
            )}

            {/* Campo: Confirmar Contraseña (register y reset-password) */}
            {(mode === 'register' || mode === 'reset-password') && (
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">
                    {mode === 'reset-password' ? 'Confirmar Nueva Contraseña:' : 'Confirmar Contraseña:'}
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading || authLoading}
              className="btn btn-primary w-full gap-2 text-xs font-bold rounded-xl mt-2 shadow-md shadow-primary/25"
            >
              {formLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarme con Correo</span>
                </>
              ) : mode === 'forgot-password' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Enlace de Recuperación</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Nueva Contraseña</span>
                </>
              )}
            </button>
          </form>

          {/* Selector inferior alternativo */}
          <div className="mt-6 text-center text-xs text-base-content/70">
            {mode === 'forgot-password' || mode === 'reset-password' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setLocalError(null)
                  setRegisterSuccessMsg(null)
                }}
                className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Iniciar Sesión
              </button>
            ) : mode === 'login' ? (
              <p>
                ¿Aún no tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setLocalError(null)
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setLocalError(null)
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-base-content/40 leading-relaxed">
            Al continuar, aceptas las políticas institucionales y términos de uso de{' '}
            <strong className="text-base-content/60">AgendaPro SaaS</strong>.
          </p>
        </div>
      </div>

    </div>
  )
}
