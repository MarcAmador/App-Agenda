import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Grid2x2,
  LayoutList,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Check,
  Shield,
  Megaphone,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { useTasks, useCreateTask, useUpdateTaskStatus } from '@/hooks/useTasks'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { adminService } from '@/services/admin.service'
import type { CreateTaskInput } from '@/types/database.types'

const SUPER_ADMIN_EMAILS = [
  'ronaldo22amador@gmail.com',
  'marlon21ronaldo@gmail.com',
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [modalVisible, setModalVisible] = useState(false)
  const [publicSettings, setPublicSettings] = useState<{
    global_banner_enabled?: boolean
    global_banner_text?: string
    global_banner_type?: string
  }>({})

  useEffect(() => {
    adminService.getPublicSettings().then(setPublicSettings)
  }, [])

  const isSuperAdmin =
    SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || '') ||
    user?.app_metadata?.role === 'super_admin' ||
    user?.user_metadata?.role === 'super_admin'

  // Obtener nombre del usuario (prioriza override local o metadata)
  const localName = typeof window !== 'undefined' ? localStorage.getItem('agendapro_custom_display_name') : null
  const fullName = localName || (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || 'Coordinador'
  const firstName = fullName.split(' ')[0]

  // Consultar tareas para KPIs y resumen informativo
  const { data: tasksData, isLoading } = useTasks()
  const createTask = useCreateTask()
  const updateStatus = useUpdateTaskStatus()

  const tasks = tasksData?.data ?? []
  const todayStr = new Date().toISOString().split('T')[0]

  // Cálculos de métricas ejecutivas
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter((t) => t.status === 'pendiente')
  const inProgressTasks = tasks.filter((t) => t.status === 'en_curso')
  const completedTasks = tasks.filter((t) => t.status === 'completada')
  const activeTasks = tasks.filter((t) => ['pendiente', 'en_curso'].includes(t.status))

  // Tareas para hoy o vencidas
  const dueTodayOrOverdue = activeTasks.filter((t) => t.due_date && t.due_date <= todayStr)
  
  // Tareas críticas (Q1 - Urgente e Importante)
  const q1Tasks = activeTasks.filter(
    (t) => t.priority === 'urgente_importante'
  )

  // Distribución de Cuadrantes Eisenhower
  const qCounts = {
    q1: tasks.filter((t) => t.priority === 'urgente_importante').length,
    q2: tasks.filter((t) => t.priority === 'importante_no_urgente').length,
    q3: tasks.filter((t) => t.priority === 'urgente_no_importante').length,
    q4: tasks.filter((t) => t.priority === 'no_urgente_baja').length,
  }

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  // Próximas 5 actividades pendientes ordenadas por fecha más cercana
  const upcomingTasks = [...activeTasks]
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
    .slice(0, 5)

  const handleCreateSubmit = (input: CreateTaskInput) => {
    createTask.mutate(input, {
      onSuccess: () => setModalVisible(false),
    })
  }

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) {
      return (
        <span className="text-[11px] text-base-content/40 font-medium">Sin fecha</span>
      )
    }
    if (dueDate < todayStr) {
      return (
        <span className="badge badge-error badge-xs font-semibold gap-1 text-[10px]">
          <AlertTriangle className="w-2.5 h-2.5" /> Vencida
        </span>
      )
    }
    if (dueDate === todayStr) {
      return (
        <span className="badge badge-warning badge-xs font-semibold gap-1 text-[10px]">
          <Clock className="w-2.5 h-2.5" /> Hoy
        </span>
      )
    }
    const [y, m, d] = dueDate.split('-')
    return (
      <span className="badge badge-ghost badge-xs font-medium text-[10px] text-base-content/70">
        {d}/{m}/{y}
      </span>
    )
  }

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="flex flex-col gap-7 animate-fade-in pb-8">

        {/* ── Banner Institucional Global (Configurado por el SuperAdmin) ── */}
        {publicSettings.global_banner_enabled && (
          <div
            className={`alert text-xs sm:text-sm font-semibold shadow-sm border py-3 rounded-2xl ${
              publicSettings.global_banner_type === 'warning'
                ? 'alert-warning border-warning/30'
                : publicSettings.global_banner_type === 'error'
                ? 'alert-error border-error/30'
                : publicSettings.global_banner_type === 'success'
                ? 'alert-success border-success/30'
                : 'alert-info border-info/30'
            }`}
          >
            <Megaphone className="w-5 h-5 flex-shrink-0" />
            <span>{publicSettings.global_banner_text}</span>
          </div>
        )}

        {/* ── 1. Banner de Bienvenida & Acciones Ejecutivas ────────── */}
        <div
          id="tour-welcome"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-secondary p-6 sm:p-8 text-primary-content shadow-lg"
        >
          {/* Fondo abstracto decorativo */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-32 -top-10 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold tracking-wide backdrop-blur-md mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Panel de Control Docente & Coordinación</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                ¡Hola, {firstName}! 👋
              </h2>
              <p className="text-white/80 text-sm mt-1.5 max-w-xl leading-relaxed">
                Aquí tienes el resumen general y el estado en tiempo real de tus actividades académicas.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md text-xs text-white font-medium">
                <CalendarDays className="w-4 h-4 text-white/80" />
                <span>
                  {new Date().toLocaleDateString('es-GT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {isSuperAdmin && (
                <Link
                  to="/admin"
                  className="btn bg-white/20 hover:bg-white/30 text-white border-white/20 rounded-2xl gap-2 font-bold shadow-md hover:scale-105 transition-all text-xs backdrop-blur-md"
                  title="Acceso exclusivo al Centro de Control SuperAdmin"
                >
                  <Shield className="w-4 h-4 text-warning" />
                  <span>Panel Admin</span>
                </Link>
              )}

              <button
                type="button"
                id="tour-btn-new-task"
                onClick={() => setModalVisible(true)}
                className="btn bg-white text-primary hover:bg-white/90 border-0 rounded-2xl gap-2 font-bold shadow-md hover:scale-105 transition-all text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Tarjetas KPI de Estado Ejecutivo ──────────────────── */}
        <div id="tour-kpi-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Tareas Activas */}
          <div
            onClick={() => navigate('/tareas')}
            className="card bg-base-100 border border-base-200 shadow-xs hover:border-primary/40 hover:shadow-md transition-all cursor-pointer rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Tareas Activas
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <LayoutList className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-base-content">
                {isLoading ? '...' : activeTasks.length}
              </span>
              <span className="text-xs text-base-content/50">de {totalTasks} registradas</span>
            </div>
            <div className="mt-3 flex items-center text-[11px] text-primary font-semibold group">
              <span>Gestionar en tabla</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Para Hoy o Vencidas */}
          <div
            onClick={() => navigate('/tareas')}
            className="card bg-base-100 border border-base-200 shadow-xs hover:border-warning/40 hover:shadow-md transition-all cursor-pointer rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Para Hoy / Vencidas
              </span>
              <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-warning">
                {isLoading ? '...' : dueTodayOrOverdue.length}
              </span>
              <span className="text-xs text-base-content/50">requieren atención</span>
            </div>
            <div className="mt-3 flex items-center text-[11px] text-warning font-semibold group">
              <span>Revisar entregas</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Críticas Q1 (Hacer Ya) */}
          <div
            onClick={() => navigate('/matriz')}
            className="card bg-base-100 border border-base-200 shadow-xs hover:border-error/40 hover:shadow-md transition-all cursor-pointer rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Críticas (Q1)
              </span>
              <div className="w-8 h-8 rounded-xl bg-error/10 text-error flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-error">
                {isLoading ? '...' : q1Tasks.length}
              </span>
              <span className="text-xs text-base-content/50">urgentes e importantes</span>
            </div>
            <div className="mt-3 flex items-center text-[11px] text-error font-semibold group">
              <span>Ver en Matriz</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Cumplimiento / Completadas */}
          <div
            onClick={() => navigate('/tareas')}
            className="card bg-base-100 border border-base-200 shadow-xs hover:border-success/40 hover:shadow-md transition-all cursor-pointer rounded-2xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
                Efectividad
              </span>
              <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-success">
                {isLoading ? '...' : `${completionRate}%`}
              </span>
              <span className="text-xs text-base-content/50">{completedTasks.length} completadas</span>
            </div>
            <div className="mt-3 flex items-center text-[11px] text-success font-semibold group">
              <span>Historial de tareas</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── 3. Sección Informativa Doble: Matriz + Próximos Vencimientos ── */}
        <div id="tour-priority-summary" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Widget 1: Distribución Eisenhower (4 Cuadrantes) */}
          <div className="lg:col-span-5 card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Grid2x2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-base-content">Distribución de Prioridades</h3>
                  <p className="text-[11px] text-base-content/50">Metodología Matriz de Eisenhower</p>
                </div>
              </div>
              <Link
                to="/matriz"
                className="btn btn-ghost btn-xs text-primary font-semibold gap-1 text-xs"
              >
                <span>Matriz</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Q1: Urgente e Importante */}
              <div
                onClick={() => navigate('/matriz')}
                className="p-3.5 rounded-xl border border-error/20 bg-error/5 hover:bg-error/10 transition-colors cursor-pointer flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-error badge-xs font-bold text-[10px]">Q1</span>
                  <span className="text-xs font-extrabold text-error">{qCounts.q1}</span>
                </div>
                <p className="text-xs font-bold text-base-content mt-1">Hacer Ya</p>
                <p className="text-[10px] text-base-content/60">Urgente & Importante</p>
              </div>

              {/* Q2: No Urgente e Importante */}
              <div
                onClick={() => navigate('/matriz')}
                className="p-3.5 rounded-xl border border-success/20 bg-success/5 hover:bg-success/10 transition-colors cursor-pointer flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-success badge-xs font-bold text-[10px]">Q2</span>
                  <span className="text-xs font-extrabold text-success">{qCounts.q2}</span>
                </div>
                <p className="text-xs font-bold text-base-content mt-1">Planificar</p>
                <p className="text-[10px] text-base-content/60">Estratégico</p>
              </div>

              {/* Q3: Urgente y No Importante */}
              <div
                onClick={() => navigate('/matriz')}
                className="p-3.5 rounded-xl border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors cursor-pointer flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-warning badge-xs font-bold text-[10px]">Q3</span>
                  <span className="text-xs font-extrabold text-warning">{qCounts.q3}</span>
                </div>
                <p className="text-xs font-bold text-base-content mt-1">Delegar</p>
                <p className="text-[10px] text-base-content/60">Urgente no crítico</p>
              </div>

              {/* Q4: No Urgente ni Importante */}
              <div
                onClick={() => navigate('/matriz')}
                className="p-3.5 rounded-xl border border-base-300 bg-base-200/50 hover:bg-base-200 transition-colors cursor-pointer flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-ghost badge-xs font-bold text-[10px]">Q4</span>
                  <span className="text-xs font-extrabold text-base-content/70">{qCounts.q4}</span>
                </div>
                <p className="text-xs font-bold text-base-content mt-1">Eliminar</p>
                <p className="text-[10px] text-base-content/60">Bajo impacto</p>
              </div>
            </div>

            <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
              <span>{pendingTasks.length} pendientes · {inProgressTasks.length} en curso</span>
              <Link to="/matriz" className="text-primary font-semibold hover:underline">
                Abrir Matriz Interactiva →
              </Link>
            </div>
          </div>

          {/* Widget 2: Actividades Prioritarias & Próximos Vencimientos */}
          <div id="tour-upcoming-tasks" className="lg:col-span-7 card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-base-content">Próximos Vencimientos</h3>
                  <p className="text-[11px] text-base-content/50">Entregas que requieren tu seguimiento inmediato</p>
                </div>
              </div>
              <Link
                to="/tareas"
                className="btn btn-ghost btn-xs text-primary font-semibold gap-1 text-xs"
              >
                <span>Ver Todas ({activeTasks.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2 text-base-content/50">
                <CheckCircle2 className="w-10 h-10 text-success/60" />
                <p className="font-bold text-sm text-base-content">¡Al día con tus actividades!</p>
                <p className="text-xs max-w-xs">No tienes entregas urgentes pendientes por el momento.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-base-200/80">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="py-2.5 flex items-center justify-between gap-3 group/item hover:bg-base-200/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Botón rápido completar */}
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate({ id: t.id, status: 'completada' })}
                        title="Marcar como completada"
                        className="w-6 h-6 rounded-lg border border-base-300 hover:border-success hover:bg-success/15 flex items-center justify-center text-base-content/30 hover:text-success transition-all flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-base-content truncate group-hover/item:text-primary transition-colors">
                          {t.title}
                        </p>
                        {t.category && (
                          <span className="text-[10px] text-base-content/50 truncate block">
                            {t.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={t.priority} compact />
                      {getDueBadge(t.due_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
              <span className="text-[11px]">Ordenado por plazo de entrega más próximo</span>
              <Link to="/tareas" className="text-primary font-semibold hover:underline">
                Ir a Tabla de Tareas →
              </Link>
            </div>
          </div>

        </div>

        {/* ── 4. Módulos del Sistema (Accesos Directos Limpios) ─────── */}
        <div id="tour-quick-modules">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
              Módulos del Sistema
            </h3>
            <span className="text-[11px] text-base-content/40">
              Haz clic para navegar a cada módulo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Tareas (Tabla) */}
            <Link
              to="/tareas"
              className="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 group rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <LayoutList className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors">
                  Tabla de Tareas
                </h4>
                <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                  Búsqueda global, filtros avanzados por estado y gestión masiva.
                </p>
              </div>
            </Link>

            {/* 2. Calendario */}
            <Link
              to="/calendario"
              className="card bg-base-100 border border-base-200 hover:border-secondary/40 hover:shadow-md transition-all duration-200 group rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-base-content group-hover:text-secondary transition-colors">
                  Calendario Académico
                </h4>
                <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                  Vistas mensual y semanal con plazos de entrega y eventos docentes.
                </p>
              </div>
            </Link>

            {/* 3. Matriz Eisenhower */}
            <Link
              to="/matriz"
              className="card bg-base-100 border border-base-200 hover:border-accent/40 hover:shadow-md transition-all duration-200 group rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Grid2x2 className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-base-content group-hover:text-accent transition-colors">
                  Matriz de Eisenhower
                </h4>
                <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                  Clasificación en 4 cuadrantes estratégicos con Drag & Drop interactivo.
                </p>
              </div>
            </Link>

            {/* 4. Configuración */}
            <Link
              to="/config"
              className="card bg-base-100 border border-base-200 hover:border-info/40 hover:shadow-md transition-all duration-200 group rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-info group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-base-content group-hover:text-info transition-colors">
                  Configuración & Alertas
                </h4>
                <p className="text-xs text-base-content/50 mt-0.5 leading-relaxed">
                  Conexión Gmail SMTP real, WhatsApp Web, perfil y temas visuales.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Modal de Creación Rápida de Tareas ───────────────────── */}
        <TaskFormModal
          visible={modalVisible}
          task={null}
          initialValues={null}
          onHide={() => setModalVisible(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={createTask.isPending}
        />

      </div>
    </AppLayout>
  )
}
