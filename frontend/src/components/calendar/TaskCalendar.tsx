/**
 * TaskCalendar v2 — Contenedor del calendario con:
 * - Filtros por categoría, prioridad y estado
 * - Vistas: Mes | Semana | Día
 * - Navegación premium
 */
import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays,
  LayoutGrid, CalendarRange, Filter, X,
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types/database.types'
import { PRIORITY_META, STATUS_META } from '@/types/database.types'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarWeekView } from './CalendarWeekView'
import { useUpdateTask } from '@/hooks/useTasks'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CalendarSubView = 'mes' | 'semana'

interface CalendarFilters {
  categories: string[]
  priorities: TaskPriority[]
  statuses: TaskStatus[]
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskCalendarProps {
  tasks: Task[]
  loading?: boolean
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onCreateForDate: (dateStr: string) => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TaskCalendar({
  tasks, loading = false, onEdit, onStatusChange, onCreateForDate,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [subView, setSubView] = useState<CalendarSubView>('mes')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: [], priorities: [], statuses: [],
  })

  const updateTask = useUpdateTask()

  // Navegación
  const handlePrev = () => {
    const d = new Date(currentDate)
    if (subView === 'mes') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (subView === 'mes') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const handleToday = () => setCurrentDate(new Date())

  // Filtros
  const allCategories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [tasks])

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (filters.categories.length > 0) {
      result = result.filter((t) => t.category && filters.categories.includes(t.category))
    }
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority))
    }
    if (filters.statuses.length > 0) {
      result = result.filter((t) => filters.statuses.includes(t.status))
    }
    return result
  }, [tasks, filters])

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priorities.length > 0 ||
    filters.statuses.length > 0

  const clearFilters = () => setFilters({ categories: [], priorities: [], statuses: [] })

  const toggleCategory = (cat: string) =>
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }))

  const togglePriority = (p: TaskPriority) =>
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(p)
        ? f.priorities.filter((x) => x !== p)
        : [...f.priorities, p],
    }))

  const toggleStatus = (s: TaskStatus) =>
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(s)
        ? f.statuses.filter((x) => x !== s)
        : [...f.statuses, s],
    }))

  // Drag-and-drop actualiza hora de tarea
  const handleUpdateTaskTime = (id: string, dateStr: string, startTime: string) => {
    if (!startTime) {
      updateTask.mutate({ id, input: { due_date: dateStr, start_time: null, due_time: null } })
    } else {
      updateTask.mutate({ id, input: { due_date: dateStr, start_time: startTime, due_time: startTime } })
    }
  }

  const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  const scheduledCount = filteredTasks.filter((t) => t.due_date).length

  // Week label
  const getWeekLabel = () => {
    const d = new Date(currentDate)
    const start = new Date(d)
    const dayOfWeek = d.getDay()
    start.setDate(d.getDate() - dayOfWeek)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const fmt = (date: Date) => `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`
    return `${fmt(start)} – ${fmt(end)}`
  }

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">

      {/* ── Barra de Navegación ──────────────────────────────────── */}
      <div id="tour-calendar-controls" className="p-3.5 border-b border-base-200 flex items-center justify-between flex-wrap gap-2.5 bg-base-100">
        {/* Título e info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content capitalize">
              {subView === 'mes' ? monthLabel : getWeekLabel()}
            </h3>
            <p className="text-[11px] text-base-content/45">
              {scheduledCount} {scheduledCount === 1 ? 'actividad agendada' : 'actividades agendadas'}
              {hasActiveFilters && <span className="text-primary font-semibold"> · filtros activos</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToday}
            className="btn btn-outline btn-xs rounded-lg ml-1 font-semibold"
          >
            Hoy
          </button>
        </div>

        {/* Controles derechos */}
        <div className="flex items-center gap-2">

          {/* Botón filtros */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-xs rounded-lg gap-1.5 ${hasActiveFilters ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className="badge badge-xs bg-primary-content text-primary font-bold">
                {filters.categories.length + filters.priorities.length + filters.statuses.length}
              </span>
            )}
          </button>

          {/* Selector sub-vista */}
          <div className="flex items-center bg-base-200 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setSubView('mes')}
              className={['btn btn-xs rounded-lg gap-1.5', subView === 'mes' ? 'btn-primary shadow-xs' : 'btn-ghost text-base-content/70'].join(' ')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Mes
            </button>
            <button
              type="button"
              onClick={() => setSubView('semana')}
              className={['btn btn-xs rounded-lg gap-1.5', subView === 'semana' ? 'btn-primary shadow-xs' : 'btn-ghost text-base-content/70'].join(' ')}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Semana
            </button>
          </div>

          {/* Flechas de navegación */}
          <div className="join border border-base-300 rounded-xl overflow-hidden">
            <button type="button" onClick={handlePrev} className="join-item btn btn-xs btn-ghost px-2.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleNext} className="join-item btn btn-xs btn-ghost px-2.5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Barra de Filtros (expansible) ────────────────────────── */}
      {showFilters && (
        <div className="calendar-filter-bar border-b border-base-200">
          <div className="flex flex-wrap gap-3 w-full">

            {/* Limpiar */}
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-error font-semibold">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}

            {/* Categorías */}
            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Categoría:</span>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="calendar-filter-chip"
                    data-active={filters.categories.includes(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Prioridades */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Prioridad:</span>
              {(Object.entries(PRIORITY_META) as [TaskPriority, typeof PRIORITY_META[TaskPriority]][]).map(([value, meta]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePriority(value)}
                  className="calendar-filter-chip"
                  data-active={filters.priorities.includes(value)}
                >
                  {meta.label.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Estados */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Estado:</span>
              {(['pendiente', 'en_curso', 'completada', 'perdida'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className="calendar-filter-chip"
                  data-active={filters.statuses.includes(s)}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Contenido ────────────────────────────────────────────── */}
      <div id="tour-calendar-grid">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <span className="text-xs text-base-content/50">Cargando calendario...</span>
          </div>
        ) : subView === 'mes' ? (
          <CalendarMonthView
            currentDate={currentDate}
            tasks={filteredTasks}
            onEdit={onEdit}
            onCreateForDate={onCreateForDate}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            tasks={filteredTasks}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onCreateForDate={onCreateForDate}
            onUpdateTaskTime={handleUpdateTaskTime}
          />
        )}
      </div>
    </div>
  )
}
