import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AuditItem {
  id: string
  actor_email: string
  actor_name?: string
  action: string
  resource_type: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed' | 'warning'
  created_at: string
  details?: Record<string, unknown>
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedAudit, setSelectedAudit] = useState<AuditItem | null>(null)

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const res = await adminService.getAuditLogs({
        search: search.trim() || undefined,
        limit: 100,
      })
      setLogs((res as unknown as AuditItem[]) || [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando auditoría: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Registro de Auditoría (Audit Logs)
            <ShieldCheck className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Trazabilidad inmutable de todas las acciones administrativas, cambios de roles, accesos y modificaciones del SaaS.
          </p>
        </div>

        <button onClick={loadAuditLogs} className="btn btn-sm btn-outline gap-1.5 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar Logs</span>
        </button>
      </div>

      {/* ─── Buscador de Auditoría ────────────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por correo del administrador, acción o IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAuditLogs()}
            className="input input-bordered input-sm w-full pl-9"
          />
        </div>
      </div>

      {/* ─── Tabla de Auditoría (DaisyUI Table) ───────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-xs">
            <thead>
              <tr className="bg-base-200/80 text-xs font-bold uppercase tracking-wider text-base-content/70">
                <th>Actor / Administrador</th>
                <th>Acción Ejecutada</th>
                <th>Recurso Afectado</th>
                <th>IP / Dispositivo</th>
                <th>Resultado</th>
                <th>Fecha y Hora</th>
                <th className="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs text-base-content/60 mt-2">Consultando registros de seguridad...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/50 text-sm">
                    No se encontraron eventos de auditoría registrados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover">
                    {/* Actor */}
                    <td>
                      <div className="font-bold">{log.actor_name || log.actor_email.split('@')[0]}</div>
                      <div className="text-[11px] text-base-content/60 font-mono">{log.actor_email}</div>
                    </td>

                    {/* Acción */}
                    <td>
                      <span className="badge badge-sm badge-outline font-mono font-bold">
                        {log.action}
                      </span>
                    </td>

                    {/* Recurso */}
                    <td>
                      <span className="capitalize font-semibold text-base-content/80">
                        {log.resource_type}: {log.resource_id || 'Global'}
                      </span>
                    </td>

                    {/* IP */}
                    <td>
                      <div className="font-mono text-[11px] text-base-content/70">{log.ip_address || '127.0.0.1'}</div>
                    </td>

                    {/* Resultado */}
                    <td>
                      {log.status === 'success' ? (
                        <span className="badge badge-success badge-sm font-bold gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Éxito
                        </span>
                      ) : (
                        <span className="badge badge-error badge-sm font-bold gap-1">
                          <AlertCircle className="w-3 h-3" /> Fallo
                        </span>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="text-base-content/70 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    {/* Ver JSON */}
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedAudit(log)}
                        className="btn btn-ghost btn-xs btn-square text-primary"
                        title="Ver payload JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal de Payload JSON ────────────────────────────────────────────── */}
      {selectedAudit && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300 max-w-lg">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Detalle del Evento de Auditoría
            </h3>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-base-200">
                <span className="text-base-content/60">Acción:</span>
                <span className="font-mono font-bold">{selectedAudit.action}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-base-200">
                <span className="text-base-content/60">Actor:</span>
                <span className="font-semibold">{selectedAudit.actor_email}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-base-200">
                <span className="text-base-content/60">Timestamp:</span>
                <span className="font-mono">{new Date(selectedAudit.created_at).toISOString()}</span>
              </div>

              <div className="p-3 rounded-xl bg-base-200 border border-base-300 mt-2">
                <span className="text-base-content/60 block mb-1 font-bold">Metadata y Detalles:</span>
                <pre className="font-mono text-[11px] p-2 bg-base-300 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedAudit.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button onClick={() => setSelectedAudit(null)} className="btn btn-sm btn-outline">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
