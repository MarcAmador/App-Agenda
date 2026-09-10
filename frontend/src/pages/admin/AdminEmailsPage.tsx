import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import {
  Mail,
  Search,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailLogItem {
  id: string
  recipient_email?: string
  subject?: string
  channel?: string
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'
  sent_at?: string
  created_at: string
  error_message?: string
  retry_count?: number
  tasks?: { title: string }
}

export default function AdminEmailsPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const loadLogs = async () => {
    try {
      setLoading(true)
      const res = await adminService.getEmailLogs({
        status: statusFilter,
        search: search.trim() || undefined,
      })
      setLogs((res.logs as unknown as EmailLogItem[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando logs de correo: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs()
    }, 250)
    return () => clearTimeout(timer)
  }, [statusFilter, search])

  const handleRetry = async (logId: string) => {
    try {
      setRetryingId(logId)
      await adminService.retryEmail(logId)
      toast.success('Reintento de despacho programado exitosamente.')
      loadLogs()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al reintentar: ${msg}`)
    } finally {
      setRetryingId(null)
    }
  }

  const getStatusBadge = (status: EmailLogItem['status']) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <span className="badge badge-success badge-sm font-semibold gap-1"><CheckCircle2 className="w-3 h-3" /> {status === 'delivered' ? 'Entregado' : 'Enviado'}</span>
      case 'failed':
        return <span className="badge badge-error badge-sm font-semibold gap-1"><AlertCircle className="w-3 h-3" /> Fallido</span>
      case 'processing':
        return <span className="badge badge-info badge-sm font-semibold gap-1"><Clock className="w-3 h-3 animate-spin" /> Procesando</span>
      default:
        return <span className="badge badge-warning badge-sm font-semibold gap-1"><Clock className="w-3 h-3" /> Pendiente</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Centro de Despacho de Emails
            <Mail className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Monitoreo en tiempo real de correos pendientes, en tránsito, entregados y fallidos con reintentos manuales.
          </p>
        </div>

        <button onClick={loadLogs} className="btn btn-sm btn-outline gap-1.5 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar Cola</span>
        </button>
      </div>

      {/* ─── Pestañas de Estado (DaisyUI Tabs) ────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="tabs tabs-boxed bg-base-200 p-1 w-full sm:w-auto">
            {['all', 'pending', 'processing', 'sent', 'delivered', 'failed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`tab tab-sm font-semibold capitalize ${statusFilter === tab ? 'tab-active' : ''}`}
              >
                {tab === 'all' ? 'Todos' : tab === 'sent' ? 'Enviados' : tab === 'failed' ? 'Fallidos' : tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por correo o asunto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
              className="input input-bordered input-sm w-full pl-9"
            />
          </div>
        </div>
      </div>

      {/* ─── Tabla de Emails (DaisyUI Table) ──────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/80 text-xs font-bold uppercase tracking-wider text-base-content/70">
                <th>Destinatario</th>
                <th>Asunto</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Fecha y Hora</th>
                <th>Reintentos</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs text-base-content/60 mt-2">Consultando cola de despacho...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/50 text-sm">
                    No se encontraron registros de correo para este filtro.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover">
                    {/* Destinatario */}
                    <td>
                      <div className="font-bold text-xs">{log.recipient_email || 'usuario@colegio.edu'}</div>
                      {log.tasks?.title && (
                        <div className="text-[11px] text-base-content/60 truncate max-w-[200px]">
                          Tarea: {log.tasks.title}
                        </div>
                      )}
                    </td>

                    {/* Asunto */}
                    <td>
                      <span className="text-xs font-medium line-clamp-1">{log.subject || 'Recordatorio de Actividad'}</span>
                    </td>

                    {/* Canal */}
                    <td>
                      <span className="badge badge-sm badge-ghost uppercase text-[10px] font-bold">
                        {log.channel || 'EMAIL'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td>{getStatusBadge(log.status)}</td>

                    {/* Fecha */}
                    <td className="text-xs text-base-content/70">
                      {new Date(log.sent_at || log.created_at).toLocaleString()}
                    </td>

                    {/* Reintentos */}
                    <td className="text-xs font-semibold text-center">{log.retry_count || 0}</td>

                    {/* Acciones */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="Ver detalle del despacho"
                          className="btn btn-ghost btn-xs btn-square"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </button>

                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingId === log.id}
                            title="Reintentar despacho"
                            className="btn btn-ghost btn-xs btn-square text-warning"
                          >
                            <RotateCw className={`w-4 h-4 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal de Detalle de Log de Correo ────────────────────────────────── */}
      {selectedLog && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300 max-w-lg">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Detalle de Envío de Notificación
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-base-200/80">
                <span className="text-base-content/60 block font-semibold">Destinatario:</span>
                <span className="font-bold text-sm">{selectedLog.recipient_email || 'usuario@colegio.edu'}</span>
              </div>

              <div className="p-3 rounded-xl bg-base-200/80">
                <span className="text-base-content/60 block font-semibold">Asunto:</span>
                <span className="font-medium text-xs">{selectedLog.subject || 'Recordatorio de Tarea'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-base-200/80">
                  <span className="text-base-content/60 block font-semibold">Estado:</span>
                  <span className="mt-1 inline-block">{getStatusBadge(selectedLog.status)}</span>
                </div>
                <div className="p-3 rounded-xl bg-base-200/80">
                  <span className="text-base-content/60 block font-semibold">ID de Registro:</span>
                  <span className="font-mono text-[11px] truncate block mt-1">{selectedLog.id}</span>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error">
                  <span className="font-bold block mb-1">Detalle del Error SMTP:</span>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap">{selectedLog.error_message}</pre>
                </div>
              )}
            </div>

            <div className="modal-action mt-6">
              <button onClick={() => setSelectedLog(null)} className="btn btn-sm btn-outline">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
