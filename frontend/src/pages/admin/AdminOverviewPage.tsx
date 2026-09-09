import { useEffect, useState } from 'react'
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

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getOverview()
      setData(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando métricas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">Cargando métricas ejecutivas...</p>
      </div>
    )
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

        <button onClick={loadData} className="btn btn-sm btn-outline gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* ─── Alertas del Sistema ──────────────────────────────────────────────── */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alt) => (
            <div
              key={alt.id}
              className={`alert shadow-sm border ${
                alt.type === 'error'
                  ? 'alert-error border-error/30'
                  : alt.type === 'warning'
                  ? 'alert-warning border-warning/30'
                  : 'alert-info border-info/30'
              }`}
            >
              {alt.type === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : alt.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-sm">{alt.title}</h3>
                <div className="text-xs opacity-90">{alt.message}</div>
              </div>
              <span className="text-[11px] opacity-75 font-mono">
                {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tarjetas de Estadísticas (DaisyUI Stats) ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Stat 1: Total Usuarios */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Usuarios Registrados
              </span>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">{stats.totalUsers}</div>
            <div className="flex items-center justify-between text-xs text-base-content/70 mt-2">
              <span>Google: <strong>{data?.userDistribution.google || 0}</strong> • Email: <strong>{data?.userDistribution.email || 0}</strong></span>
              <Link to="/admin/usuarios" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
                Gestionar <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stat 2: Tareas en la Plataforma */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Actividades Académicas
              </span>
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">{stats.totalTasks}</div>
            <div className="flex items-center justify-between text-xs text-base-content/70 mt-2">
              <span>{stats.activeTasks} tareas activas en progreso</span>
              <span className="badge badge-sm badge-secondary font-semibold">SaaS Global</span>
            </div>
          </div>
        </div>

        {/* Stat 3: Correos Despachados */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Correos Enviados Hoy
              </span>
              <div className="p-2.5 rounded-xl bg-success/10 text-success">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">{stats.emailsSentToday}</div>
            <div className="flex items-center justify-between text-xs text-base-content/70 mt-2">
              <span className="text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Entregados
              </span>
              <Link to="/admin/emails" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
                Ver Logs <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stat 4: Salud del Sistema & Fallos */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Tasa de Error Global
              </span>
              <div
                className={`p-2.5 rounded-xl ${
                  stats.errorRate > 5 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-1">{stats.errorRate}%</div>
            <div className="flex items-center justify-between text-xs text-base-content/70 mt-2">
              <span className={stats.errorRate > 5 ? 'text-error font-bold' : 'text-success font-semibold'}>
                {stats.errorRate > 5 ? '⚠️ Alerta de Fallos' : '✓ Rendimiento Óptimo'}
              </span>
              <Link to="/admin/alertas" className="text-primary font-semibold hover:underline flex items-center gap-0.5">
                Alertas <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Accesos Rápidos de Administración ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/plantillas"
          className="card bg-base-100 hover:bg-base-200/60 border border-base-300 transition-all p-5 shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary text-primary-content shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Editor de Plantillas</h3>
              <p className="text-xs text-base-content/60">9 tipos con live preview</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/smtp"
          className="card bg-base-100 hover:bg-base-200/60 border border-base-300 transition-all p-5 shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-secondary text-secondary-content shadow-md shadow-secondary/30 group-hover:scale-105 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Servidor SMTP</h3>
              <p className="text-xs text-base-content/60">Configurar emisor dedicado</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/usuarios"
          className="card bg-base-100 hover:bg-base-200/60 border border-base-300 transition-all p-5 shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-accent text-accent-content shadow-md shadow-accent/30 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Roles y Permisos</h3>
              <p className="text-xs text-base-content/60">SuperAdmin, Admin, Support</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/auditoria"
          className="card bg-base-100 hover:bg-base-200/60 border border-base-300 transition-all p-5 shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-neutral text-neutral-content shadow-md shadow-neutral/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Registro de Auditoría</h3>
              <p className="text-xs text-base-content/60">Trazabilidad de acciones</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── Fila Inferior: Actividad Reciente & Resumen Operativo ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente (Timeline DaisyUI) */}
        <div className="card bg-base-100 shadow-sm border border-base-300 lg:col-span-2">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-base">Actividad Reciente del Sistema</h2>
                <p className="text-xs text-base-content/60">Eventos de seguridad y despachos registrados en tiempo real</p>
              </div>
              <Link to="/admin/auditoria" className="btn btn-xs btn-ghost text-primary font-semibold">
                Ver todos →
              </Link>
            </div>

            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <ul className="timeline timeline-vertical timeline-compact">
                {data.recentActivity.map((log, idx) => (
                  <li key={log.id as string || idx}>
                    {idx > 0 && <hr className="bg-base-300" />}
                    <div className="timeline-middle">
                      <span className="flex h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20"></span>
                    </div>
                    <div className="timeline-end timeline-box bg-base-200/60 border-base-300 my-1 py-2 px-3 text-xs w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-primary font-mono text-[11px]">{log.action as string}</span>
                        <span className="text-[10px] text-base-content/50">
                          {new Date(log.created_at as string).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-base-content/80 mt-1">
                        Ejecutado por <strong>{log.actor_name as string || log.actor_email as string}</strong> ({log.resource_type as string})
                      </p>
                    </div>
                    <hr className="bg-base-300" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-base-content/50 py-4 text-center">No hay registros de actividad recientes.</p>
            )}
          </div>
        </div>

        {/* Resumen del Emisor SMTP & Entorno */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-extrabold text-base mb-1">Estado del Emisor de Correo</h2>
              <p className="text-xs text-base-content/60 mb-4">Parámetros actuales del motor de recordatorios</p>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-base-200">
                  <span className="text-base-content/70">Proveedor:</span>
                  <span className="font-bold font-mono">smtp.gmail.com:587</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-base-200">
                  <span className="text-base-content/70">Familia IP:</span>
                  <span className="badge badge-sm badge-success font-mono font-bold">IPv4 Forzado</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-base-200">
                  <span className="text-base-content/70">Seguridad:</span>
                  <span className="font-semibold">STARTTLS / Auth 2FA</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-base-200">
                  <span className="text-base-content/70">Límite Diario:</span>
                  <span className="font-semibold">500 correos/día</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-base-300">
              <Link to="/admin/smtp" className="btn btn-primary btn-sm w-full gap-2 font-semibold">
                <Server className="w-4 h-4" />
                <span>Gestionar Cuenta Emisora</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
