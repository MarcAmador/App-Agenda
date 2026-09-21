/**
 * CalendarWeekView v2 — Vista semanal premium con drag-and-drop por hora
 * Permite: ver tareas en la hora correcta, arrastrar para cambiar hora/día,
 *           y crear tareas arrastrando en espacio vacío.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '@/types/database.types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOUR_HEIGHT = 60 // px por hora

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(date: Date): Date[] {
  const days = []
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  d.setDate(d.getDate() - dayOfWeek)
  for (let i = 0; i < 7; i++) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function isToday(d: Date): boolean {
  return isoDate(d) === isoDate(new Date())
}

// ─── Draggable Task Chip ──────────────────────────────────────────────────────

interface TaskChipProps {
  task: Task
  topPx: number
  heightPx: number
  onEdit: (task: Task) => void
}

function TaskChip({ task, topPx, heightPx, onEdit }: TaskChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isSortDragging } = useDraggable({ id: task.id })
  const style = {
    transform: CSS.Translate.toString(transform),
    top: `${topPx}px`,
    height: `${Math.max(heightPx, 28)}px`,
    opacity: isSortDragging ? 0.4 : 1,
  }
  const priorityColor = {
    urgente_importante:    'border-l-error bg-error/10',
    importante_no_urgente: 'border-l-success bg-success/10',
    urgente_no_importante: 'border-l-warning bg-warning/10',
    no_urgente_baja:       'border-l-base-content/20 bg-base-200',
  }[task.priority] ?? 'border-l-primary bg-primary/10'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onEdit(task) }}
      className={`calendar-event-chip ${priorityColor}`}
      title={task.title}
    >
      <p className="truncate font-semibold text-base-content">{task.title}</p>
      {heightPx > 40 && task.category && (
        <p className="text-[10px] text-base-content/50 truncate">{task.category}</p>
      )}
    </div>
  )
}

// ─── Droppable Time Slot ──────────────────────────────────────────────────────

interface TimeSlotProps {
  id: string
  dateStr: string
  hour: number
  tasks: Task[]
  onCreateForDate: (dateStr: string) => void
  onEdit: (task: Task) => void
}

function TimeSlot({ id, dateStr, hour, tasks, onCreateForDate, onEdit }: TimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [showAdd, setShowAdd] = useState(false)

  // Filtrar tareas que comienzan en esta hora
  const slotTasks = tasks.filter((t) => {
    const start = t.start_time ?? t.due_time
    if (!start) return false
    const [h] = start.split(':').map(Number)
    return h === hour
  })

  return (
    <div
      ref={setNodeRef}
      className="calendar-time-slot border-r border-base-300/40 relative"
      data-drag-over={isOver}
      onMouseEnter={() => setShowAdd(true)}
      onMouseLeave={() => setShowAdd(false)}
      onClick={() => onCreateForDate(dateStr)}
    >
      {/* Tasks rendered in this slot */}
      {slotTasks.map((task) => {
        const startMin = timeToMinutes(task.start_time ?? task.due_time) ?? (hour * 60)
        const endMin = task.end_time ? (timeToMinutes(task.end_time) ?? startMin + 60) : startMin + 60
        const topOffset = (startMin % 60) * (HOUR_HEIGHT / 60)
        const heightPx = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 28)
        return (
          <TaskChip
            key={task.id}
            task={task}
            topPx={topOffset}
            heightPx={heightPx}
            onEdit={onEdit}
          />
        )
      })}

      {/* Quick add button on hover */}
      {showAdd && slotTasks.length === 0 && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onCreateForDate(dateStr) }}
        >
          <span className="flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/8 rounded-md px-2 py-1">
            <Plus className="w-3 h-3" /> {formatHour(hour)}
          </span>
        </button>
      )}
    </div>
  )
}

interface AllDaySlotProps {
  dateStr: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onCreateForDate: (dateStr: string) => void
}

