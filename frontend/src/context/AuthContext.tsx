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

const SUPER_ADMIN_EMAILS = [
  'ronaldo22amador@gmail.com',
  'marlon21ronaldo@gmail.com',
]

const getStorageDisplayNameKey = (userId: string) => `agendapro_custom_display_name_${userId}`

// ─── Tipos del Context ────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  role: 'super_admin' | 'admin' | 'user' | null
  isAdmin: boolean
  isSuperAdmin: boolean
  isLoadingRole: boolean
  refetchRole: () => Promise<void>
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
  const [role, setRole] = useState<'super_admin' | 'admin' | 'user' | null>(null)
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  const fetchUserRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setRole(null)
      setIsLoadingRole(false)
      return
    }

    const email = (currentUser.email || '').toLowerCase()
    if (SUPER_ADMIN_EMAILS.includes(email)) {
      setRole('super_admin')
      setIsLoadingRole(false)
      return
    }

    const metaRole = (currentUser.app_metadata?.role || currentUser.user_metadata?.role) as string | undefined
    if (metaRole === 'super_admin' || metaRole === 'admin') {
      setRole(metaRole)
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, status')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle<{ role: string; status: string }>()

      if (error) {
        console.warn('[AuthContext] Error consultando user_roles:', error.message)
      } else if (data && data.role) {
        setRole(data.role as 'super_admin' | 'admin' | 'user')
      } else if (!metaRole) {
        setRole('user')
      }
    } catch (err) {
      console.warn('[AuthContext] Excepción consultando user_roles:', err)
    } finally {
      setIsLoadingRole(false)
    }
  }, [])

  const decorateUserWithLocalName = (u: User | null): User | null => {
    if (!u) return null
    const localName = localStorage.getItem(getStorageDisplayNameKey(u.id)) || localStorage.getItem('agendapro_custom_display_name')
    if (localName) {
      return {
        ...u,
        user_metadata: {
          ...u.user_metadata,
          full_name: localName,
        },
      }
    }
    return u
  }

  useEffect(() => {
    // Recupera la sesión activa al montar el provider
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const initialUser = decorateUserWithLocalName(session?.user ?? null)
      setUser(initialUser)
      setIsLoading(false)
      if (initialUser) {
        fetchUserRole(initialUser)
      } else {
        setIsLoadingRole(false)
      }
    })

    // Suscripción al listener de cambios de estado de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const initialUser = decorateUserWithLocalName(session?.user ?? null)
      setUser(initialUser)
      setIsLoading(false)
      if (initialUser) {
        fetchUserRole(initialUser)
      } else {
        setRole(null)
        setIsLoadingRole(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserRole])

  // Suscripción en tiempo real a cambios en user_roles para el usuario actual
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`user_roles_sync:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUserRole(user)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchUserRole])

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
    if (user?.id) {
      localStorage.removeItem(getStorageDisplayNameKey(user.id))
      sessionStorage.removeItem(`agendapro_dev_rec_${user.id}`)
    }
    localStorage.removeItem('agendapro_custom_display_name')
    setRole(null)
    setUser(null)
    setSession(null)
    const { error } = await supabase.auth.signOut()
    if (error) setError(error)
  }, [user?.id])

  /** Actualiza el nombre del usuario tanto localmente como en Supabase Auth */
  const updateDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || !user) return

    // 1. Persistencia local inmediata con namespace de usuario
    localStorage.setItem(getStorageDisplayNameKey(user.id), trimmed)

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
  }, [user])

  const isSuperAdmin = role === 'super_admin' || SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '')
  const isAdmin = isSuperAdmin || role === 'admin'

  const refetchRole = useCallback(async () => {
    await fetchUserRole(user)
  }, [fetchUserRole, user])

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    role,
    isAdmin,
    isSuperAdmin,
    isLoadingRole,
    refetchRole,
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
