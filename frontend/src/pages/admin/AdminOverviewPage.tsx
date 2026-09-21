import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminService, type AdminOverview } from '@/services/admin.service'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Server,
  FileText,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

const OVERVIEW_QUERY_KEY = ['admin', 'overview']

export default function AdminOverviewPage() {
  const qc = useQueryClient()

  const { data, isLoading, isError, error } = useQuery<AdminOverview>({
    queryKey: OVERVIEW_QUERY_KEY,
    queryFn: () => adminService.getOverview(),
    staleTime: 1000 * 60 * 2,  // 2 minutos de caché para el overview
    retry: 1,
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await qc.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY })
    } finally {
      setTimeout(() => setIsRefreshing(false), 800)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">Cargando métricas ejecutivas...</p>
      </div>
    )
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : String(error)
    toast.error(`Error cargando métricas: ${msg}`, { id: 'admin-overview-error' })
  }

  const stats = data?.stats || {
    totalUsers: 0,
    usersGrowthWeekly: 0,
    totalTasks: 0,
    activeTasks: 0,
    emailsSentToday: 0,
    emailsFailedToday: 0,
    systemHealth: 'healthy' as const,
    errorRate: 0,
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado y Acción de Refresco ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Panel General de Control
            <Sparkles className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Supervisión integral de usuarios, actividad académica, servidor de correo y seguridad del SaaS.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn btn-sm btn-outline gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* ─── Alertas del Sistema ──────────────────────────────────────────────── */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert text-sm font-medium shadow-sm border rounded-2xl py-3 ${
                alert.type === 'error'
                  ? 'alert-error border-error/30'
                  : alert.type === 'warning'
                  ? 'alert-warning border-warning/30'
                  : 'alert-info border-info/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <div>
                <div className="font-bold">{alert.title}</div>
                <div className="text-xs opacity-80">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tarjetas de Métricas KPI ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuarios Totales */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Usuarios</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-base-content">{stats.totalUsers}</span>
            {stats.usersGrowthWeekly > 0 && (
              <span className="ml-2 text-xs text-success font-semibold">
                +{stats.usersGrowthWeekly} esta semana
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-primary font-semibold">
            <Link to="/admin/usuarios" className="hover:underline flex items-center gap-1">
              Gestionar <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tareas Activas */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 hover:border-secondary/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Tareas</span>
            <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-base-content">{stats.activeTasks}</span>
            <span className="ml-2 text-xs text-base-content/50">de {stats.totalTasks} totales</span>
          </div>
          <div className="mt-3 text-xs text-base-content/50 font-medium">Activas en el sistema</div>
        </div>

        {/* Emails Enviados Hoy */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 hover:border-success/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Emails Hoy</span>
            <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-success">{stats.emailsSentToday}</span>
            {stats.emailsFailedToday > 0 && (
              <span className="ml-2 text-xs text-error font-semibold">
                {stats.emailsFailedToday} fallidos
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-success font-semibold">
            <Link to="/admin/emails" className="hover:underline flex items-center gap-1">
              Ver logs <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 hover:border-info/30 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Sistema</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              stats.systemHealth === 'healthy' ? 'bg-success/10 text-success' :
              stats.systemHealth === 'warning' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
            }`}>
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-lg font-extrabold capitalize ${
              stats.systemHealth === 'healthy' ? 'text-success' :
              stats.systemHealth === 'warning' ? 'text-warning' : 'text-error'
            }`}>
              {stats.systemHealth === 'healthy' ? '✓ Operativo' :
               stats.systemHealth === 'warning' ? '⚠ Advertencia' : '✗ Crítico'}
            </span>
          </div>
          <div className="mt-3 text-xs text-base-content/50 font-medium">
            Tasa de error: {stats.errorRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ─── Accesos Rápidos a Módulos ────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { to: '/admin/usuarios', icon: Users, label: 'Usuarios', color: 'text-primary bg-primary/10' },
            { to: '/admin/plantillas', icon: FileText, label: 'Plantillas', color: 'text-secondary bg-secondary/10' },
            { to: '/admin/emails', icon: Mail, label: 'Emails', color: 'text-success bg-success/10' },
            { to: '/admin/smtp', icon: Server, label: 'SMTP', color: 'text-info bg-info/10' },
            { to: '/admin/auditoria', icon: ShieldCheck, label: 'Auditoría', color: 'text-warning bg-warning/10' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Actividad Reciente ───────────────────────────────────────────────── */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-secondary" />
            Actividad Reciente
          </h2>
          <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl overflow-hidden">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-base-content/60 font-bold uppercase tracking-wider">
                  <th>Acción</th>
                  <th>Actor</th>
                  <th>Recurso</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.slice(0, 8).map((item) => (
                  <tr key={item.id} className="hover:bg-base-200/50 transition-colors text-xs">
                    <td>
                      <span className="badge badge-ghost badge-sm font-mono">{item.action}</span>
                    </td>
                    <td>
                      <div className="font-medium truncate max-w-[140px]">{item.actor_name || item.actor_email}</div>
                    </td>
                    <td className="text-base-content/60 capitalize">{item.resource_type}</td>
                    <td>
                      <span className={`badge badge-sm font-semibold ${
                        item.status === 'success' ? 'badge-success' :
                        item.status === 'error' ? 'badge-error' : 'badge-ghost'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-base-content/50">
                      {new Date(item.created_at).toLocaleString('es-GT', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
