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
  Users,
  Package,
} from 'lucide-react'
import type { Task, TaskStatus, UpdateTaskInput } from '@/types/database.types'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { useFocusTimer } from '@/context/FocusTimerContext'
import { soundEngine } from '@/utils/audioEffects'
import { triggerConfetti } from '@/utils/confetti'
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
  const [selectedDuration, setSelectedDuration] = useState<number>(25)
  const focusTimer = useFocusTimer()

  // Sincronizar índice con la tarea activa del temporizador si ya está en ejecución
  useEffect(() => {
    if (visible && focusTimer.activeTask) {
      const foundIdx = activeTasks.findIndex((t) => t.task.id === focusTimer.activeTask!.id)
      if (foundIdx !== -1) {
        setCurrentIndex(foundIdx)
      }
    }
  }, [visible, focusTimer.activeTask])

  useEffect(() => {
    if (activeTasks.length > 0 && currentIndex >= activeTasks.length) {
      setCurrentIndex(Math.max(0, activeTasks.length - 1))
    }
  }, [activeTasks.length, currentIndex])

  const currentCandidate = activeTasks[currentIndex]?.task || null

  const handleNextTask = () => {
    if (activeTasks.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeTasks.length)
    }
  }

  const handleCompleteCurrent = () => {
    if (!currentCandidate) return

    if (focusTimer.activeTask?.id === currentCandidate.id) {
      focusTimer.completeCurrentTask()
    } else {
      onUpdateStatus(currentCandidate.id, 'completada')
      toast.success('🏆 ¡Excelente trabajo! Tarea marcada como completada.', {
        duration: 3500,
        icon: '👏',
      })
    }

    // Ajustar de forma segura el índice sin desbordar los límites del arreglo
    setCurrentIndex((prev) => {
      const nextMax = activeTasks.length - 2
      return nextMax < 0 ? 0 : Math.min(prev, nextMax)
    })
  }

  const handleToggleSubtask = (subtaskId: string) => {
    if (!currentCandidate || !currentCandidate.checklist) return
    const updatedChecklist = currentCandidate.checklist.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    onUpdateTask(currentCandidate.id, { checklist: updatedChecklist })

    const toggledItem = updatedChecklist.find((st) => st.id === subtaskId)
    if (toggledItem?.completed) {
      soundEngine.playSuccessChime()
      if (updatedChecklist.every((st) => st.completed)) {
        triggerConfetti()
        toast.success('🎉 ¡Todos los pasos de la actividad completados!', { icon: '🌟' })
      }
    }
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
                    {(currentCandidate.start_time || currentCandidate.due_time) && (
                      <span className="text-base-content/60">
                        ({currentCandidate.start_time || currentCandidate.due_time}
                        {currentCandidate.end_time ? ` - ${currentCandidate.end_time}` : ''})
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

              {/* Participantes Involucrados */}
              {currentCandidate.participants && currentCandidate.participants.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                  <span className="font-bold text-base-content/60 text-[11px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-primary" /> Involucrados:
                  </span>
                  {currentCandidate.participants.map((p, i) => (
                    <span key={i} className="badge badge-xs badge-outline border-primary/30 text-primary">
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Materiales y Recursos Requeridos */}
              {currentCandidate.materials && currentCandidate.materials.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-bold text-base-content/60 text-[11px] flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-500" /> Materiales:
                  </span>
                  {currentCandidate.materials.map((m, i) => (
                    <span key={i} className="badge badge-xs badge-outline border-amber-500/30 text-amber-700 dark:text-amber-300">
                      {m}
                    </span>
                  ))}
                </div>
              )}

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

            {/* ── Temporizador Pomodoro de Enfoque con Colores Reactivos ─────────── */}
            {(() => {
              const isCandidateFocused = focusTimer.activeTask?.id === currentCandidate.id
              const displaySeconds = isCandidateFocused ? focusTimer.secondsLeft : (focusTimer.totalSeconds || 25 * 60)
              const isRunning = isCandidateFocused && focusTimer.isTimerRunning
              const progressRatio = focusTimer.totalSeconds > 0 ? displaySeconds / focusTimer.totalSeconds : 0

              let timerColorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
              if (progressRatio <= 0.2) {
                timerColorClass = 'text-rose-500 bg-rose-500/15 border-rose-500/40 shadow-rose-500/25 shadow-md'
              } else if (progressRatio <= 0.5) {
                timerColorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30'
              }

              return (
                <div className="card bg-base-200/60 border border-base-300 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base border transition-all ${timerColorClass} ${progressRatio <= 0.2 && isRunning ? 'animate-pulse' : ''}`}>
                      {formatTimer(displaySeconds)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-base-content">
                          Temporizador de Enfoque Pomodoro
                        </h5>
                        {isCandidateFocused && (
                          <span className="badge badge-primary badge-xs font-bold text-[10px]">
                            Tarea Activa
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-base-content/60">
                        {isRunning
                          ? '⏱️ Bloque de concentración activo. Permanece en segundo plano si cierras.'
                          : 'Inicia el cronómetro para superponerlo en toda la pantalla.'}
                      </p>

                      {/* Chips de duración preestablecida */}
                      {!isRunning && !isCandidateFocused && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] text-base-content/50 font-bold uppercase">Duración:</span>
                          {[15, 25, 45, 60].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedDuration(m)}
                              className={`badge badge-sm cursor-pointer transition-all ${
                                selectedDuration === m
                                  ? 'badge-primary text-white font-bold shadow-2xs'
                                  : 'badge-ghost text-base-content/70 hover:badge-outline'
                              }`}
                            >
                              {m} min
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCandidateFocused) {
                          if (focusTimer.isTimerRunning) {
                            focusTimer.pauseTimer()
                          } else {
                            focusTimer.resumeTimer()
                          }
                        } else {
                          focusTimer.startFocus(currentCandidate, selectedDuration)
                        }
                      }}
                      className={`btn btn-sm rounded-xl gap-1.5 text-xs font-bold ${
                        isRunning ? 'btn-warning' : 'btn-primary'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isCandidateFocused ? 'Reanudar' : 'Iniciar Enfoque'}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => focusTimer.resetTimer()}
                      className="btn btn-ghost btn-sm btn-circle"
                      title="Reiniciar temporizador"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })()}

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
