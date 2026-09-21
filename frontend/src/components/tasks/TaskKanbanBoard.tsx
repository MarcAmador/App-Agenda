/**
 * TaskKanbanBoard v2 — Kanban premium con DnD real funcionando
 * Fix: columnas con useDroppable + SortableContext combinados
 */
import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Clock, CheckCircle2, AlertTriangle, Zap,
  Target, AlertCircle, Layers, CalendarDays, ListChecks,
  MoreHorizontal, Edit2, Trash2, Archive, Tag,
} from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types/database.types'

// ─── Columnas ─────────────────────────────────────────────────────────────────

interface KanbanColumn {
  id: TaskStatus
  label: string
  icon: React.ElementType
  accent: string        // color de acento (Tailwind)
  accentBg: string
  accentBorder: string
  accentDot: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pendiente',
    label: 'Pendiente',
    icon: Clock,
    accent: 'text-amber-500',
    accentBg: 'bg-amber-50 dark:bg-amber-500/8',
    accentBorder: 'border-amber-200 dark:border-amber-500/20',
    accentDot: 'bg-amber-400',
  },
  {
    id: 'en_curso',
    label: 'En Curso',
    icon: Zap,
    accent: 'text-blue-500',
    accentBg: 'bg-blue-50 dark:bg-blue-500/8',
    accentBorder: 'border-blue-200 dark:border-blue-500/20',
    accentDot: 'bg-blue-500',
  },
  {
    id: 'completada',
    label: 'Completada',
    icon: CheckCircle2,
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-50 dark:bg-emerald-500/8',
    accentBorder: 'border-emerald-200 dark:border-emerald-500/20',
    accentDot: 'bg-emerald-500',
  },
  {
    id: 'perdida',
    label: 'Vencida',
    icon: AlertTriangle,
    accent: 'text-rose-500',
    accentBg: 'bg-rose-50 dark:bg-rose-500/8',
    accentBorder: 'border-rose-200 dark:border-rose-500/20',
    accentDot: 'bg-rose-500',
  },
]

