import { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  ExternalLink,
  Folder,
  Video,
  BookOpen,
  Globe,
  Tag,
  Target,
  Pencil,
  X,
  Layers,
  MapPin,
  ListChecks,
  Check,
  MessageSquare,
} from 'lucide-react'
import type { Task, TaskStatus, TaskSubtask } from '@/types/database.types'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PRIORITY_META } from '@/types/database.types'
import { useUpdateTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { soundEngine } from '@/utils/audioEffects'
import { triggerConfetti } from '@/utils/confetti'
import { getGoogleCalendarUrl } from '@/utils/calendarExport'
import { shareTaskViaWhatsApp } from '@/utils/whatsappShare'
import toast from 'react-hot-toast'

interface TaskDetailModalProps {
  visible: boolean
  task: Task | null
  onHide: () => void
  onEdit?: (task: Task) => void
  onStartFocus?: (task: Task) => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha límite'
  const [y, m, d] = dateStr.split('-')
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
  return date.toLocaleDateString('es-GT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const [h, min] = timeStr.split(':')
  const hour = parseInt(h, 10)
  return `${hour > 12 ? hour - 12 : hour || 12}:${min} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function TaskDetailModal({
  visible,
  task,
  onHide,
  onEdit,
  onStartFocus,
}: TaskDetailModalProps) {
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()

  const [localChecklist, setLocalChecklist] = useState<TaskSubtask[]>([])

  useEffect(() => {
    if (task?.checklist) {
      setLocalChecklist(task.checklist)
    } else {
      setLocalChecklist([])
    }
  }, [task?.id, task?.checklist])

  const checklist: TaskSubtask[] = localChecklist
  const completedSubtasks = checklist.filter((s) => s.completed).length
  const totalSubtasks = checklist.length
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0

  if (!task) return null

  const handleToggleSubtask = (subtaskId: string) => {
    const previousChecklist = [...localChecklist]
    const updatedChecklist = localChecklist.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    // Actualización optimista inmediata en la UI
    setLocalChecklist(updatedChecklist)

    updateTask.mutate(
      { id: task.id, input: { checklist: updatedChecklist } },
      {
        onSuccess: () => {
          const item = updatedChecklist.find((s) => s.id === subtaskId)
          if (item?.completed) {
            soundEngine.playSuccessChime()
            const allDone = updatedChecklist.every((s) => s.completed)
            if (allDone) {
              triggerConfetti()
              toast.success('🌟 ¡Todos los pasos completados con éxito!', { duration: 2500, icon: '🎉' })
            } else {
              toast.success('Paso completado', { duration: 1800, icon: '✅' })
            }
          }
        },
        onError: () => {
          // Revertir en caso de error
          setLocalChecklist(previousChecklist)
          toast.error('No se pudo actualizar el estado del paso')
        },
      }
    )
  }

  const handleStatusToggle = () => {
    const nextStatus: TaskStatus = task.status === 'completada' ? 'pendiente' : 'completada'
    updateStatus.mutate(
      { id: task.id, status: nextStatus },
      {
        onSuccess: () => {
          if (nextStatus === 'completada') {
            soundEngine.playSuccessChime()
            triggerConfetti()
          }
          toast.success(
            nextStatus === 'completada'
              ? '🎉 ¡Excelente! Tarea marcada como completada.'
              : 'Tarea devuelta a estado pendiente.'
          )
        },
      }
    )
  }

  const SCOPE_LABELS: Record<string, string> = {
    diario: 'Diario',
    semanal: 'Semanal',
    mensual: 'Mensual',
    bimestral: 'Bimestral',
    anual: 'Anual',
  }

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      closable={false}
      className="w-full max-w-2xl mx-4 rounded-3xl overflow-hidden shadow-2xl border border-base-200"
      contentClassName="p-0 bg-base-100"
      maskClassName="backdrop-blur-sm bg-base-900/40"
    >
      {/* ── Encabezado Hero con Gradiente Suave ─────────────────────────── */}
      <div className="relative bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 p-6 border-b border-base-200">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleStatusToggle}
              className="cursor-pointer hover:opacity-85 transition-opacity"
              title="Haz clic para cambiar estado rápidamente"
            >
              <StatusBadge status={task.status} />
            </button>
            <PriorityBadge priority={task.priority} />
            {task.scope_period && (
              <span className="badge badge-sm badge-outline font-medium text-xs">
                {SCOPE_LABELS[task.scope_period] || task.scope_period}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onHide}
            className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-base-content tracking-tight leading-snug">
          {task.title}
        </h3>

        {/* Metadatos Rápidos */}
        <div className="flex items-center gap-4 mt-3 text-xs text-base-content/70 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="capitalize">{formatDate(task.due_date)}</span>
          </div>

          {task.due_time && (
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-info" />
              <span>{formatTime(task.due_time)}</span>
            </div>
          )}

          {task.category && (
            <div className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-secondary" />
              <span>{task.category}</span>
            </div>
          )}

          {task.location && (
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-warning" />
              <span>{task.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Cuerpo del Modal ────────────────────────────────────────────── */}
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Descripción */}
        {task.description ? (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              Descripción & Instrucciones
            </h4>
            <div className="bg-base-200/50 rounded-2xl p-4 text-sm text-base-content/80 whitespace-pre-line leading-relaxed border border-base-200">
              {task.description}
            </div>
          </div>
        ) : (
          <div className="text-xs text-base-content/40 italic">
            Sin descripción adicional registrada para esta actividad.
          </div>
        )}

        {/* ── Subtareas y Checklist con Barra de Progreso Creativa ────── */}
        {totalSubtasks > 0 && (
          <div className="space-y-3 bg-gradient-to-br from-primary/5 via-base-200/40 to-transparent p-4 sm:p-5 rounded-2xl border border-primary/15">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ListChecks className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content">
                    Subtareas y Pasos ({completedSubtasks}/{totalSubtasks})
                  </h4>
                  <p className="text-[11px] text-base-content/60">
                    Marca cada hito conforme avanzas en tu preparación docente.
                  </p>
                </div>
              </div>

              <span
                className={`badge badge-sm font-bold ${
                  progressPercent === 100
                    ? 'badge-success text-white'
                    : progressPercent > 50
                    ? 'badge-primary text-white'
                    : 'badge-ghost text-base-content/70'
                }`}
              >
                {progressPercent}% completado
              </span>
            </div>

            {/* Barra de progreso creativa y segmentada con degradado */}
            <div className="space-y-1.5">
              <div className="w-full bg-base-300/80 rounded-full h-3.5 p-0.5 overflow-hidden shadow-inner flex items-center">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary via-info to-success shadow-xs relative overflow-hidden"
                  style={{ width: `${Math.max(progressPercent, 2)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Mini segmentos visuales */}
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${totalSubtasks}, 1fr)` }}>
                {checklist.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className={`h-1.5 rounded-full transition-all ${
                      sub.completed ? 'bg-success shadow-xs' : 'bg-base-300'
                    }`}
                    title={`Paso ${idx + 1}: ${sub.text}`}
                  />
                ))}
              </div>
            </div>

            {/* Lista Interactiva de Subtareas */}
            <div className="space-y-2 pt-2">
              {checklist.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleToggleSubtask(sub.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all text-xs group ${
                    sub.completed
                      ? 'bg-success/10 border-success/30 text-base-content/60'
                      : 'bg-base-100 border-base-200 hover:border-primary/40 text-base-content shadow-2xs'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {sub.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-success fill-success/10" />
                    ) : (
                      <Circle className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <span
                    className={`flex-1 leading-snug ${
                      sub.completed ? 'line-through text-base-content/50' : 'font-medium'
                    }`}
                  >
                    {sub.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recursos y Enlaces Externos */}
        {task.links && task.links.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              Recursos & Enlaces Vinculados ({task.links.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {task.links.map((lnk) => (
                <a
                  key={lnk.id}
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-200 hover:border-primary/40 transition-all text-xs group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-base-100 flex items-center justify-center shrink-0 border border-base-200 group-hover:border-primary/30">
                      {lnk.type === 'drive' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-500" />
                      ) : lnk.type === 'meet' || lnk.type === 'teams' || lnk.type === 'zoom' ? (
                        <Video className="w-3.5 h-3.5 text-emerald-500" />
                      ) : lnk.type === 'classroom' ? (
                        <BookOpen className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-base-content truncate group-hover:text-primary transition-colors">
                        {lnk.title || lnk.url}
                      </p>
                      <span className="text-[10px] text-base-content/50 capitalize">
                        {lnk.type}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-base-content/40 group-hover:text-primary shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Etiquetas (Tags) */}
        {task.tags && task.tags.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
              Etiquetas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge badge-sm badge-outline gap-1 text-xs py-1 px-2.5 bg-base-100 font-medium"
                >
                  <Tag className="w-2.5 h-2.5 opacity-50" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pie de Acciones ─────────────────────────────────────────────── */}
      <div className="p-4 bg-base-200/50 border-t border-base-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {onStartFocus && ['pendiente', 'en_curso'].includes(task.status) && (
            <button
              type="button"
              onClick={() => {
                onHide()
                onStartFocus(task)
              }}
              className="btn btn-primary btn-sm rounded-xl gap-2 font-bold shadow-xs hover:scale-102 transition-transform"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Iniciar Modo Enfoque</span>
            </button>
          )}

          {/* Enviar a Google Calendar */}
          <a
            href={getGoogleCalendarUrl(task)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm rounded-xl gap-2 font-semibold hover:bg-base-200 text-base-content/80 transition-colors"
            title="Agendar esta actividad en Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Calendar</span>
          </a>

          {/* Compartir por WhatsApp */}
          <button
            type="button"
            onClick={() =>
              shareTaskViaWhatsApp({
                title: task.title,
                description: task.description,
                dueDate: task.due_date,
                dueTime: task.due_time,
                priorityLabel: PRIORITY_META[task.priority]?.label ?? task.priority,
                category: task.category,
              })
            }
            className="btn btn-outline btn-sm rounded-xl gap-2 font-semibold hover:bg-success/10 text-success border-success/30 hover:border-success transition-colors"
            title="Enviar o compartir esta tarea por WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleStatusToggle}
            className={`btn btn-sm rounded-xl gap-2 font-semibold ${
              task.status === 'completada' ? 'btn-outline btn-warning' : 'btn-outline btn-success'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{task.status === 'completada' ? 'Marcar Pendiente' : 'Completar Tarea'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onHide()
                onEdit(task)
              }}
              className="btn btn-ghost btn-sm rounded-xl gap-1.5 text-base-content/70 hover:text-base-content"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onHide}
            className="btn btn-ghost btn-sm rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Dialog>
  )
}
