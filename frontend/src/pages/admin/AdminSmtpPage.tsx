import { useEffect, useState } from 'react'
import { adminService, type AppSettings } from '@/services/admin.service'
import {
  Server,
  Save,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Zap,
  Info,
  KeyRound,
  Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSmtpPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    latencyMs: number
    message: string
    details?: Record<string, unknown>
  } | null>(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await adminService.getSettings()
      setSettings(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando configuración SMTP: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    try {
      setSaving(true)
      const updated = await adminService.updateSettings({
        smtp_host: settings.smtp_host,
        smtp_port: Number(settings.smtp_port),
        smtp_secure: settings.smtp_secure,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        smtp_from_name: settings.smtp_from_name,
        smtp_from_email: settings.smtp_from_email,
      })
      setSettings(updated)
      toast.success('¡Servidor SMTP oficial actualizado correctamente!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al guardar SMTP: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings) return
    try {
      setTesting(true)
      setTestResult(null)
      const res = await adminService.testSmtp({
        host: settings.smtp_host,
        port: Number(settings.smtp_port),
        secure: settings.smtp_secure,
        user: settings.smtp_user,
        pass: settings.smtp_pass || '',
      })
      setTestResult(res)
      if (res.success) {
        toast.success(`Conexión exitosa (${res.latencyMs}ms)`)
      } else {
        toast.error(`Error de conexión SMTP: ${res.message}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setTestResult({
        success: false,
        latencyMs: 0,
        message: msg,
      })
      toast.error(`Fallo de prueba: ${msg}`)
    } finally {
      setTesting(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">Cargando parámetros SMTP...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Servidor de Correo & Emisor Oficial (SMTP)
            <Server className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Configura un correo exclusivo para los recordatorios de AgendaPro sin utilizar tu correo personal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="btn btn-sm btn-outline gap-1.5"
          >
            {testing ? <span className="loading loading-spinner loading-xs"></span> : <Zap className="w-3.5 h-3.5 text-warning" />}
            <span>Diagnosticar Conexión</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/20"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : <Save className="w-3.5 h-3.5" />}
            <span>Guardar Emisor</span>
          </button>
        </div>
      </div>

      {/* ─── Grid de Configuración & Consola de Diagnóstico ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Configuración (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-6 space-y-4">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Parámetros de Conexión del Servidor
            </h2>

            {/* Servidor Host y Puerto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Host SMTP:</span>
                </label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com o mail.midominio.com"
                  value={settings.smtp_host}
                  onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  className="input input-bordered input-sm font-mono text-xs w-full"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Puerto:</span>
                </label>
                <input
                  type="number"
                  placeholder="587 o 465"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings({ ...settings, smtp_port: Number(e.target.value) })}
                  className="input input-bordered input-sm font-mono text-xs w-full"
                />
              </div>
            </div>

            {/* SSL/TLS Toggle */}
            <div className="form-control bg-base-200/50 p-3 rounded-xl border border-base-300">
              <label className="label cursor-pointer p-0">
                <div>
                  <span className="label-text font-bold text-xs block">Seguridad SSL / TLS Directo (Puerto 465):</span>
                  <span className="text-[11px] text-base-content/60">
                    Desactívalo si usas el puerto 587 (STARTTLS, recomendado para Gmail y Outlook).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smtp_secure}
                  onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                  className="toggle toggle-sm toggle-primary"
                />
              </label>
            </div>

            {/* Usuario y Contraseña de Aplicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Usuario / Correo Autenticación:</span>
                </label>
                <input
                  type="email"
                  placeholder="notificaciones@agendapro.com"
                  value={settings.smtp_user}
                  onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  className="input input-bordered input-sm font-medium text-xs w-full"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-primary" />
                    Contraseña de Aplicación:
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={settings.smtp_pass || ''}
                  onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                  className="input input-bordered input-sm font-mono text-xs w-full"
                />
              </div>
            </div>

            <div className="divider my-1"></div>

            {/* Identidad del Remitente */}
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Identidad Visible del Remitente
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Nombre del Remitente (From Name):</span>
                </label>
                <input
                  type="text"
                  placeholder='Ej: "AgendaPro Notificaciones"'
                  value={settings.smtp_from_name}
                  onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                  className="input input-bordered input-sm text-xs w-full"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Correo Emisor (From Email):</span>
                </label>
                <input
                  type="email"
                  placeholder="notificaciones@agendapro.com"
                  value={settings.smtp_from_email}
                  onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                  className="input input-bordered input-sm text-xs w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Consola de Diagnóstico & Guía (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Consola de Diagnóstico */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Consola de Diagnóstico en Tiempo Real
            </h3>

            {testing ? (
              <div className="p-6 rounded-2xl bg-neutral text-neutral-content font-mono text-xs flex flex-col items-center justify-center gap-2">
                <span className="loading loading-spinner text-primary loading-sm"></span>
                <span>Estableciendo Handshake TLS con {settings.smtp_host}:{settings.smtp_port}...</span>
              </div>
            ) : testResult ? (
              <div
                className={`p-4 rounded-2xl border font-mono text-xs space-y-2 ${
                  testResult.success
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-error/10 border-error/30 text-error'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.success ? 'Conexión Exitosa' : 'Fallo en la Verificación'}</span>
                </div>
                <p className="text-xs opacity-90">{testResult.message}</p>
                {testResult.latencyMs > 0 && (
                  <div className="text-[11px] opacity-75">
                    Latencia de ida y vuelta: <strong>{testResult.latencyMs} ms</strong> (Ruta IPv4)
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-base-200/70 border border-base-300 text-xs text-base-content/70">
                Haz clic en <strong>"Diagnosticar Conexión"</strong> para comprobar que el servidor SMTP acepte las credenciales antes de guardar.
              </div>
            )}
          </div>

          {/* Guía Rápida para el Propietario */}
          <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm flex items-center gap-2 text-primary">
              <Info className="w-4 h-4" />
              Recomendación para un Correo Dedicado
            </h3>
            <p className="text-base-content/80 leading-relaxed">
              Para tener un correo institucional exclusivo (ej. <code className="bg-base-200 px-1 py-0.5 rounded font-mono">notificaciones@tucolegio.edu</code> o <code className="bg-base-200 px-1 py-0.5 rounded font-mono">agenda.app.notificaciones@gmail.com</code>):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-base-content/70">
              <li>Crea la cuenta de Google dedicada para la aplicación.</li>
              <li>Activa <strong>Verificación en 2 pasos</strong> en esa cuenta.</li>
              <li>Genera una <strong>Contraseña de Aplicación</strong> de 16 caracteres.</li>
              <li>Ingrésala arriba y guarda los cambios. Tu correo personal quedará completamente libre de despachos automáticos.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