// ─── Prioridades ──────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, {
  icon: React.ElementType; label: string
  cardBorder: string; badgeClass: string
}> = {
  urgente_importante: {
    icon: AlertCircle,
    label: 'Urgente',
    cardBorder: 'border-l-rose-400',
    badgeClass: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  importante_no_urgente: {
    icon: Target,
    label: 'Importante',
    cardBorder: 'border-l-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  urgente_no_importante: {
    icon: Zap,
    label: 'Urgente',
    cardBorder: 'border-l-amber-400',
    badgeClass: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  no_urgente_baja: {
    icon: Layers,
    label: 'Baja',
    cardBorder: 'border-l-slate-300',
    badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): { label: string; overdue: boolean; today: boolean } | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  const now = new Date(); now.setHours(0, 0, 0, 0); date.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - now.getTime()) / 86400000)
  const overdue = diff < 0
  const today = diff === 0
  let label = ''
  if (diff === 0) label = 'Hoy'
  else if (diff === 1) label = 'Mañana'
  else if (diff === -1) label = 'Ayer'
  else if (diff < 0) label = `Hace ${Math.abs(diff)}d`
  else if (diff <= 6) label = `En ${diff}d`
  else label = `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`
  return { label, overdue, today }
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCard({ task, onEdit, onStatusChange, onDelete, isGhost = false }: {
  task: Task
  onEdit: (t: Task) => void
  onStatusChange: (id: string, s: TaskStatus) => void
  onDelete: (id: string) => void
  isGhost?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const pc = PRIORITY_CONFIG[task.priority]
  const PIcon = pc.icon
  const subtasks = task.checklist || []
  const completedSubs = subtasks.filter((s) => s.completed).length
  const pct = subtasks.length > 0 ? Math.round((completedSubs / subtasks.length) * 100) : 0
  const dateInfo = formatDate(task.due_date)
  const done = task.status === 'completada'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging) return
        onEdit(task)
      }}
      className={[
        'group relative bg-base-100 rounded-2xl border border-base-200/80 shadow-sm',
        'border-l-4 cursor-pointer active:cursor-grabbing',
        'hover:shadow-md hover:-translate-y-0.5 hover:border-base-300/80',
        'transition-all duration-150 select-none',
        pc.cardBorder,
        isGhost ? 'opacity-40 scale-95' : '',
      ].join(' ')}
    >
      <div className="p-3.5">
        {/* Header: título + menú */}
        <div className="flex items-start gap-2 mb-2">
          <p className={`text-[13px] font-semibold flex-1 leading-snug ${done ? 'line-through text-base-content/35' : 'text-base-content'}`}>
            {task.title}
          </p>

          <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-50 bg-base-100 border border-base-200 rounded-xl shadow-2xl py-1 min-w-[148px]"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(task) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-base-content hover:bg-base-200 transition-colors">
                  <Edit2 className="w-3 h-3 text-primary" /> Editar
                </button>
                {!done && (
                  <button type="button" onClick={() => { setMenuOpen(false); onStatusChange(task.id, 'completada') }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                    <CheckCircle2 className="w-3 h-3" /> Completar
                  </button>
                )}
                <button type="button" onClick={() => { setMenuOpen(false); onStatusChange(task.id, 'archivada') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-base-content/60 hover:bg-base-200 transition-colors">
                  <Archive className="w-3 h-3" /> Archivar
                </button>
                <div className="h-px bg-base-200 mx-2 my-1" />
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(task.id) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        {task.description && !done && (
          <p className="text-[11px] text-base-content/50 mb-2.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Barra de progreso subtareas */}
        {subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[10px] text-base-content/50 font-medium">
                <ListChecks className="w-2.5 h-2.5" />
                {completedSubs}/{subtasks.length} pasos
              </span>
              <span className="text-[10px] font-semibold text-base-content/40">{pct}%</span>
            </div>
            <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5 pt-2 border-t border-base-200/60">
          {/* Badge prioridad */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pc.badgeClass}`}>
            <PIcon className="w-2.5 h-2.5" />
            {pc.label}
          </span>

          {/* Categoría */}
          {task.category && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-base-200 text-base-content/60">
              <Tag className="w-2 h-2" />
              {task.category}
            </span>
          )}

          {/* Fecha */}
          {dateInfo && (
            <span className={`ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
              dateInfo.overdue
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                : dateInfo.today
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                : 'text-base-content/40'
            }`}>
              <CalendarDays className="w-2.5 h-2.5" />
              {dateInfo.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Columna Droppable ────────────────────────────────────────────────────────

function KanbanColumnView({ column, tasks, onEdit, onStatusChange, onDelete, onAddTask, activeId }: {
  column: KanbanColumn
  tasks: Task[]
  onEdit: (t: Task) => void
  onStatusChange: (id: string, s: TaskStatus) => void
  onDelete: (id: string) => void
  onAddTask: (s: TaskStatus) => void
  activeId: string | null
}) {
  const ColIcon = column.icon

  // La columna entera es droppable con el id del status
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 border ${column.accentBg} ${column.accentBorder}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${column.accentDot}`} />
          <ColIcon className={`w-3.5 h-3.5 ${column.accent}`} />
          <span className="text-[13px] font-bold text-base-content">{column.label}</span>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${column.accentBg} ${column.accent}`}>
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className={`w-6 h-6 flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 transition-all hover:bg-base-200 ${column.accent}`}
          title={`Nueva tarea en ${column.label}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body scrollable */}
      <div
        ref={setNodeRef}
        className={[
          'flex flex-col gap-2 flex-1 rounded-xl p-2 min-h-[200px] transition-colors duration-150',
          isOver ? `${column.accentBg} ${column.accentBorder} border-2 border-dashed` : 'bg-base-200/40 border-2 border-transparent',
        ].join(' ')}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              isGhost={activeId === task.id}
            />
          ))}
        </SortableContext>

        {/* Estado vacío */}
        {tasks.length === 0 && !isOver && (
          <div
            className="flex flex-col items-center justify-center gap-2 flex-1 py-6 rounded-xl cursor-pointer"
            onClick={() => onAddTask(column.id)}
          >
            <div className={`w-8 h-8 rounded-xl ${column.accentBg} flex items-center justify-center`}>
              <Plus className={`w-4 h-4 ${column.accent} opacity-60`} />
            </div>
            <p className="text-[11px] text-base-content/35 font-medium">Sin tareas</p>
            <p className="text-[10px] text-base-content/25">Haz clic para agregar</p>
          </div>
        )}

        {/* Área drop highlight */}
        {isOver && tasks.length === 0 && (
          <div className={`flex-1 rounded-lg flex items-center justify-center ${column.accentBg}`}>
            <p className={`text-xs font-semibold ${column.accent}`}>Suelta aquí</p>
          </div>
        )}

        {/* Add button al final */}
        <button
          type="button"
          onClick={() => onAddTask(column.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all group mt-1`}
        >
          <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          Agregar tarea
        </button>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

interface TaskKanbanBoardProps {
  tasks: Task[]
  loading?: boolean
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onDelete: (id: string) => void
  onAddTask: (status?: TaskStatus) => void
}

export function TaskKanbanBoard({
  tasks, loading = false, onEdit, onStatusChange, onDelete, onAddTask,
}: TaskKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const today = new Date().toISOString().split('T')[0]

  const columnTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      pendiente: [], en_curso: [], completada: [], perdida: [],
    }
    tasks.forEach((t) => {
      if (t.status === 'archivada' || t.status === 'anulada') return
      const col =
        t.due_date && t.due_date < today && t.status === 'pendiente'
          ? 'perdida'
          : t.status
      if (col in grouped) grouped[col].push(t)
    })
    return grouped
  }, [tasks, today])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const handleDragOver = (_e: DragOverEvent) => { /* columnas son droppable, DnD maneja automáticamente */ }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)
    const validCols: TaskStatus[] = ['pendiente', 'en_curso', 'completada', 'perdida']

    let targetStatus: TaskStatus | null = null

    if (validCols.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus
    } else {
      // over es un card — buscar en qué columna está
      for (const col of COLUMNS) {
        if ((columnTasks[col.id] ?? []).some((t) => t.id === overId)) {
          targetStatus = col.id
          break
        }
      }
    }

    const task = tasks.find((t) => t.id === taskId)
    if (targetStatus && task && targetStatus !== task.status) {
      onStatusChange(taskId, targetStatus)
    }
  }

  const totalTasks = tasks.filter((t) => t.status !== 'archivada' && t.status !== 'anulada').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <span className="loading loading-spinner loading-md text-primary" />
        <span className="text-sm text-base-content/50">Cargando tablero...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header del tablero */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-base-content">Vista Kanban</h3>
          <p className="text-xs text-base-content/45 mt-0.5">{totalTasks} tareas en el tablero</p>
        </div>
        <button
          type="button"
          onClick={() => onAddTask()}
          className="btn btn-primary btn-sm rounded-xl gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva tarea
        </button>
      </div>

      {/* Columnas */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((col) => (
            <KanbanColumnView
              key={col.id}
              column={col}
              tasks={columnTasks[col.id] ?? []}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onAddTask={(status) => onAddTask(status)}
              activeId={activeId}
            />
          ))}
        </div>

        {/* Overlay */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask ? (
            <div className={`bg-base-100 rounded-2xl border-2 border-primary/30 shadow-2xl p-3.5 rotate-1 w-[260px] border-l-4 ${PRIORITY_CONFIG[activeTask.priority].cardBorder}`}>
              <p className="text-[13px] font-semibold text-base-content leading-snug">{activeTask.title}</p>
              {activeTask.category && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-base-200 text-base-content/60 mt-2">
                  <Tag className="w-2 h-2" />{activeTask.category}
                </span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
