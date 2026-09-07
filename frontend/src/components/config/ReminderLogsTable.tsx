import { History, Mail, MessageSquare, Send, CheckCircle2, XCircle, Clock, RotateCw } from 'lucide-react'
import { useReminderLogs } from '@/hooks/usePreferences'
import type { NotificationChannel, NotificationStatus } from '@/types/database.types'

export function ReminderLogsTable() {
  const { data: logs, isLoading, refetch, isFetching } = useReminderLogs()

  const getChannelIcon = (ch: NotificationChannel) => {
    switch (ch) {
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-primary" />
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-success" />
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-info" />
    }
  }

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'sent':
        return (
          <span className="badge badge-xs badge-success gap-1 text-[10px] font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" /> Enviado
          </span>
        )
      case 'failed':
        return (
          <span className="badge badge-xs badge-error gap-1 text-[10px] font-medium">
            <XCircle className="w-2.5 h-2.5" /> Fallido
          </span>
        )
      case 'pending':
        return (
          <span className="badge badge-xs badge-warning gap-1 text-[10px] font-medium">
            <Clock className="w-2.5 h-2.5" /> Pendiente
          </span>
        )
    }
  }

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-base-content/70">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content tracking-tight">
              Historial de Auditoría de Recordatorios
            </h3>
            <p className="text-xs text-base-content/60">
              Registro cronológico de los avisos despachados por el sistema.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-ghost btn-xs rounded-lg gap-1 text-base-content/60 hover:text-base-content"
          title="Actualizar registro"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <span className="loading loading-spinner text-primary loading-sm" />
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="py-10 text-center text-xs text-base-content/40 bg-base-200/30 rounded-xl border border-dashed border-base-300">
          <p>Aún no se han despachado recordatorios para tus actividades.</p>
          <p className="text-[11px] mt-1 text-base-content/30">
            Los avisos se generarán automáticamente según el tiempo de anticipación configurado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="text-base-content/50 border-b border-base-200">
                <th>Canal</th>
                <th>Tarea / Actividad</th>
                <th>Estado</th>
                <th>Programado</th>
                <th>Enviado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-base-200/50 transition-colors">
                  <td>
                    <div className="flex items-center gap-1.5 font-medium capitalize text-xs">
                      {getChannelIcon(log.channel)}
                      <span>{log.channel}</span>
                    </div>
                  </td>
                  <td className="max-w-[180px] truncate font-semibold text-base-content">
                    {log.tasks?.title ?? 'Tarea no disponible'}
                  </td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td className="text-base-content/60 text-[11px] font-mono">
                    {new Date(log.scheduled_for).toLocaleString('es-GT', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="text-base-content/60 text-[11px] font-mono">
                    {log.sent_at
                      ? new Date(log.sent_at).toLocaleString('es-GT', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="text-[11px] text-base-content/50 max-w-[160px] truncate">
                    {log.error_message ? (
                      <span className="text-error">{log.error_message}</span>
                    ) : (
                      'Entregado con éxito'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
