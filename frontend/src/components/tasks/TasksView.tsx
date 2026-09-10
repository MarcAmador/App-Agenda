import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutList, Calendar, Grid2x2, X } from 'lucide-react'
import type { Task, CreateTaskInput, TaskPriority } from '@/types/database.types'
import { TaskFilters } from '@/services/tasks.service'

import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useUpdateTaskPriority,
  useDeleteTask,
} from '@/hooks/useTasks'
import { TaskDataTable } from '@/components/tasks/TaskDataTable'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { AdvancedFilterBar } from '@/components/tasks/AdvancedFilterBar'
import { EisenhowerMatrix } from '@/components/matrix/EisenhowerMatrix'
import { TaskCalendar } from '@/components/calendar/TaskCalendar'

// ─── Pestañas de filtro rápido por temporalidad ───────────────────────────────

type QuickFilter = 'todos' | 'hoy' | 'semana' | 'mes'

function getDateRange(qf: QuickFilter): { due_from?: string; due_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (qf === 'hoy') {
    return { due_from: fmt(today), due_to: fmt(today) }
  }
  if (qf === 'semana') {
    const start = new Date(today)
    const dayOfWeek = today.getDay()
    const dist = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start.setDate(today.getDate() + dist)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { due_from: fmt(start), due_to: fmt(end) }
  }
  if (qf === 'mes') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { due_from: fmt(start), due_to: fmt(end) }
  }
  return {}
}

const QUICK_TABS: { label: string; value: QuickFilter }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Hoy',   value: 'hoy' },
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Este Mes',    value: 'mes' },
]

// ─── Estadísticas rápidas ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  count: number
  colorClass: string
  onClick: () => void
  active: boolean
}

