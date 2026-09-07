import { Plus, Clock, Check, Calendar as CalendarIcon } from 'lucide-react'
import type { Task, TaskStatus } from '@/types/database.types'
import { PRIORITY_META } from '@/types/database.types'


interface CalendarWeekViewProps {
  currentDate: Date
  tasks: Task[]
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onCreateForDate: (dateStr: string) => void
}

const WEEKDAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export function CalendarWeekView({
  currentDate,
  tasks,
  onEdit,
  onStatusChange,
  onCreateForDate,
}: CalendarWeekViewProps) {
  // Encontrar el lunes de la semana actual
  const monday = new Date(currentDate)
  const dayOfWeek = monday.getDay() // 0 domingo, 1 lunes...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + distanceToMonday)

  const todayStr = new Date().toISOString().split('T')[0]

  // Generar los 7 días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const year = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${mm}-${dd}`
    return {
      name: WEEKDAYS[i],
      dayNumber: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
    }
  })

  // Agrupar tareas por fecha y ordenar por due_time
  const tasksByDate = new Map<string, Task[]>()
  for (const task of tasks) {
    if (task.due_date) {
      const list = tasksByDate.get(task.due_date) ?? []
      list.push(task)
      tasksByDate.set(task.due_date, list)
    }
  }

  // Ordenar tareas de cada día por horario
  weekDays.forEach((w) => {
    const list = tasksByDate.get(w.dateStr)
    if (list) {
      list.sort((a, b) => {
        if (!a.due_time) return 1
        if (!b.due_time) return -1
        return a.due_time.localeCompare(b.due_time)
      })
    }
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-base-200 border-b border-base-200 bg-base-100 min-h-[500px]">
      {weekDays.map((day) => {
        const dayTasks = tasksByDate.get(day.dateStr) ?? []

        return (
          <div
            key={day.dateStr}
            className={[
              'flex flex-col p-2.5 transition-colors',
              day.isToday ? 'bg-primary/5' : 'bg-base-100',
            ].join(' ')}
          >
            {/* ── Encabezado de Columna de Día ─────────────────────── */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-200">
              <div className="flex items-center gap-1.5">
                <span
                  className={[
                    'text-xs font-bold px-2 py-0.5 rounded-lg flex items-center justify-center',
                    day.isToday
                      ? 'bg-primary text-primary-content shadow-xs'
                      : 'bg-base-200 text-base-content',
                  ].join(' ')}
                >
                  {day.dayNumber}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    day.isToday ? 'text-primary' : 'text-base-content/70'
                  }`}
                >
                  {day.name}
                </span>
              </div>

              {/* Botón rápido + */}
              <button
                type="button"
                onClick={() => onCreateForDate(day.dateStr)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-primary hover:bg-base-200"
                title={`Nueva tarea para el ${day.name} ${day.dayNumber}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Tarjetas de Tareas del Día ───────────────────────── */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
              {dayTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-base-content/30 text-xs">
                  <CalendarIcon className="w-4 h-4 mb-1 opacity-40" />
                  <p className="text-[11px]">Sin pendientes</p>
                </div>
              ) : (
                dayTasks.map((task) => {
                  const isDone = task.status === 'completada'
                  const pMeta = PRIORITY_META[task.priority]

                  return (
                    <div
                      key={task.id}
                      className={[
                        'p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-all group/card',
                        'hover:shadow-xs hover:border-primary/40 cursor-pointer',
                        isDone
                          ? 'bg-base-200/50 opacity-60 border-base-200'
                          : 'bg-base-100 border-base-200 shadow-2xs',
                      ].join(' ')}
                      onClick={() => onEdit(task)}
                    >
                      {/* Fila 1: Checkbox + Título */}
                      <div className="flex items-start gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onStatusChange(
                              task.id,
                              isDone ? 'pendiente' : 'completada'
                            )
                          }}
                          className={[
                            'mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors',
                            isDone
                              ? 'bg-success border-success text-success-content'
                              : 'border-base-300 hover:border-primary',
                          ].join(' ')}
                        >
                          {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>

                        <span
                          className={`font-semibold leading-tight line-clamp-2 ${
                            isDone ? 'line-through text-base-content/40' : 'text-base-content'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Fila 2: Hora + Prioridad */}
                      <div className="flex items-center justify-between gap-1 text-[10px] text-base-content/60 pt-1 border-t border-base-200/60">
                        {task.due_time ? (
                          <span className="flex items-center gap-1 font-medium text-base-content/70">
                            <Clock className="w-2.5 h-2.5 opacity-60" />
                            {task.due_time.substring(0, 5)}
                          </span>
                        ) : (
                          <span className="text-base-content/30 italic">Todo el día</span>
                        )}

                        <span
                          className={`badge badge-xs ${
                            pMeta?.badgeClass ?? 'badge-ghost'
                          } font-bold text-[9px]`}
                        >
                          Q{pMeta?.quadrant ?? 4}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Botón inferior para añadir rápido */}
            <button
              type="button"
              onClick={() => onCreateForDate(day.dateStr)}
              className="mt-2 w-full py-1 text-[11px] font-medium text-base-content/50 hover:text-primary hover:bg-base-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Añadir
            </button>
          </div>
        )
      })}
    </div>
  )
}
