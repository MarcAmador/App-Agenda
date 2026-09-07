import { useMemo } from 'react'
import { Sparkles, Info, ArrowUpRight } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types/database.types'
import { MatrixQuadrant } from './MatrixQuadrant'

interface EisenhowerMatrixProps {
  tasks: Task[]
  loading?: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: TaskPriority) => void
  onQuickAdd: (priority?: TaskPriority) => void
}

export function EisenhowerMatrix({
  tasks,
  loading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onQuickAdd,
}: EisenhowerMatrixProps) {
  // Tareas clasificadas por cuadrante
  const q1Tasks = useMemo(
    () => tasks.filter((t) => t.priority === 'urgente_importante'),
    [tasks]
  )
  const q2Tasks = useMemo(
    () => tasks.filter((t) => t.priority === 'importante_no_urgente'),
    [tasks]
  )
  const q3Tasks = useMemo(
    () => tasks.filter((t) => t.priority === 'urgente_no_importante'),
    [tasks]
  )
  const q4Tasks = useMemo(
    () => tasks.filter((t) => t.priority === 'no_urgente_baja'),
    [tasks]
  )

  const total = tasks.length

  // Cálculo porcentual para la barra de distribución
  const q1Pct = total > 0 ? Math.round((q1Tasks.length / total) * 100) : 0
  const q2Pct = total > 0 ? Math.round((q2Tasks.length / total) * 100) : 0
  const q3Pct = total > 0 ? Math.round((q3Tasks.length / total) * 100) : 0
  const q4Pct = total > 0 ? Math.round((q4Tasks.length / total) * 100) : 0

  // Diagnóstico de balance del coordinador académico
  const getInsight = () => {
    if (total === 0) return 'Sin tareas registradas actualmente. ¡Crea una para comenzar!'
    if (q2Pct >= 40) {
      return '¡Excelente balance! Estás dedicando la mayor parte de tu energía a la planificación y desarrollo estratégico (Q2).'
    }
    if (q1Pct >= 50) {
      return 'Alerta de sobrecarga: más del 50% de tus tareas están en crisis o fechas límite (Q1). Procura programar descansos y delegar.'
    }
    if (q3Pct >= 35) {
      return 'Alta carga de interrupciones o trámites delegables (Q3). Revisa qué actividades puedes reasignar.'
    }
    return 'Distribución equilibrada. Arrastra las tareas entre cuadrantes para redefinir prioridades.'
  }

  const handleDropTask = (taskId: string, targetPriority: TaskPriority) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.priority !== targetPriority) {
      onPriorityChange(taskId, targetPriority)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Barra de Estadísticas y Distribución ─────────────────── */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4.5 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Distribución de Tiempo y Prioridades
              </h3>
              <p className="text-xs text-base-content/50">
                {total} {total === 1 ? 'tarea activa' : 'tareas activas'} en la matriz
              </p>
            </div>
          </div>

          {/* Badges de conteo por cuadrante */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="badge badge-sm badge-error gap-1 font-medium">
              Q1 Hacer Ya: {q1Tasks.length} ({q1Pct}%)
            </span>
            <span className="badge badge-sm badge-success gap-1 font-medium">
              Q2 Planificar: {q2Tasks.length} ({q2Pct}%)
            </span>
            <span className="badge badge-sm badge-warning gap-1 font-medium">
              Q3 Delegar: {q3Tasks.length} ({q3Pct}%)
            </span>
            <span className="badge badge-sm badge-ghost gap-1 font-medium">
              Q4 Baja: {q4Tasks.length} ({q4Pct}%)
            </span>
          </div>
        </div>

        {/* Barra de progreso segmentada continua */}
        <div className="w-full h-2.5 bg-base-200 rounded-full overflow-hidden flex shadow-inner">
          {q1Pct > 0 && (
            <div
              style={{ width: `${q1Pct}%` }}
              className="bg-error h-full transition-all duration-500"
              title={`Q1 Urgente e Importante: ${q1Pct}%`}
            />
          )}
          {q2Pct > 0 && (
            <div
              style={{ width: `${q2Pct}%` }}
              className="bg-success h-full transition-all duration-500"
              title={`Q2 Importante No Urgente: ${q2Pct}%`}
            />
          )}
          {q3Pct > 0 && (
            <div
              style={{ width: `${q3Pct}%` }}
              className="bg-warning h-full transition-all duration-500"
              title={`Q3 Urgente No Importante: ${q3Pct}%`}
            />
          )}
          {q4Pct > 0 && (
            <div
              style={{ width: `${q4Pct}%` }}
              className="bg-base-content/30 h-full transition-all duration-500"
              title={`Q4 Baja Prioridad: ${q4Pct}%`}
            />
          )}
        </div>

        {/* Insight / Consejo para el coordinador */}
        <div className="mt-3 pt-2.5 border-t border-base-200 flex items-center gap-2 text-xs text-base-content/70">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="flex-1">{getInsight()}</span>
          <span className="text-[11px] text-base-content/40 hidden sm:inline-flex items-center gap-1">
            Arrastra tarjetas entre cuadrantes para reclasificar <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ── Cuadrícula 2x2 de la Matriz de Eisenhower ────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[360px] rounded-2xl bg-base-200/50 animate-pulse border border-base-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {/* Q1: Urgente e Importante */}
          <MatrixQuadrant
            priority="urgente_importante"
            tasks={q1Tasks}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDropTask={handleDropTask}
            onQuickAdd={(p) => onQuickAdd(p)}
          />

          {/* Q2: Importante, No Urgente */}
          <MatrixQuadrant
            priority="importante_no_urgente"
            tasks={q2Tasks}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDropTask={handleDropTask}
            onQuickAdd={(p) => onQuickAdd(p)}
          />

          {/* Q3: Urgente, No Importante */}
          <MatrixQuadrant
            priority="urgente_no_importante"
            tasks={q3Tasks}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDropTask={handleDropTask}
            onQuickAdd={(p) => onQuickAdd(p)}
          />

          {/* Q4: No Urgente, Ni Importante */}
          <MatrixQuadrant
            priority="no_urgente_baja"
            tasks={q4Tasks}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onPriorityChange={onPriorityChange}
            onDropTask={handleDropTask}
            onQuickAdd={(p) => onQuickAdd(p)}
          />
        </div>
      )}
    </div>
  )
}
