import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, LayoutList, CalendarDays,
  Grid2x2, Settings, X,
} from 'lucide-react'
import { useTasks, useTasksRealtime } from '@/hooks/useTasks'
import { useAuth } from '@/context/AuthContext'
import { Shield } from 'lucide-react'

const SUPER_ADMIN_EMAILS = [
  'ronaldo22amador@gmail.com',
  'marlon21ronaldo@gmail.com',
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  const isSuperAdmin =
    SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '') ||
    user?.app_metadata?.role === 'super_admin' ||
    user?.user_metadata?.role === 'super_admin'

  // Sincronización reactiva en tiempo real
  useTasksRealtime()

  // Caché compartido de tareas activas (actualización instantánea sin recargar)
  const { data: tasksData } = useTasks()
  const activeTasks = (tasksData?.data ?? []).filter(
    (t) => t.status === 'pendiente' || t.status === 'en_curso'
  )
  const pendingCount = activeTasks.length

  const navItems = [
    { to: '/',           icon: LayoutDashboard, label: 'Dashboard',     end: true },
    { to: '/tareas',     icon: LayoutList,      label: 'Tareas',        end: false, badge: pendingCount > 0 ? String(pendingCount) : undefined },
    { to: '/calendario', icon: CalendarDays,    label: 'Calendario',    end: false },
    { to: '/matriz',     icon: Grid2x2,         label: 'Matriz',        end: false },
    { to: '/config',     icon: Settings,        label: 'Configuración', end: false },
    ...(isSuperAdmin ? [{ to: '/admin', icon: Shield, label: 'Panel Admin', end: false, badge: 'SUPER', badgeClass: 'badge-warning text-warning-content' }] : []),
  ]

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-full w-60 bg-base-100 border-r border-base-200 z-40 flex flex-col',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AgendaPro" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
            <span className="font-bold text-base tracking-tight text-base-content">AgendaPro</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegación */}
        <nav id="tour-sidebar-nav" className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ to, icon: Icon, label, end, badge }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => [
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                  ].join(' ')}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className={`badge badge-xs font-bold px-1.5 py-0.5 text-[10px] rounded-full shadow-xs ${'badgeClass' in navItems.find(n => n.to === to)! ? 'bg-primary text-primary-content font-extrabold' : 'badge-primary'}`}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>


      </aside>
    </>
  )
}