function AllDaySlot({ dateStr, tasks, onEdit, onCreateForDate }: AllDaySlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `allday-${dateStr}` })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[44px] p-1.5 border-l border-base-200 flex flex-col gap-1 transition-colors ${
        isOver ? 'bg-primary/15 ring-1 ring-primary' : 'bg-base-200/20'
      }`}
    >
      {tasks.map((t) => (
        <div
          key={t.id}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(t)
          }}
          className="text-[10px] px-2 py-0.5 bg-primary/15 text-primary border border-primary/20 rounded-md font-semibold truncate cursor-pointer hover:bg-primary/25 transition-all shadow-2xs"
          title={t.title}
        >
          {t.title}
        </div>
      ))}
      {tasks.length === 0 && (
        <button
          type="button"
          onClick={() => onCreateForDate(dateStr)}
          className="w-full h-full min-h-[26px] rounded border border-dashed border-base-300/60 opacity-0 hover:opacity-100 flex items-center justify-center text-[9px] text-base-content/50 hover:text-primary transition-all"
        >
          <Plus className="w-2.5 h-2.5 mr-0.5" /> Sin hora
        </button>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarWeekViewProps {
  currentDate: Date
  tasks: Task[]
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onCreateForDate: (dateStr: string) => void
  onUpdateTaskTime?: (id: string, dateStr: string, startTime: string) => void
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function CalendarWeekView({
  currentDate,
  tasks,
  onEdit,
  onCreateForDate,
  onUpdateTaskTime,
}: CalendarWeekViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const weekDays = getWeekDays(currentDate)
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  // Filtrar tareas con fecha para mostrar en la semana
  const tasksWithTime = tasks.filter((t) => t.due_date && (t.start_time || t.due_time))
  const tasksWithoutTime = tasks.filter((t) => t.due_date && !(t.start_time || t.due_time))

  const getTasksForDay = useCallback((dateStr: string) => {
    return tasksWithTime.filter((t) => t.due_date === dateStr)
  }, [tasksWithTime])

  const getTimelessTasksForDay = useCallback((dateStr: string) => {
    return tasksWithoutTime.filter((t) => t.due_date === dateStr)
  }, [tasksWithoutTime])

  // Scroll a hora actual al montar
  useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours()
      scrollRef.current.scrollTop = Math.max(0, (currentHour - 1) * HOUR_HEIGHT)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || !onUpdateTaskTime) return

    const overId = String(over.id)
    if (overId.startsWith('allday-')) {
      const dateStr = overId.replace('allday-', '')
      onUpdateTaskTime(String(active.id), dateStr, '')
      return
    }

    const parts = overId.split('-')
    if (parts.length < 4) return

    const hour = parseInt(parts[3], 10)
    const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`
    const newStartTime = minutesToTime(hour * 60)

    onUpdateTaskTime(String(active.id), dateStr, newStartTime)
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">

        {/* Header días de la semana */}
        <div className="grid sticky top-0 z-10 bg-base-100 border-b border-base-300" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="text-[9px] text-base-content/30 p-2 flex items-end justify-end pr-2">GMT-6</div>
          {weekDays.map((day) => {
            const today = isToday(day)
            return (
              <div key={isoDate(day)} className="text-center py-2 border-l border-base-200">
                <p className="text-[10px] font-semibold text-base-content/50 uppercase">
                  {DAY_LABELS[day.getDay()]}
                </p>
                <div className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all ${today ? 'bg-primary text-primary-content' : 'text-base-content'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Fila Todo el Día / Sin Hora */}
        <div className="grid bg-base-100/90 border-b border-base-300" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="text-[9px] font-bold text-base-content/50 p-2 flex items-center justify-end pr-2 uppercase">
            Sin hora
          </div>
          {weekDays.map((day) => {
            const dateStr = isoDate(day)
            return (
              <AllDaySlot
                key={`allday-col-${dateStr}`}
                dateStr={dateStr}
                tasks={getTimelessTasksForDay(dateStr)}
                onEdit={onEdit}
                onCreateForDate={onCreateForDate}
              />
            )
          })}
        </div>

        {/* Grid de horas */}
        <div
          ref={scrollRef}
          className="overflow-y-auto flex-1"
          style={{ maxHeight: 'calc(100vh - 320px)' }}
        >
          <div style={{ gridTemplateColumns: '60px repeat(7, 1fr)', display: 'grid' }}>
            {HOURS.flatMap((hour) => [
              <div
                key={`hour-label-${hour}`}
                className="border-b border-r border-base-300/30 flex items-start justify-end pr-2 pt-1"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] text-base-content/35 font-medium">
                  {formatHour(hour)}
                </span>
              </div>,
              ...weekDays.map((day) => {
                const dateStr = isoDate(day)
                const slotId = `${dateStr}-${hour}`
                return (
                  <TimeSlot
                    key={slotId}
                    id={slotId}
                    dateStr={dateStr}
                    hour={hour}
                    tasks={getTasksForDay(dateStr)}
                    onCreateForDate={onCreateForDate}
                    onEdit={onEdit}
                  />
                )
              }),
            ])}
          </div>
        </div>
      </div>

      {/* Overlay de arrastre */}
      <DragOverlay>
        {activeTask ? (
          <div className="calendar-event-chip bg-primary/20 border-l-primary shadow-xl" style={{ position: 'static', width: '160px' }}>
            <p className="truncate font-semibold text-primary text-xs">{activeTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
