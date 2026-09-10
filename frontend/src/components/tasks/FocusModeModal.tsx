import { useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import {
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Clock,
  ExternalLink,
  Folder,
  Video,
  BookOpen,
  Globe,
  ArrowRight,
  Trophy,
  Check,
  Flame,
  AlertTriangle,
  X,
} from 'lucide-react'
import type { Task, TaskStatus, UpdateTaskInput } from '@/types/database.types'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import toast from 'react-hot-toast'

interface FocusModeModalProps {
  visible: boolean
  tasks: Task[]
  onHide: () => void
  onUpdateStatus: (id: string, status: TaskStatus) => void
  onUpdateTask: (id: string, input: UpdateTaskInput) => void
}

/**
 * Algoritmo de Priorización de Enfoque:
 * Pondera fecha de vencimiento, cuadrante de Eisenhower y subtareas pendientes.
 */
function calculateTaskScore(task: Task, todayStr: string): number {
  let score = 0

  // 1. Puntos por fecha límite
  if (task.due_date) {
    if (task.due_date < todayStr) {
      score += 1000 // Máxima urgencia: Tarea vencida
    } else if (task.due_date === todayStr) {
      score += 500 // Alta urgencia: Vence hoy
    } else {
      // Vence próximamente (dentro de los próximos 7 días)
      const diffDays = Math.ceil(
        (new Date(task.due_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays <= 3) score += 250
      else if (diffDays <= 7) score += 100
    }
  }

  // 2. Puntos por Cuadrante de Eisenhower
  switch (task.priority) {
    case 'urgente_importante':
      score += 300 // Q1 Hacer Ya
      break
    case 'importante_no_urgente':
      score += 160 // Q2 Planificar
      break
    case 'urgente_no_importante':
      score += 60 // Q3 Delegar
      break
    case 'no_urgente_baja':
      score += 10 // Q4 Baja Prioridad
      break
  }

  // 3. Subtareas pendientes
  if (task.checklist && task.checklist.length > 0) {
    const pendingCount = task.checklist.filter((s) => !s.completed).length
    score += pendingCount * 15
  }

  return score
}

export function FocusModeModal({
  visible,
  tasks,
  onHide,
  onUpdateStatus,
  onUpdateTask,
}: FocusModeModalProps) {
  const todayStr = new Date().toISOString().split('T')[0]

  // Filtrar tareas activas elegibles para el Modo Enfoque
  const activeTasks = tasks
    .filter((t) => ['pendiente', 'en_curso'].includes(t.status))
    .map((t) => ({ task: t, score: calculateTaskScore(t, todayStr) }))
    .sort((a, b) => b.score - a.score)

  const [currentIndex, setCurrentIndex] = useState(0)

  // Temporizador Pomodoro de 25 minutos (1500 segundos)
  const POMODORO_DEFAULT_SECONDS = 25 * 60
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_DEFAULT_SECONDS)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Reiniciar índice cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0)
      setSecondsLeft(POMODORO_DEFAULT_SECONDS)
      setIsTimerRunning(false)
    }
  }, [visible])

  // Lógica del Temporizador Pomodoro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1)
      }, 1000)
    } else if (secondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      toast.success('🎉 ¡Bloque de enfoque completado! Tómate un breve descanso.')
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, secondsLeft])

  const currentCandidate = activeTasks[currentIndex]?.task || null

  const handleNextTask = () => {
    if (activeTasks.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeTasks.length)
    }
  }

  const handleCompleteCurrent = () => {
    if (!currentCandidate) return
    onUpdateStatus(currentCandidate.id, 'completada')
    toast.success('🏆 ¡Excelente trabajo! Tarea marcada como completada.', {
      duration: 3500,
      icon: '👏',
    })
    // Avanzar a la siguiente tarea disponible
    if (activeTasks.length <= 1) {
      setCurrentIndex(0)
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    if (!currentCandidate || !currentCandidate.checklist) return
    const updatedChecklist = currentCandidate.checklist.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    onUpdateTask(currentCandidate.id, { checklist: updatedChecklist })
  }

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isOverdue =
    currentCandidate?.due_date &&
    currentCandidate.due_date < todayStr

  const isDueToday =
    currentCandidate?.due_date &&
    currentCandidate.due_date === todayStr

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      className="w-full max-w-2xl"
      modal
      draggable={false}
      resizable={false}
      closable={false}
      style={{ borderRadius: '1.25rem' }}
    >
      <div className="flex flex-col gap-6 p-2 sm:p-4">

        {/* ── Encabezado Zen ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/25">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-base-content tracking-tight">
                  Modo Enfoque Inteligente
                </h3>
                <span className="badge badge-primary badge-xs gap-1 font-bold text-[10px]">
                  <Sparkles className="w-2.5 h-2.5" /> IA
                </span>
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">
                Selección de alta prioridad basada en vencimiento y matriz de Eisenhower.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onHide}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Caso: No hay tareas pendientes (Todo completado) ──────── */}
        {!currentCandidate ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-success/15 text-success flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-lg font-extrabold text-base-content">
                ¡Estás al día con tus actividades!
              </h4>
              <p className="text-xs text-base-content/60 mt-1 leading-relaxed">
                No tienes compromisos pendientes ni tareas atrasadas en este momento. Puedes aprovechar para descansar o planificar tus próximas clases.
              </p>
            </div>
            <button
              type="button"
              onClick={onHide}
              className="btn btn-primary btn-sm rounded-xl px-6 font-semibold"
            >
              Volver al Centro de Mando
            </button>
          </div>
        ) : (
          /* ── Caso: Tarea Recomendada ──────────────────────────────── */
          <div className="flex flex-col gap-5">

            {/* Banner de Recomendación & Alertas */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="badge bg-primary/10 text-primary border-primary/20 badge-sm font-bold gap-1 text-xs">
                  <Flame className="w-3 h-3 fill-primary" /> Prioridad #{currentIndex + 1} de {activeTasks.length}
                </span>

                {isOverdue && (
                  <span className="badge badge-error badge-sm font-bold gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3" /> Vencida
                  </span>
                )}
                {isDueToday && (
                  <span className="badge badge-warning badge-sm font-bold gap-1 text-xs">
                    <Clock className="w-3 h-3" /> Entrega para Hoy
                  </span>
                )}
              </div>

              {activeTasks.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextTask}
                  className="btn btn-ghost btn-xs gap-1 font-semibold text-primary hover:bg-primary/10"
                >
                  <span>Ver siguiente recomendación</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tarjeta Central de la Actividad */}
            <div className="card bg-base-100 border border-base-200 shadow-md rounded-2xl p-5 flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-base-content leading-snug">
                    {currentCandidate.title}
                  </h4>
                  {currentCandidate.category && (
                    <span className="text-xs text-base-content/50 font-medium">
                      {currentCandidate.category}
                    </span>
                  )}
                </div>
                <PriorityBadge priority={currentCandidate.priority} />
              </div>

              {currentCandidate.description && (
                <p className="text-xs text-base-content/70 leading-relaxed bg-base-200/50 p-3 rounded-xl border border-base-200">
                  {currentCandidate.description}
                </p>
              )}

              {/* Metadatos de Fecha y Hora */}
              <div className="flex items-center gap-3 text-xs text-base-content/60 flex-wrap">
                {currentCandidate.due_date && (
                  <div className="flex items-center gap-1.5 font-medium bg-base-200/60 px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{currentCandidate.due_date}</span>
                    {currentCandidate.due_time && (
                      <span className="text-base-content/40">
                        a las {currentCandidate.due_time.substring(0, 5)}
                      </span>
                    )}
                  </div>
                )}
                {currentCandidate.location && (
                  <span className="badge badge-ghost badge-sm text-[11px]">
                    📍 {currentCandidate.location}
                  </span>
                )}
              </div>

              {/* ── Subtareas / Checklist Interactivo (Joya 1) ─────── */}
              {currentCandidate.checklist && currentCandidate.checklist.length > 0 && (
                <div className="mt-1 pt-3 border-t border-base-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-base-content uppercase tracking-wider text-[11px]">
                      Pasos de la actividad:
                    </span>
                    <span className="badge badge-primary badge-outline badge-xs font-bold">
                      {currentCandidate.checklist.filter((s) => s.completed).length} de{' '}
                      {currentCandidate.checklist.length} completados
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {currentCandidate.checklist.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleToggleSubtask(st.id)}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-base-200/50 hover:bg-base-200 transition-all text-xs text-left cursor-pointer group"
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-base-content/30 group-hover:text-primary flex-shrink-0" />
                        )}
                        <span
                          className={
                            st.completed
                              ? 'line-through text-base-content/40'
                              : 'text-base-content font-medium'
                          }
                        >
                          {st.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Enlaces a Recursos (Joya 2) ────────────────────── */}
              {currentCandidate.links && currentCandidate.links.length > 0 && (
                <div className="mt-1 pt-3 border-t border-base-200 flex flex-col gap-2">
                  <span className="font-bold text-base-content uppercase tracking-wider text-[11px]">
                    Recursos directos vinculados:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.links.map((lnk) => (
                      <a
                        key={lnk.id}
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-outline btn-info rounded-xl gap-1.5 text-xs font-medium"
                      >
                        {lnk.type === 'drive' ? (
                          <Folder className="w-3 h-3 text-amber-500" />
                        ) : lnk.type === 'meet' || lnk.type === 'teams' || lnk.type === 'zoom' ? (
                          <Video className="w-3 h-3 text-emerald-500" />
                        ) : lnk.type === 'classroom' ? (
                          <BookOpen className="w-3 h-3 text-green-600" />
                        ) : (
                          <Globe className="w-3 h-3 text-primary" />
                        )}
                        <span>{lnk.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Temporizador Pomodoro de Enfoque (25 min) ─────────── */}
            <div className="card bg-base-200/60 border border-base-300 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                  {formatTimer(secondsLeft)}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-base-content">
                    Temporizador Pomodoro (25 min)
                  </h5>
                  <p className="text-[11px] text-base-content/50">
                    {isTimerRunning
                      ? '⏱️ Enfoque activo... concéntrate en esta tarea.'
                      : 'Presiona Iniciar para arrancar tu bloque de concentración.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`btn btn-sm rounded-xl gap-1.5 text-xs font-bold ${
                    isTimerRunning ? 'btn-warning' : 'btn-primary'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false)
                    setSecondsLeft(POMODORO_DEFAULT_SECONDS)
                  }}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Reiniciar temporizador"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Acciones Finales ─────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onHide}
                className="btn btn-ghost btn-sm text-xs rounded-xl"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {activeTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextTask}
                    className="btn btn-outline btn-sm text-xs rounded-xl gap-1.5"
                  >
                    <span>Siguiente tarea</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCompleteCurrent}
                  className="btn btn-success btn-sm text-white rounded-xl gap-1.5 font-bold shadow-md shadow-success/20 text-xs"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Marcar como Completada!</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Dialog>
  )
}
