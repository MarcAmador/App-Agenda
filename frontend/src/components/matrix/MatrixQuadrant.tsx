import { useState } from 'react'
import { Plus, Inbox } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types/database.types'
import { PRIORITY_META } from '@/types/database.types'
import { MatrixTaskCard } from './MatrixTaskCard'

interface MatrixQuadrantProps {
  priority: TaskPriority
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: TaskPriority) => void
  onDropTask: (taskId: string, targetPriority: TaskPriority) => void
  onQuickAdd: (priority: TaskPriority) => void
}

const QUADRANT_THEMES: Record<
  TaskPriority,
  {
    badge: string
    badgeText: string
    title: string
    sub: string
    headerBg: string
    dropBorder: string
    accentColor: string
    emptyMessage: string
  }
> = {
  urgente_importante: {
    badge: 'badge-error',
    badgeText: 'Q1',
    title: 'Hacer Ya',
    sub: 'Crisis, urgencias y plazos inminentes',
    headerBg: 'from-error/10 via-error/5 to-transparent',
    dropBorder: 'border-error ring-2 ring-error/30 bg-error/5',
    accentColor: 'text-error',
    emptyMessage: 'Sin crisis ni urgencias inmediatas. ¡Excelente!',
  },
  importante_no_urgente: {
    badge: 'badge-success',
    badgeText: 'Q2',
    title: 'Planificar',
    sub: 'Desarrollo, estrategia, calidad y prevención',
    headerBg: 'from-success/10 via-success/5 to-transparent',
    dropBorder: 'border-success ring-2 ring-success/30 bg-success/5',
    accentColor: 'text-success',
    emptyMessage: 'Dedica tiempo a tareas estratégicas aquí.',
  },
  urgente_no_importante: {
    badge: 'badge-warning',
    badgeText: 'Q3',
    title: 'Delegar',
    sub: 'Interrupciones, reuniones no críticas y trámites',
    headerBg: 'from-warning/10 via-warning/5 to-transparent',
    dropBorder: 'border-warning ring-2 ring-warning/30 bg-warning/5',
    accentColor: 'text-warning',
    emptyMessage: 'No hay tareas para delegar en este momento.',
  },
  no_urgente_baja: {
    badge: 'badge-ghost',
    badgeText: 'Q4',
    title: 'Eliminar / Baja',
    sub: 'Trivialidades, distracciones y tareas pospuestas',
    headerBg: 'from-base-300/30 via-base-200/20 to-transparent',
    dropBorder: 'border-base-content/40 ring-2 ring-base-content/20 bg-base-200/50',
    accentColor: 'text-base-content/60',
    emptyMessage: 'Bandeja limpia de tareas prescindibles.',
  },
}

export function MatrixQuadrant({
  priority,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onDropTask,
  onQuickAdd,
}: MatrixQuadrantProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const theme = QUADRANT_THEMES[priority]
  const meta = PRIORITY_META[priority]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo si salimos del cuadrante padre
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onDropTask(taskId, priority)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'flex flex-col rounded-2xl border bg-base-100/80 backdrop-blur-xs transition-all duration-200 min-h-[360px]',
        isDragOver
          ? theme.dropBorder
          : 'border-base-200 shadow-sm hover:border-base-300',
      ].join(' ')}
    >
      {/* ── Cabecera del cuadrante ──────────────────────────────── */}
      <div
        className={`px-4 py-3.5 border-b border-base-200/80 bg-gradient-to-b ${theme.headerBg} rounded-t-2xl flex items-center justify-between gap-2`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`badge ${theme.badge} font-bold text-xs px-2 py-0.5 shadow-xs`}>
            {theme.badgeText}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-base-content tracking-tight">
                {theme.title}
              </h3>
              <span className="text-xs text-base-content/40 font-medium">
                ({tasks.length})
              </span>
            </div>
            <p className="text-[11px] text-base-content/50 truncate font-normal">
              {theme.sub}
            </p>
          </div>
        </div>

        {/* Botón de añadir tarea rápida al cuadrante */}
        <button
          type="button"
          onClick={() => onQuickAdd(priority)}
          className="btn btn-ghost btn-xs btn-circle hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors flex-shrink-0"
          title={`Crear tarea en ${meta.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Lista de tareas del cuadrante ────────────────────────── */}
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto max-h-[520px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/30 mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs text-base-content/50 max-w-[200px] leading-relaxed">
              {theme.emptyMessage}
            </p>
            <button
              type="button"
              onClick={() => onQuickAdd(priority)}
              className="btn btn-ghost btn-xs text-primary gap-1 mt-2 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              Añadir aquí
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <MatrixTaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          ))
        )}
      </div>
    </div>
  )
}
