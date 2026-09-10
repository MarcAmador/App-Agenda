import { useState, useRef } from 'react'
import {
  Calendar, Clock, MoreVertical,
  Check, ArrowRightLeft, Edit2, Trash2, Tag, GripVertical, MessageSquare,
  ListChecks, ExternalLink, Folder, Video, BookOpen, Globe
} from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types/database.types'
import { SCOPE_META, PRIORITY_META } from '@/types/database.types'


interface MatrixTaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: TaskPriority) => void
}

const QUADRANT_OPTIONS: { priority: TaskPriority; label: string; qBadge: string }[] = [
  { priority: 'urgente_importante',    label: 'Q1: Hacer Ya',      qBadge: 'badge-error' },
  { priority: 'importante_no_urgente', label: 'Q2: Planificar',    qBadge: 'badge-success' },
  { priority: 'urgente_no_importante', label: 'Q3: Delegar',       qBadge: 'badge-warning' },
  { priority: 'no_urgente_baja',       label: 'Q4: Baja Prioridad', qBadge: 'badge-ghost' },
]

export function MatrixTaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}: MatrixTaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isCompleted = task.status === 'completada'

  // Chequeo de vencimiento
  const isOverdue =
    task.due_date &&
    !isCompleted &&
    new Date(task.due_date + 'T23:59:59') < new Date()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const toggleComplete = () => {
    onStatusChange(task.id, isCompleted ? 'pendiente' : 'completada')
  }

  const handleShareWhatsApp = () => {
    let msg = `⏰ *Recordatorio AgendaPro*\n\n📌 *Tarea:* ${task.title}\n`
    if (task.description) msg += `📝 *Detalles:* ${task.description}\n`
    if (task.due_date) {
      msg += `📅 *Vencimiento:* ${task.due_date}${task.due_time ? ` a las ${task.due_time.substring(0, 5)}` : ''}\n`
    }
    msg += `⚡ *Prioridad:* ${PRIORITY_META[task.priority]?.label ?? task.priority}\n\n`
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5180'
    msg += `🔗 *Ver en portal:* ${baseUrl}/tareas`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (

    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={[
        'group relative bg-base-100 rounded-xl p-3.5 border transition-all duration-200 cursor-grab active:cursor-grabbing',
        'hover:shadow-md hover:border-primary/30 select-none',
        isCompleted
          ? 'border-base-200/60 bg-base-100/60 opacity-60'
          : isOverdue
          ? 'border-error/40 bg-error/5'
          : 'border-base-200 shadow-sm',
      ].join(' ')}
    >
      {/* ── Fila superior: Checkbox + Título + Menú ───────────────── */}
      <div className="flex items-start gap-2.5">
        {/* Grip indicator */}
        <div className="mt-0.5 text-base-content/20 group-hover:text-base-content/50 transition-colors flex-shrink-0">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Checkbox circular interactivo */}
        <button
          type="button"
          onClick={toggleComplete}
          className={[
            'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
            isCompleted
              ? 'bg-success border-success text-success-content'
              : 'border-base-300 hover:border-primary',
          ].join(' ')}
          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
        >
          {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </button>

        {/* Título y descripción */}
        <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
          <h4
            className={[
              'text-sm font-semibold text-base-content leading-snug break-words cursor-pointer hover:text-primary transition-colors',
              isCompleted ? 'line-through text-base-content/40' : '',
            ].join(' ')}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-base-content/55 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Menú contextual (tres puntos) */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Opciones de la tarea"
          >
            <MoreVertical className="w-3.5 h-3.5 text-base-content/60" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-6 z-50 w-52 bg-base-100 border border-base-200 rounded-xl shadow-xl p-1.5 animate-in fade-in-50 zoom-in-95 text-xs">
                {/* Mover a cuadrante */}
                <div className="px-2 py-1 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                  Mover a cuadrante
                </div>
                <div className="flex flex-col gap-0.5 mb-1.5">
                  {QUADRANT_OPTIONS.map((opt) => (
                    <button
                      key={opt.priority}
                      type="button"
                      disabled={task.priority === opt.priority}
                      onClick={() => {
                        onPriorityChange(task.id, opt.priority)
                        setMenuOpen(false)
                      }}
                      className={[
                        'flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors',
                        task.priority === opt.priority
                          ? 'bg-base-200 text-base-content font-semibold cursor-default'
                          : 'hover:bg-base-200/70 text-base-content/80',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3 text-base-content/50" />
                        {opt.label}
                      </span>
                      {task.priority === opt.priority && (
                        <span className="text-[10px] text-primary font-bold">Actual</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="divider my-0.5" />

                {/* Acciones generales */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    handleShareWhatsApp()
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-success/10 text-success text-left transition-colors font-medium"
                >
                  <MessageSquare className="w-3 h-3" />
                  Enviar por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(task)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200/70 text-base-content/80 text-left transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar tarea
                </button>


                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(task.id)
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-error/10 text-error text-left transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar tarea
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Subtareas / Checklist (Progreso %) ────────────────────── */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-base-200/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-base-content/70">
            <span className="flex items-center gap-1 font-semibold">
              <ListChecks className="w-3 h-3 text-primary" />
              <span>Pasos: {task.checklist.filter((s) => s.completed).length}/{task.checklist.length}</span>
            </span>
            <span className="font-bold text-[10px] text-primary">
              {Math.round((task.checklist.filter((s) => s.completed).length / task.checklist.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-base-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{
                width: `${Math.round((task.checklist.filter((s) => s.completed).length / task.checklist.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Enlaces a Recursos (Drive, Meet, Classroom, Teams) ─────── */}
      {task.links && task.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.links.map((lnk) => (
            <a
              key={lnk.id}
              href={lnk.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="badge badge-ghost badge-xs hover:badge-primary gap-1 py-1 text-[10px] transition-all cursor-pointer"
              title={lnk.title || lnk.url}
            >
              {lnk.type === 'drive' ? (
                <Folder className="w-2.5 h-2.5 text-amber-500" />
              ) : lnk.type === 'meet' || lnk.type === 'teams' || lnk.type === 'zoom' ? (
                <Video className="w-2.5 h-2.5 text-emerald-500" />
              ) : lnk.type === 'classroom' ? (
                <BookOpen className="w-2.5 h-2.5 text-green-600" />
              ) : (
                <Globe className="w-2.5 h-2.5 text-primary" />
              )}
              <span className="max-w-[90px] truncate">{lnk.title}</span>
              <ExternalLink className="w-2 h-2 opacity-50" />
            </a>
          ))}
        </div>
      )}

      {/* ── Metadatos inferiores (Fecha, Alcance, Tags) ───────────── */}
      <div className="mt-3 pt-2 border-t border-base-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fecha límite */}
          {task.due_date && (
            <span
              className={[
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[11px]',
                isOverdue
                  ? 'text-error bg-error/10'
                  : 'text-base-content/60 bg-base-200',
              ].join(' ')}
              title={isOverdue ? 'Tarea vencida' : 'Fecha límite'}
            >
              <Calendar className="w-3 h-3" />
              {task.due_date}
              {task.due_time && (
                <>
                  <Clock className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                  {task.due_time.substring(0, 5)}
                </>
              )}
            </span>
          )}

          {/* Alcance temporal (Diario, Semanal, etc.) */}
          {task.scope_period && (
            <span className="badge badge-xs badge-outline text-[10px] text-base-content/60">
              {SCOPE_META[task.scope_period]?.label ?? task.scope_period}
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-2.5 h-2.5 text-base-content/40" />
            <span className="text-[10px] text-base-content/50 truncate max-w-[120px]">
              {task.tags.slice(0, 2).join(', ')}
              {task.tags.length > 2 && ` +${task.tags.length - 2}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
