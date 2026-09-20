import {
  Layout,
  Sliders,
  Sparkles,
  Layers,
  Archive,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { useUiPreferences } from '@/context/UiPreferencesContext'
import toast from 'react-hot-toast'

interface ToggleItemProps {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
}

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
  return (
    <label className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-base-200/50 transition-colors cursor-pointer border border-transparent hover:border-base-200">
      <div className="space-y-0.5">
        <span className="text-sm font-semibold text-base-content block">{label}</span>
        {description && (
          <span className="text-xs text-base-content/60 block">{description}</span>
        )}
      </div>
      <input
        type="checkbox"
        className="toggle toggle-primary toggle-sm shrink-0"
        checked={checked}
        onChange={onChange}
      />
    </label>
  )
}

export function UiCustomizationSettings() {
  const { preferences, setMode, togglePreference, resetToDefaults } = useUiPreferences()

  const handleSetMode = (mode: 'basico' | 'avanzado') => {
    setMode(mode)
    toast.success(
      mode === 'basico'
        ? '🌿 Modo Básico activado: interfaz simplificada y sin distracciones.'
        : '🚀 Modo Avanzado activado: todos los paneles y métricas visibles.',
      { icon: mode === 'basico' ? '🌿' : '🚀' }
    )
  }

  const handleReset = () => {
    resetToDefaults()
    toast.success('Valores de interfaz restablecidos por defecto.')
  }

  return (
    <div
      id="tour-ui-customization"
      className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl overflow-hidden"
    >
      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-base-200 bg-gradient-to-r from-primary/5 via-base-100 to-secondary/5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                Personalización de Interfaz y Vistas
                {preferences.mode === 'basico' && (
                  <span className="badge badge-success badge-sm text-white font-bold">Modo Básico</span>
                )}
                {preferences.mode === 'avanzado' && (
                  <span className="badge badge-primary badge-sm font-bold">Modo Avanzado</span>
                )}
                {preferences.mode === 'personalizado' && (
                  <span className="badge badge-warning badge-sm font-bold">Personalizado</span>
                )}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                Adapta cada sección de la aplicación a tus preferencias docentes. Muestra sólo lo que usas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSetMode('basico')}
              className={`btn btn-sm rounded-xl text-xs gap-1.5 transition-all ${
                preferences.mode === 'basico'
                  ? 'btn-success text-white shadow-sm'
                  : 'btn-outline border-base-300 hover:btn-success hover:text-white'
              }`}
              title="Activar vista simplificada y minimalista"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Modo Básico</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetMode('avanzado')}
              className={`btn btn-sm rounded-xl text-xs gap-1.5 transition-all ${
                preferences.mode === 'avanzado'
                  ? 'btn-primary shadow-sm'
                  : 'btn-outline border-base-300 hover:btn-primary'
              }`}
              title="Mostrar todas las métricas, accesos y herramientas"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Avanzado</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm rounded-xl text-xs gap-1 text-base-content/60 hover:text-base-content"
              title="Restablecer a valores predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido de Secciones ──────────────────────────────────── */}
      <div className="p-6 space-y-6">
        {/* 1. Panel de Control (Dashboard) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Layout className="w-4 h-4 text-primary" />
            <span>Panel Principal (Dashboard)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            <ToggleItem
              label="Banner de Bienvenida"
              description="Mensaje motivacional y saludo según la hora del día"
              checked={preferences.showDashboardWelcome}
              onChange={() => togglePreference('showDashboardWelcome')}
            />
            <ToggleItem
              label="Métricas Principales (KPIs)"
              description="Tarjetas con Total, Tasa de cumplimiento, Pendientes y Vencidas"
              checked={preferences.showDashboardKpis}
              onChange={() => togglePreference('showDashboardKpis')}
            />
            <ToggleItem
              label="Distribución Eisenhower"
              description="Gráfica y desglose por los 4 cuadrantes de prioridad"
              checked={preferences.showDashboardPriorityDistribution}
              onChange={() => togglePreference('showDashboardPriorityDistribution')}
            />
            <ToggleItem
              label="Próximos Vencimientos"
              description="Listado de tareas urgentes con fecha límite cercana"
              checked={preferences.showDashboardUpcoming}
              onChange={() => togglePreference('showDashboardUpcoming')}
            />
            <ToggleItem
              label="Módulos Rápidos del Sistema"
              description="Accesos directos a Calendario, Matriz, Concentración y Reportes"
              checked={preferences.showDashboardQuickModules}
              onChange={() => togglePreference('showDashboardQuickModules')}
            />
          </div>
        </div>

        {/* 2. Módulos de Tareas, Calendario y Matriz */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Layers className="w-4 h-4 text-secondary" />
            <span>Vistas de Gestión (Tareas, Calendario y Matriz)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            <ToggleItem
              label="Módulo Tareas: Barra de KPIs"
              description="Contadores superiores en la vista general de tareas"
              checked={preferences.showTasksKpis}
              onChange={() => togglePreference('showTasksKpis')}
            />
            <ToggleItem
              label="Módulo Tareas: Accesos Rápidos de Vista"
              description="Selector para cambiar entre Lista, Calendario y Matriz"
              checked={preferences.showTasksQuickNav}
              onChange={() => togglePreference('showTasksQuickNav')}
            />
            <ToggleItem
              label="Módulo Calendario: Barra de KPIs"
              description="Resumen de horas y eventos programados en el mes"
              checked={preferences.showCalendarKpis}
              onChange={() => togglePreference('showCalendarKpis')}
            />
            <ToggleItem
              label="Módulo Calendario: Accesos Rápidos"
              description="Botones de cambio de vista en la cabecera del calendario"
              checked={preferences.showCalendarQuickNav}
              onChange={() => togglePreference('showCalendarQuickNav')}
            />
            <ToggleItem
              label="Matriz Eisenhower: Barra de KPIs"
              description="Contadores de urgencia e importancia en la cabecera"
              checked={preferences.showMatrixKpis}
              onChange={() => togglePreference('showMatrixKpis')}
            />
            <ToggleItem
              label="Matriz Eisenhower: Accesos Rápidos"
              description="Navegación directa a vista tabla y calendario"
              checked={preferences.showMatrixQuickNav}
              onChange={() => togglePreference('showMatrixQuickNav')}
            />
          </div>
        </div>

        {/* 3. Creación de Tareas y Automatizaciones */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Archive className="w-4 h-4 text-accent" />
            <span>Creación y Automatizaciones del Flujo Docente</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            <ToggleItem
              label="Sugerencia de Plantillas en Nueva Tarea"
              description="Banner con plantillas docentes rápidas al crear actividad"
              checked={preferences.showNewTaskTemplates}
              onChange={() => togglePreference('showNewTaskTemplates')}
            />
            <ToggleItem
              label="Asistente de Desglose con IA"
              description="Panel para dividir tareas complejas en pasos y sugerir materiales"
              checked={preferences.showNewTaskAI}
              onChange={() => togglePreference('showNewTaskAI')}
            />
            <ToggleItem
              label="Archivar Automáticamente Tareas Completadas"
              description="Ocultar automáticamente de las listas activas las tareas ya finalizadas"
              checked={preferences.autoArchiveCompleted}
              onChange={() => togglePreference('autoArchiveCompleted')}
            />
            <ToggleItem
              label="Habilitar Tour Guiado de Bienvenida"
              description="Permitir que el tour interactivo se ejecute al iniciar o ingresar"
              checked={preferences.enableTour}
              onChange={() => togglePreference('enableTour')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
