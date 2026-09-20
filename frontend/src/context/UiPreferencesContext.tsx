import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

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
  // Calendario
  showCalendarKpis: boolean
  showCalendarQuickNav: boolean
  // Matriz
  showMatrixKpis: boolean
  showMatrixQuickNav: boolean
  // Modal de Tarea
  showNewTaskTemplates: boolean
  showNewTaskAI: boolean
  // Archivo y Sistema
  autoArchiveCompleted: boolean
  enableTour: boolean
}

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
    showCalendarKpis: false,
    showCalendarQuickNav: false,
    showMatrixKpis: false,
    showMatrixQuickNav: false,
    showNewTaskTemplates: false,
    showNewTaskAI: false,
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
    showCalendarKpis: true,
    showCalendarQuickNav: true,
    showMatrixKpis: true,
    showMatrixQuickNav: true,
    showNewTaskTemplates: true,
    showNewTaskAI: true,
    autoArchiveCompleted: false,
    enableTour: true,
  },
}

interface UiPreferencesContextValue {
  preferences: UiPreferences
  setMode: (mode: 'basico' | 'avanzado') => void
  togglePreference: (key: keyof Omit<UiPreferences, 'mode'>) => void
  setPreference: <K extends keyof Omit<UiPreferences, 'mode'>>(key: K, value: UiPreferences[K]) => void
  resetToDefaults: () => void
}

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null)

export function UiPreferencesProvider({ children }: { children: ReactNode }) {
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

  const togglePreference = useCallback((key: keyof Omit<UiPreferences, 'mode'>) => {
    setPreferences((prev) => ({
      ...prev,
      mode: 'personalizado',
      [key]: !prev[key],
    }))
  }, [])

  const setPreference = useCallback(
    <K extends keyof Omit<UiPreferences, 'mode'>>(key: K, value: UiPreferences[K]) => {
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

  return (
    <UiPreferencesContext.Provider
      value={{
        preferences,
        setMode,
        togglePreference,
        setPreference,
        resetToDefaults,
      }}
    >
      {children}
    </UiPreferencesContext.Provider>
  )
}

export function useUiPreferences() {
  const ctx = useContext(UiPreferencesContext)
  if (!ctx) {
    // Si se usa fuera del Provider, entregar defaults sin romper
    return {
      preferences: PRESETS.avanzado,
      setMode: () => {},
      togglePreference: () => {},
      setPreference: () => {},
      resetToDefaults: () => {},
    }
  }
  return ctx
}