function StatCard({ label, count, colorClass, onClick, active }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'card text-left transition-all duration-200 cursor-pointer border',
        active
          ? 'border-primary/40 bg-primary/5 shadow-xs ring-2 ring-primary/20'
          : 'border-base-200 bg-base-100 hover:shadow-xs hover:border-base-300',
      ].join(' ')}
    >
      <div className="card-body p-3.5 sm:p-4">
        <p className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold ${colorClass} mt-0.5`}>{count}</p>
      </div>
    </button>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export type ViewMode = 'tabla' | 'calendario' | 'matriz'

interface TasksViewProps {
  initialViewMode?: ViewMode
  pageTitle?: string
  pageSubtitle?: string
}

export function TasksView({
  initialViewMode = 'tabla',
  pageTitle = 'Mis Tareas',
  pageSubtitle = 'Gestiona tus actividades académicas, calendario y prioridades',
}: TasksViewProps) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [advancedFilters, setAdvancedFilters] = useState<TaskFilters>({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [initialModalValues, setInitialModalValues] = useState<Partial<CreateTaskInput> | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const navigate = useNavigate()

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'tabla') navigate('/tareas')
    else if (mode === 'calendario') navigate('/calendario')
    else if (mode === 'matriz') navigate('/matriz')
  }

  // Combinar filtros rápidos con filtros avanzados
  const combinedFilters: TaskFilters = {
    ...getDateRange(quickFilter),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...advancedFilters,
  }

  const { data, isLoading } = useTasks(combinedFilters)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const updatePriority = useUpdateTaskPriority()
  const deleteTask = useDeleteTask()

  const tasks = data?.data ?? []
  const totalRecords = data?.count ?? 0

  // Conteos inteligentes para las stat cards
  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = (t: Task) =>
    Boolean(t.due_date && t.due_date < todayStr && !['completada', 'anulada', 'archivada'].includes(t.status))

  const counts = {
    pendiente:  tasks.filter((t) => t.status === 'pendiente').length,
    en_curso:   tasks.filter((t) => t.status === 'en_curso').length,
    completada: tasks.filter((t) => t.status === 'completada').length,
    perdida:    tasks.filter((t) => t.status === 'perdida' || isOverdue(t)).length,
  }

  const hasActiveFilters = quickFilter !== 'todos' || statusFilter !== undefined || Object.keys(advancedFilters).length > 0

  const handleOpenCreate = () => {
    setEditingTask(null)
    setInitialModalValues(null)
    setModalVisible(true)
  }

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task)
    setInitialModalValues(null)
    setModalVisible(true)
  }

  const handleCreateForDate = (dateStr: string) => {
    setEditingTask(null)
    setInitialModalValues({ due_date: dateStr })
    setModalVisible(true)
  }

  const handleQuickAddQuadrant = (priority?: TaskPriority) => {
    setEditingTask(null)
    setInitialModalValues({ priority: priority ?? 'importante_no_urgente' })
    setModalVisible(true)
  }

  const handleSubmit = (input: CreateTaskInput) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, input },
        { onSuccess: () => setModalVisible(false) }
      )
    } else {
      createTask.mutate(input, { onSuccess: () => setModalVisible(false) })
    }
  }

  const handleArchive = (id: string) => {
    updateStatus.mutate({ id, status: 'archivada' })
  }

  const handleClearAllFilters = () => {
    setQuickFilter('todos')
    setStatusFilter(undefined)
    setAdvancedFilters({})
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* ── Encabezado de sección ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">{pageTitle}</h2>
          <p className="text-sm text-base-content/55 mt-0.5">{pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Selector de vista interactivo */}
          <div id="tour-view-modes" className="flex items-center gap-1 bg-base-200 rounded-xl p-1 shadow-inner">
            {([
              { mode: 'tabla',      icon: LayoutList, title: 'Vista Tabla' },
              { mode: 'calendario', icon: Calendar,   title: 'Vista Calendario' },
              { mode: 'matriz',     icon: Grid2x2,    title: 'Matriz de Eisenhower' },
            ] as const).map(({ mode, icon: Icon, title }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleViewChange(mode)}
                title={title}
                className={[
                  'btn btn-xs rounded-lg px-2.5 h-8 gap-1.5 transition-all',
                  viewMode === mode
                    ? 'btn-primary shadow-xs'
                    : 'btn-ghost text-base-content/70 hover:text-base-content',
                ].join(' ')}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline capitalize text-xs">
                  {mode === 'matriz' ? 'Matriz' : mode}
                </span>
              </button>
            ))}
          </div>

          {/* Botón Nueva Tarea */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm rounded-xl gap-1.5 shadow-sm"
            id="btn-nueva-tarea"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* ── Stat Cards Clicables ───────────────────────────────────── */}
      <div id="tour-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Pendientes"
          count={counts.pendiente}
          colorClass="text-warning"
          active={statusFilter === 'pendiente'}
          onClick={() =>
            setStatusFilter(statusFilter === 'pendiente' ? undefined : 'pendiente')
          }
        />
        <StatCard
          label="En curso"
          count={counts.en_curso}
          colorClass="text-info"
          active={statusFilter === 'en_curso'}
          onClick={() =>
            setStatusFilter(statusFilter === 'en_curso' ? undefined : 'en_curso')
          }
        />
        <StatCard
          label="Completadas"
          count={counts.completada}
          colorClass="text-success"
          active={statusFilter === 'completada'}
          onClick={() =>
            setStatusFilter(
              statusFilter === 'completada' ? undefined : 'completada'
            )
          }
        />
        <StatCard
          label="Vencidas"
          count={counts.perdida}
          colorClass="text-error"
          active={statusFilter === 'perdida'}
          onClick={() =>
            setStatusFilter(statusFilter === 'perdida' ? undefined : 'perdida')
          }
        />
      </div>

      {/* ── Barra de Filtros Avanzados ────────────────────────────── */}
      <div id="tour-advanced-filters">
        <AdvancedFilterBar
          filters={combinedFilters}
          onFilterChange={(newF) => setAdvancedFilters(newF)}
          onClear={handleClearAllFilters}
        />
      </div>

      {/* ── Pestañas de Filtro Rápido Temporal (en vista Tabla) ───── */}
      {viewMode === 'tabla' && (
        <div className="flex items-center justify-between gap-2 border-b border-base-200 flex-wrap">
          <div className="flex items-center gap-1">
            {QUICK_TABS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuickFilter(value)}
                className={[
                  'px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors duration-150',
                  quickFilter === value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:border-base-300',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="btn btn-ghost btn-xs text-xs text-error gap-1 mr-2 rounded-lg"
              title="Restablecer todos los filtros aplicados"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Renderizado Dinámico de Vistas ───────────────────────── */}
      {viewMode === 'tabla' && (
        <div id="tour-tasks-table" className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden rounded-2xl">
          <TaskDataTable
            tasks={tasks}
            loading={isLoading}
            totalRecords={totalRecords}
            onEdit={handleOpenEdit}
            onDelete={(id) => deleteTask.mutate(id)}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onArchive={handleArchive}
          />
        </div>
      )}

      {viewMode === 'calendario' && (
        <div id="tour-calendar-view">
          <TaskCalendar
            tasks={tasks}
            loading={isLoading}
            onEdit={handleOpenEdit}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onCreateForDate={handleCreateForDate}
          />
        </div>
      )}

      {viewMode === 'matriz' && (
        <div id="tour-matrix-view">
          <EisenhowerMatrix
            tasks={tasks}
            loading={isLoading}
            onEdit={handleOpenEdit}
            onDelete={(id) => deleteTask.mutate(id)}
            onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
            onPriorityChange={(id, priority) => updatePriority.mutate({ id, priority })}
            onQuickAdd={handleQuickAddQuadrant}
          />
        </div>
      )}

      {/* ── Modal de Formulario de Tarea (Reutilizable en todas las vistas) ── */}
      <TaskFormModal
        visible={modalVisible}
        task={editingTask}
        initialValues={initialModalValues}
        onHide={() => {
          setModalVisible(false)
          setInitialModalValues(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />
    </div>
  )
}
