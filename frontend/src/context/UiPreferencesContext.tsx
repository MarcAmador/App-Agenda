import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { adminService } from '@/services/admin.service'

export type UiMode = 'basico' | 'avanzado' | 'personalizado'

export interface UiPreferences {
  mode: UiMode
  // Dashboard
  showDashboardWelcome: boolean
  showDashboardKpis: boolean
  showDashboardPriorityDistribution: boolean
  showDashboardUpcoming: boolean
  showDashboardQuickModules: boolean
  // Tareas
  showTasksKpis: boolean
  showTasksQuickNav: boolean
  showTasksViewSelector: boolean
  showTasksExport: boolean
  viewModeKanban: boolean
  viewModeCalendario: boolean
  viewModeMatriz: boolean
  // Calendario
  showCalendarKpis: boolean
  showCalendarQuickNav: boolean
  showCalendarFilters: boolean
  showCalendarWeekView: boolean
  // Matriz
  showMatrixKpis: boolean
  showMatrixQuickNav: boolean
  // Modal de Tarea
  showNewTaskTemplates: boolean
  showNewTaskAI: boolean
  showNewTaskResources: boolean
  showNewTaskParticipants: boolean
  showNewTaskMaterials: boolean
  // Archivo y Sistema
  autoArchiveCompleted: boolean
  enableTour: boolean
}

export type UiPreferenceKey = keyof Omit<UiPreferences, 'mode'>

const STORAGE_KEY = 'agendapro_ui_preferences'

const PRESETS: Record<'basico' | 'avanzado', UiPreferences> = {
  basico: {
    mode: 'basico',
    showDashboardWelcome: true,
    showDashboardKpis: true,
    showDashboardPriorityDistribution: false,
    showDashboardUpcoming: true,
    showDashboardQuickModules: false,
    showTasksKpis: false,
    showTasksQuickNav: false,
    showTasksViewSelector: true,
    showTasksExport: false,
    viewModeKanban: true,
    viewModeCalendario: true,
    viewModeMatriz: false,
    showCalendarKpis: false,
    showCalendarQuickNav: false,
    showCalendarFilters: false,
    showCalendarWeekView: false,
    showMatrixKpis: false,
    showMatrixQuickNav: false,
    showNewTaskTemplates: false,
    showNewTaskAI: false,
    showNewTaskResources: false,
    showNewTaskParticipants: false,
    showNewTaskMaterials: false,
    autoArchiveCompleted: true,
    enableTour: false,
  },
  avanzado: {
    mode: 'avanzado',
    showDashboardWelcome: true,
    showDashboardKpis: true,
    showDashboardPriorityDistribution: true,
    showDashboardUpcoming: true,
    showDashboardQuickModules: true,
    showTasksKpis: true,
    showTasksQuickNav: true,
    showTasksViewSelector: true,
    showTasksExport: true,
    viewModeKanban: true,
    viewModeCalendario: true,
    viewModeMatriz: true,
    showCalendarKpis: true,
    showCalendarQuickNav: true,
    showCalendarFilters: true,
    showCalendarWeekView: true,
    showMatrixKpis: true,
    showMatrixQuickNav: true,
    showNewTaskTemplates: true,
    showNewTaskAI: true,
    showNewTaskResources: true,
    showNewTaskParticipants: true,
    showNewTaskMaterials: true,
    autoArchiveCompleted: false,
    enableTour: true,
  },
}

interface UiPreferencesContextValue {
  preferences: UiPreferences
  superadminPermissions: Record<string, boolean>
  setMode: (mode: 'basico' | 'avanzado') => void
  togglePreference: (key: UiPreferenceKey) => void
  setPreference: <K extends UiPreferenceKey>(key: K, value: UiPreferences[K]) => void
  resetToDefaults: () => void
  /** Indica si el SuperAdmin permite a los usuarios acceder/activar este elemento */
  isFeatureAvailable: (key: UiPreferenceKey | string) => boolean
  /** Indica si el elemento está disponible por SuperAdmin Y activo por el usuario */
  isFeatureVisible: (key: UiPreferenceKey) => boolean
  refreshPermissions: () => Promise<void>
}

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null)

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
  const [superadminPermissions, setSuperadminPermissions] = useState<Record<string, boolean>>({})

  const [preferences, setPreferences] = useState<UiPreferences>(() => {
    if (typeof window === 'undefined') return PRESETS.avanzado
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return { ...PRESETS.avanzado, ...JSON.parse(saved) }
      }
    } catch {
      // fallback
    }
    return PRESETS.avanzado
  })

  const loadPermissions = useCallback(async () => {
    try {
      const publicSettings = await adminService.getPublicSettings()
      if (publicSettings.ui_feature_permissions) {
        setSuperadminPermissions(publicSettings.ui_feature_permissions)
      }
    } catch {
      // fallback
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (e) {
      console.warn('[UiPreferences] No se pudo persistir en localStorage:', e)
    }
  }, [preferences])

  const setMode = useCallback((mode: 'basico' | 'avanzado') => {
    setPreferences({ ...PRESETS[mode] })
  }, [])

  const togglePreference = useCallback((key: UiPreferenceKey) => {
    setPreferences((prev) => ({
      ...prev,
      mode: 'personalizado',
      [key]: !prev[key],
    }))
  }, [])

  const setPreference = useCallback(
    <K extends UiPreferenceKey>(key: K, value: UiPreferences[K]) => {
      setPreferences((prev) => ({
        ...prev,
        mode: 'personalizado',
        [key]: value,
      }))
    },
    []
  )

  const resetToDefaults = useCallback(() => {
    setPreferences(PRESETS.avanzado)
  }, [])

  const isFeatureAvailable = useCallback(
    (key: UiPreferenceKey | string): boolean => {
      // Si el SuperAdmin restringió explícitamente el elemento en false, no está disponible
      if (superadminPermissions[key] === false) return false
      return true
    },
    [superadminPermissions]
  )

  const isFeatureVisible = useCallback(
    (key: UiPreferenceKey): boolean => {
      // El elemento debe estar permitido por SuperAdmin Y encendido en las preferencias del usuario
      if (!isFeatureAvailable(key)) return false
      return Boolean(preferences[key])
    },
    [isFeatureAvailable, preferences]
  )

  return (
    <UiPreferencesContext.Provider
      value={{
        preferences,
        superadminPermissions,
        setMode,
        togglePreference,
        setPreference,
        resetToDefaults,
        isFeatureAvailable,
        isFeatureVisible,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </UiPreferencesContext.Provider>
  )
}

export function useUiPreferences() {
  const ctx = useContext(UiPreferencesContext)
  if (!ctx) {
    return {
      preferences: PRESETS.avanzado,
      superadminPermissions: {},
      setMode: () => {},
      togglePreference: () => {},
      setPreference: () => {},
      resetToDefaults: () => {},
      isFeatureAvailable: () => true,
      isFeatureVisible: (k: UiPreferenceKey) => PRESETS.avanzado[k],
      refreshPermissions: async () => {},
    }
  }
  return ctx
}
