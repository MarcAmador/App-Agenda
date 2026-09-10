import { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import type { Task, TaskPriority } from '@/types/database.types'
import { PRIORITY_META } from '@/types/database.types'


interface CalendarMonthViewProps {
  currentDate: Date
  tasks: Task[]
  onEdit: (task: Task) => void
  onCreateForDate: (dateStr: string) => void
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface CalendarDay {
  date: Date
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function CalendarMonthView({
  currentDate,
  tasks,
  onEdit,
  onCreateForDate,
}: CalendarMonthViewProps) {
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ dateStr: string; tasks: Task[] } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generación de los días de la cuadrícula (Lunes a Domingo)
  const days: CalendarDay[] = []

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const prevMonthLastDay = new Date(year, month, 0).getDate()

  // getDay() devuelve 0 para domingo, 1 para lunes...
  // Convertir a lunes = 0, domingo = 6
  let firstDayIndex = firstDayOfMonth.getDay() - 1
  if (firstDayIndex === -1) firstDayIndex = 6

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Días del mes anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const prevYear = month === 0 ? year - 1 : year
    const prevMonth = month === 0 ? 12 : month
    const mm = String(prevMonth).padStart(2, '0')
    const dd = String(dayNum).padStart(2, '0')
    const dateStr = `${prevYear}-${mm}-${dd}`
    days.push({
      date: new Date(prevYear, prevMonth - 1, dayNum),
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  // Días del mes actual
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i)
    // Formatear manualmente con padStart para evitar desfaces de timezone
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(i).padStart(2, '0')
    const dateStr = `${year}-${mm}-${dd}`
    days.push({
      date: d,
      dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    })
  }

  // Días del mes siguiente para completar múltiplos de 7
  const remainingCells = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i)
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonth = month === 11 ? 1 : month + 2
    const mm = String(nextMonth).padStart(2, '0')
    const dd = String(i).padStart(2, '0')
    const dateStr = `${nextMonthYear}-${mm}-${dd}`
    days.push({
      date: d,
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    })
  }

  // Mapeo rápido de tareas por fecha YYYY-MM-DD
  const tasksByDate = new Map<string, Task[]>()
  for (const task of tasks) {
    if (task.due_date) {
      const list = tasksByDate.get(task.due_date) ?? []
      list.push(task)
      tasksByDate.set(task.due_date, list)
    }
  }

  const getPriorityDot = (p: TaskPriority) => {
    switch (p) {
      case 'urgente_importante':    return 'bg-error'
      case 'importante_no_urgente': return 'bg-success'
      case 'urgente_no_importante': return 'bg-warning'
      case 'no_urgente_baja':       return 'bg-base-content/40'
    }
  }

  return (
    <div className="flex flex-col">
      {/* ── Encabezado de Días de la Semana ─────────────────────── */}
      <div className="grid grid-cols-7 border-b border-base-200 bg-base-200/50 text-center py-2.5">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`text-xs font-semibold tracking-wider uppercase ${
              idx >= 5 ? 'text-base-content/40' : 'text-base-content/70'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Cuadrícula de Celdas Mensuales ───────────────────────── */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-base-200 border-b border-r border-base-200">
        {days.map((day) => {
          const dayTasks = tasksByDate.get(day.dateStr) ?? []
          const visibleTasks = dayTasks.slice(0, 3)
          const overflowCount = dayTasks.length - 3

          return (
            <div
              key={day.dateStr}
              onClick={() => onCreateForDate(day.dateStr)}
              className={[
                'min-h-[105px] p-2 flex flex-col justify-between transition-colors duration-150 group cursor-pointer relative',
                day.isCurrentMonth
                  ? 'bg-base-100 hover:bg-base-200/40'
                  : 'bg-base-200/20 text-base-content/30 hover:bg-base-200/50',
                day.isToday ? 'ring-2 ring-inset ring-primary/40' : '',
              ].join(' ')}
            >
              {/* Header de la celda: Número de día + Botón rápido */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={[
                    'text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                    day.isToday
                      ? 'bg-primary text-primary-content font-bold shadow-xs'
                      : day.isCurrentMonth
                      ? 'text-base-content'
                      : 'text-base-content/30',
                  ].join(' ')}
                >
                  {day.dayNumber}
                </span>

                {/* Botón rápido de agregar tarea en este día */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateForDate(day.dateStr)
                  }}
                  className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 min-h-0 text-base-content/60 hover:text-primary"
                  title={`Añadir tarea para el ${day.dateStr}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista de píldoras de tareas */}
              <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                {visibleTasks.map((task) => {
                  const isDone = task.status === 'completada'
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(task)
                      }}
                      className={[
                        'w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1.5 transition-all',
                        'hover:scale-[1.02] active:scale-[0.98] border',
                        isDone
                          ? 'bg-base-200 text-base-content/40 line-through border-transparent'
                          : 'bg-base-100 hover:bg-base-200 text-base-content border-base-300/80 shadow-2xs',
                      ].join(' ')}
                      title={`${task.title} (${PRIORITY_META[task.priority]?.label})`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityDot(
                          task.priority
                        )}`}
                      />
                      {task.due_time && (
                        <span className="text-[10px] text-base-content/50 flex-shrink-0">
                          {task.due_time.substring(0, 5)}
                        </span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </button>
                  )
                })}

                {/* Overflow "+N más" */}
                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDayTasks({ dateStr: day.dateStr, tasks: dayTasks })
                    }}
                    className="text-[10px] font-semibold text-primary hover:underline self-start px-1"
                  >
                    +{overflowCount} más...
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal de Detalle de Día (para ver todas las tareas cuando hay overflow) ── */}
      {selectedDayTasks && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 border border-base-200">
            <h3 className="font-bold text-base text-base-content flex items-center justify-between">
              <span>Tareas del {selectedDayTasks.dateStr}</span>
              <span className="badge badge-sm badge-primary font-normal">
                {selectedDayTasks.tasks.length} total
              </span>
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Haz clic en cualquier tarea para editarla o en el botón inferior para crear otra.
            </p>

            <div className="flex flex-col gap-2 mt-4 max-h-[340px] overflow-y-auto">
              {selectedDayTasks.tasks.map((task) => {
                const isDone = task.status === 'completada'
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedDayTasks(null)
                      onEdit(task)
                    }}
                    className={[
                      'p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer hover:border-primary/40 transition-all',
                      isDone ? 'bg-base-200/50 opacity-60' : 'bg-base-100 shadow-2xs',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(
                          task.priority
                        )}`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isDone ? 'line-through text-base-content/40' : 'text-base-content'
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.due_time && (
                          <span className="text-[10px] text-base-content/50 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.due_time.substring(0, 5)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`badge badge-xs ${
                        PRIORITY_META[task.priority]?.badgeClass ?? 'badge-ghost'
                      }`}
                    >
                      {PRIORITY_META[task.priority]?.label.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="modal-action flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDayTasks.dateStr
                  setSelectedDayTasks(null)
                  onCreateForDate(d)
                }}
                className="btn btn-sm btn-primary gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </button>
              <button
                type="button"
                onClick={() => setSelectedDayTasks(null)}
                className="btn btn-sm btn-ghost"
              >
                Cerrar
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedDayTasks(null)} />
        </div>
      )}
    </div>
  )
}
