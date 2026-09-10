import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  Columns3,
} from 'lucide-react'
import type { Task, TaskStatus } from '@/types/database.types'
import { CalendarMonthView } from './CalendarMonthView'
import { CalendarWeekView } from './CalendarWeekView'

interface TaskCalendarProps {
  tasks: Task[]
  loading?: boolean
  onEdit: (task: Task) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onCreateForDate: (dateStr: string) => void
}

type CalendarSubView = 'mes' | 'semana'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function TaskCalendar({
  tasks,
  loading = false,
  onEdit,
  onStatusChange,
  onCreateForDate,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [subView, setSubView] = useState<CalendarSubView>('mes')

  const handlePrev = () => {
    const d = new Date(currentDate)
    if (subView === 'mes') {
      d.setMonth(d.getMonth() - 1)
    } else {
      d.setDate(d.getDate() - 7)
    }
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (subView === 'mes') {
      d.setMonth(d.getMonth() + 1)
    } else {
      d.setDate(d.getDate() + 7)
    }
    setCurrentDate(d)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const monthLabel = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  // Conteo de tareas con fecha
  const scheduledCount = tasks.filter((t) => t.due_date).length

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
      {/* ── Barra de Navegación del Calendario ────────────────────── */}
      <div id="tour-calendar-controls" className="p-4 border-b border-base-200 flex items-center justify-between flex-wrap gap-3 bg-base-100">
        {/* Título de Mes/Año y Botón Hoy */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-base font-bold text-base-content capitalize">
              {monthLabel}
            </h3>
            <p className="text-xs text-base-content/50">
              {scheduledCount} {scheduledCount === 1 ? 'actividad agendada' : 'actividades agendadas'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="btn btn-outline btn-xs rounded-lg ml-2 font-semibold"
          >
            Hoy
          </button>
        </div>

        {/* Controles de Navegación y Selector Mes/Semana */}
        <div className="flex items-center gap-2">
          {/* Selector de sub-vista */}
          <div className="flex items-center bg-base-200 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setSubView('mes')}
              className={[
                'btn btn-xs rounded-lg gap-1.5',
                subView === 'mes'
                  ? 'btn-primary shadow-xs'
                  : 'btn-ghost text-base-content/70',
              ].join(' ')}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Mes
            </button>
            <button
              type="button"
              onClick={() => setSubView('semana')}
              className={[
                'btn btn-xs rounded-lg gap-1.5',
                subView === 'semana'
                  ? 'btn-primary shadow-xs'
                  : 'btn-ghost text-base-content/70',
              ].join(' ')}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Semana
            </button>
          </div>

          {/* Flechas Anterior / Siguiente */}
          <div className="join border border-base-300 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              className="join-item btn btn-xs btn-ghost px-2.5"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="join-item btn btn-xs btn-ghost px-2.5"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido de la Vista Activa ─────────────────────────── */}
      <div id="tour-calendar-grid">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-md text-primary" />
            <span className="text-xs text-base-content/50">Cargando calendario...</span>
          </div>
        ) : subView === 'mes' ? (
          <CalendarMonthView
            currentDate={currentDate}
            tasks={tasks}
            onEdit={onEdit}
            onCreateForDate={onCreateForDate}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            tasks={tasks}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onCreateForDate={onCreateForDate}
          />
        )}
      </div>
    </div>
  )
}
