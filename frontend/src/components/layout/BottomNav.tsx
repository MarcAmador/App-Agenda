import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LayoutList, CalendarDays, LayoutGrid, Plus } from 'lucide-react'
import { useUiPreferences } from '@/context/UiPreferencesContext'
import { useTasks } from '@/hooks/useTasks'

interface BottomNavProps {
  onOpenNewTask: () => void
}

export function BottomNav({ onOpenNewTask }: BottomNavProps) {
  const { isFeatureVisible } = useUiPreferences()
  const { data: tasksData } = useTasks()

  const pendingCount = (tasksData?.data ?? []).filter(
    (t) => t.status === 'pendiente' || t.status === 'en_curso'
  ).length

  const showKanban = isFeatureVisible('viewModeKanban')
  const showCalendario = isFeatureVisible('viewModeCalendario')

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-base-100/95 backdrop-blur-xl border-t border-base-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-primary font-bold'
                : 'text-base-content/60 hover:text-base-content font-medium'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Inicio</span>
        </NavLink>

        {/* 2. Tareas */}
        <NavLink
          to="/tareas"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all ${
              isActive
                ? 'text-primary font-bold'
                : 'text-base-content/60 hover:text-base-content font-medium'
            }`
          }
        >
          <div className="relative">
            <LayoutList className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Tareas</span>
        </NavLink>

        {/* 3. Botón Central Destacado (+ Nueva Tarea) */}
        <button
          type="button"
          onClick={onOpenNewTask}
          className="flex flex-col items-center justify-center -mt-5 group"
          aria-label="Crear nueva tarea"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/35 active:scale-95 transition-transform group-hover:scale-105">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-primary mt-0.5">Nueva</span>
        </button>

        {/* 4. Kanban (o Calendario) */}
        {showKanban ? (
          <NavLink
            to="/kanban"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-base-content/60 hover:text-base-content font-medium'
              }`
            }
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Kanban</span>
          </NavLink>
        ) : showCalendario ? (
          <NavLink
            to="/calendario"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-base-content/60 hover:text-base-content font-medium'
              }`
            }
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Agenda</span>
          </NavLink>
        ) : null}

        {/* 5. Calendario */}
        {showKanban && showCalendario && (
          <NavLink
            to="/calendario"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-base-content/60 hover:text-base-content font-medium'
              }`
            }
          >
            <CalendarDays className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Agenda</span>
          </NavLink>
        )}
      </div>
    </nav>
  )
}
