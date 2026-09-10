import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { authService } from '@/services/auth.service'

// ─── Tipos del Context ────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, pass: string) => Promise<{ error: AuthError | null }>
  signUpWithPassword: (email: string, pass: string, fullName: string) => Promise<{ error: AuthError | null; data: any }>
  signOut: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  error: AuthError | null
}

// ─── Creación del Context ─────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Recupera la sesión activa al montar el provider (ej: después de recarga)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      let initialUser = session?.user ?? null
      const localName = localStorage.getItem('agendapro_custom_display_name')
      if (initialUser && localName) {
        initialUser = {
          ...initialUser,
          user_metadata: {
            ...initialUser.user_metadata,
            full_name: localName,
          },
        }
      }
      setUser(initialUser)
      setIsLoading(false)
    })

    // Suscripción al listener de cambios de estado de auth:
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      let initialUser = session?.user ?? null
      const localName = localStorage.getItem('agendapro_custom_display_name')
      if (initialUser && localName) {
        initialUser = {
          ...initialUser,
          user_metadata: {
            ...initialUser.user_metadata,
            full_name: localName,
          },
        }
      }
      setUser(initialUser)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Registrar inicio de sesión y auditar dispositivo
  useEffect(() => {
    if (session?.access_token && session?.user?.id) {
      const storageKey = `agendapro_dev_rec_${session.user.id}`
      const alreadyRecorded = sessionStorage.getItem(storageKey)
      if (!alreadyRecorded) {
        sessionStorage.setItem(storageKey, 'true')
        authService.recordLogin(session.access_token)
      }
    }
  }, [session?.access_token, session?.user?.id])

  /** Inicia el flujo OAuth de Google redirigiendo al proveedor de identidad */
  const signInWithGoogle = useCallback(async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    if (error) setError(error)
  }, [])

  /** Inicia sesión con correo y contraseña */
  const signInWithPassword = useCallback(async (email: string, pass: string) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    })
    if (error) {
      setError(error)
      return { error }
    }
    if (data.session) {
      setSession(data.session)
      setUser(data.user)
    }
    return { error: null }
  }, [])

  /** Registra un nuevo usuario con correo, contraseña y nombre completo */
  const signUpWithPassword = useCallback(async (email: string, pass: string, fullName: string) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
        },
      },
    })
    if (error) {
      setError(error)
      return { error, data: null }
    }
    if (data.session) {
      setSession(data.session)
      setUser(data.user)
    }
    return { error: null, data }
  }, [])

  /** Cierra la sesión y limpia el estado local */
  const signOut = useCallback(async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) setError(error)
  }, [])

  /** Actualiza el nombre del usuario tanto localmente como en Supabase Auth */
  const updateDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return

    // 1. Persistencia local inmediata
    localStorage.setItem('agendapro_custom_display_name', trimmed)

    // 2. Actualizar estado en memoria reactivamente
    setUser((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          full_name: trimmed,
        },
      }
    })

    // 3. Sincronizar en Supabase si hay conexión activa
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      })
      if (data?.user) {
        setUser(data.user)
      }
      if (error) {
        console.warn('[AuthContext] updateUser advertencia (usando copia local):', error.message)
      }
    } catch (err) {
      console.warn('[AuthContext] error de red al sincronizar con Supabase:', err)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    updateDisplayName,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de un componente hijo de `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
