import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { TasksView } from '@/components/tasks/TasksView'
import { Link } from 'react-router-dom'
import { CalendarDays, Grid2x2, Settings, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = (user?.user_metadata?.full_name as string)?.split(' ')[0] ?? 'Coordinador'

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="flex flex-col gap-8 animate-fade-in">

        {/* Bienvenida */}
        <div id="tour-welcome" className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-base-content">
              Hola, {firstName} 👋
            </h2>
            <p className="text-base-content/60 text-sm mt-1">
              Aquí está tu resumen de actividades académicas de hoy.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-base-content/40">
            <CalendarDays className="w-4 h-4" />
            {new Date().toLocaleDateString('es-GT', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </div>
        </div>

        {/* Vista de Tareas incrustada en el Dashboard */}
        <TasksView />

        {/* Módulos y accesos rápidos */}
        <div>
          <h3 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide mb-3">
            Módulos del Sistema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Calendario (Activo - Fase 4) */}
            <Link
              to="/calendario"
              className="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <div className="card-body p-4.5 flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-base-content group-hover:text-primary transition-colors">
                      Calendario
                    </h4>
                    <ArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-base-content/50 truncate mt-0.5">
                    Vista mensual y semanal de actividades
                  </p>
                </div>
              </div>
            </Link>

            {/* Matriz Eisenhower (Activo - Fase 4) */}
            <Link
              to="/matriz"
              className="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <div className="card-body p-4.5 flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Grid2x2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-base-content group-hover:text-primary transition-colors">
                      Matriz de Eisenhower
                    </h4>
                    <ArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-base-content/50 truncate mt-0.5">
                    Cuadrantes de prioridad con Drag & Drop
                  </p>
                </div>
              </div>
            </Link>

            {/* Configuración (Activo - Fase 5) */}
            <Link
              to="/config"
              className="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <div className="card-body p-4.5 flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-base-content group-hover:text-primary transition-colors">
                      Configuración
                    </h4>
                    <ArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-base-content/50 truncate mt-0.5">
                    Canales de alerta, tema y perfil
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>


      </div>
    </AppLayout>
  )
}
