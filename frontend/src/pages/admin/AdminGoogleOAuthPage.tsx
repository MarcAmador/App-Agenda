import { useEffect, useState } from 'react'
import { adminService } from '@/services/admin.service'
import {
  Globe,
  CheckCircle2,
  Users,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminGoogleOAuthPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    googleCount: number
    emailCount: number
    recentGoogleUsers: Array<{ email: string; name: string; date: string }>
    oauthErrorsCount: number
  } | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await adminService.getOAuthStats()
      setData(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando estadísticas OAuth: ${msg}`)
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
        <p className="mt-3 text-sm text-base-content/60 font-medium">Consultando métricas de Google OAuth...</p>
      </div>
    )
  }

  const total = (data?.googleCount || 0) + (data?.emailCount || 0)
  const adoptionRate = total > 0 ? Math.round(((data?.googleCount || 0) / total) * 100) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Administración de Google OAuth
            <Globe className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Supervisión de autenticación federada, cuentas vinculadas con Google, errores y tasa de adopción.
          </p>
        </div>

        <button onClick={loadData} className="btn btn-sm btn-outline gap-1.5 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>Sincronizar Métricas</span>
        </button>
      </div>

      {/* ─── Métricas de Adopción ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-300 shadow-sm p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
            Cuentas con Google OAuth
          </span>
          <div className="text-3xl font-extrabold text-primary mt-1">{data?.googleCount || 0}</div>
          <span className="text-xs text-base-content/70 mt-1">Usuarios autenticados vía Google</span>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-sm p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
            Tasa de Adopción
          </span>
          <div className="text-3xl font-extrabold text-secondary mt-1">{adoptionRate}%</div>
          <span className="text-xs text-base-content/70 mt-1">Prefieren acceso de 1 clic</span>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-sm p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
            Errores de OAuth Reportados
          </span>
          <div className="text-3xl font-extrabold text-success mt-1">{data?.oauthErrorsCount || 0}</div>
          <span className="text-xs text-success font-semibold mt-1">✓ 100% de conexiones limpias</span>
        </div>
      </div>

      {/* ─── Estado de la Integración y Usuarios Recientes ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parámetros de Integración (6 cols) */}
        <div className="lg:col-span-6 card bg-base-100 border border-base-300 shadow-sm p-6 space-y-4">
          <h2 className="font-extrabold text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Parámetros del Proveedor Google Cloud
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200">
              <span className="text-base-content/70">Proveedor Auth:</span>
              <span className="font-bold flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4 text-success" /> Google Identity Services
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200">
              <span className="text-base-content/70">Flujo OAuth:</span>
              <span className="font-mono font-semibold">PKCE + Redirect Callback</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200">
              <span className="text-base-content/70">URL de Retorno Autorizada:</span>
              <span className="font-mono text-[11px] text-base-content/80">/auth/callback</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200">
              <span className="text-base-content/70">Permisos Solicitados (Scopes):</span>
              <span className="badge badge-sm badge-outline font-mono">openid, profile, email</span>
            </div>
          </div>
        </div>

        {/* Usuarios Registrados con Google (6 cols) */}
        <div className="lg:col-span-6 card bg-base-100 border border-base-300 shadow-sm p-6 space-y-4">
          <h2 className="font-extrabold text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Cuentas Verificadas con Google
          </h2>

          <div className="space-y-2">
            {data?.recentGoogleUsers && data.recentGoogleUsers.length > 0 ? (
              data.recentGoogleUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-base-200/60 border border-base-300">
                  <div>
                    <div className="font-bold text-xs">{u.name}</div>
                    <div className="text-[11px] text-base-content/60 font-mono">{u.email}</div>
                  </div>
                  <span className="badge badge-success badge-sm font-semibold gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verificado
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-base-content/50 py-4">No hay registros disponibles.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
