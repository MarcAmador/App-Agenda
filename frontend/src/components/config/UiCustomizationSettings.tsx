import {
  Layout,
  Sliders,
  Sparkles,
  Layers,
  Archive,
  RotateCcw,
  Zap,
  Lock,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import { useUiPreferences, type UiPreferenceKey } from '@/context/UiPreferencesContext'
import toast from 'react-hot-toast'

interface ToggleItemProps {
  label: string
  description?: string
  checked: boolean
  onChange: () => void
  lockedByAdmin?: boolean
}

function ToggleItem({ label, description, checked, onChange, lockedByAdmin }: ToggleItemProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 p-3 rounded-xl transition-colors border ${
        lockedByAdmin
          ? 'bg-base-200/40 border-dashed border-base-300 opacity-65 cursor-not-allowed'
          : 'hover:bg-base-200/50 cursor-pointer border-transparent hover:border-base-200'
      }`}
    >
      <div className="space-y-0.5 min-w-0 pr-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-base-content">{label}</span>
          {lockedByAdmin && (
            <span className="badge badge-xs badge-error/15 text-error border border-error/30 gap-1 font-bold">
              <Lock className="w-2.5 h-2.5" /> Restringido por SuperAdmin
            </span>
          )}
        </div>
        {description && (
          <span className="text-xs text-base-content/60 block">{description}</span>
        )}
      </div>
      <input
        type="checkbox"
        className="toggle toggle-primary toggle-sm shrink-0"
        checked={lockedByAdmin ? false : checked}
        onChange={onChange}
        disabled={lockedByAdmin}
      />
    </label>
  )
}

export function UiCustomizationSettings() {
  const { preferences, setMode, togglePreference, resetToDefaults, isFeatureAvailable } = useUiPreferences()

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

  const createToggle = (key: UiPreferenceKey, label: string, description?: string) => {
    return (
      <ToggleItem
        key={key}
        label={label}
        description={description}
        checked={preferences[key]}
        onChange={() => togglePreference(key)}
        lockedByAdmin={!isFeatureAvailable(key)}
      />
    )
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
                Adapta cada sección de la aplicación a tus preferencias. El SuperAdmin puede restringir módulos específicos.
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
            {createToggle('showDashboardWelcome', 'Banner de Bienvenida', 'Mensaje motivacional y saludo según la hora del día')}
            {createToggle('showDashboardKpis', 'Métricas Principales (KPIs)', 'Tarjetas con Total, Cumplimiento, Pendientes y Vencidas')}
            {createToggle('showDashboardPriorityDistribution', 'Distribución Eisenhower', 'Gráfica y desglose por los 4 cuadrantes de prioridad')}
            {createToggle('showDashboardUpcoming', 'Próximos Vencimientos', 'Listado de tareas urgentes con fecha límite cercana')}
            {createToggle('showDashboardQuickModules', 'Accesos Rápidos a Módulos', 'Atajos directos hacia Calendario, Matriz y Tareas')}
          </div>
        </div>

        {/* 2. Módulo de Tareas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <CheckSquare className="w-4 h-4 text-secondary" />
            <span>Módulo de Tareas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            {createToggle('showTasksKpis', 'Contadores y KPIs de Tareas', 'Barra superior con recuento de pendientes, en curso y vencidas')}
            {createToggle('showTasksQuickNav', 'Filtros Rápidos por Fecha', 'Botones de Hoy, Esta Semana y Este Mes')}
            {createToggle('showTasksViewSelector', 'Selector de Vistas', 'Permite alternar entre Tabla, Kanban, Calendario y Matriz')}
            {createToggle('showTasksExport', 'Exportación y Reportes', 'Botones para Reporte Ejecutivo en PDF y exportar en CSV')}
            {createToggle('viewModeKanban', 'Vista Tablero Kanban', 'Habilita la vista de columnas arrastrables')}
            {createToggle('viewModeCalendario', 'Vista Calendario Integrada', 'Habilita la pestaña de calendario dentro de tareas')}
            {createToggle('viewModeMatriz', 'Vista Matriz de Eisenhower', 'Habilita el visor de los 4 cuadrantes de prioridad')}
          </div>
        </div>

        {/* 3. Modal de Nueva Tarea */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Layers className="w-4 h-4 text-accent" />
            <span>Formulario y Creación de Tarea</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            {createToggle('showNewTaskTemplates', 'Plantillas Académicas Predefinidas', 'Acceso directo a modelos de exámenes, claustros y planeaciones')}
            {createToggle('showNewTaskAI', 'Desglose Inteligente con IA', 'Genera pasos automáticos y materiales sugeridos')}
            {createToggle('showNewTaskResources', 'Sección de Enlaces y Recursos', 'Adjuntar enlaces a Google Drive, Meet, Classroom o Zoom')}
            {createToggle('showNewTaskParticipants', 'Participantes y Colaboradores', 'Asignar docentes, coordinadores o invitados')}
            {createToggle('showNewTaskMaterials', 'Materiales y Herramientas', 'Lista de útiles, proyectores o insumos requeridos')}
          </div>
        </div>

        {/* 4. Calendario y Matriz */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Calendar className="w-4 h-4 text-info" />
            <span>Calendario y Matriz de Eisenhower</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            {createToggle('showCalendarKpis', 'KPIs del Calendario', 'Métricas de actividades agendadas para el periodo actual')}
            {createToggle('showCalendarFilters', 'Filtros del Calendario', 'Filtrar por categoría, estado y prioridad')}
            {createToggle('showCalendarWeekView', 'Vista Semanal por Horas', 'Habilita la grilla semanal con horarios configurables')}
            {createToggle('showMatrixKpis', 'Métricas de la Matriz', 'Contadores de tareas por cada uno de los 4 cuadrantes')}
          </div>
        </div>

        {/* 5. Comportamiento y Limpieza */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60">
            <Archive className="w-4 h-4 text-warning" />
            <span>Comportamiento y Experiencia</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-base-200/30 p-3 rounded-2xl border border-base-200">
            {createToggle('autoArchiveCompleted', 'Separar Tareas Completadas', 'Oculta automáticamente las tareas finalizadas de la vista principal')}
            {createToggle('enableTour', 'Tour Guiado del Sistema', 'Muestra el botón de ayuda interactiva paso a paso')}
          </div>
        </div>
      </div>
    </div>
  )
}
