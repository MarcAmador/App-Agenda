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
        email_provider: settings.email_provider || 'gmail_api',
        gmail_client_id: settings.gmail_client_id,
        gmail_client_secret: settings.gmail_client_secret,
        gmail_refresh_token: settings.gmail_refresh_token,
        smtp_host: settings.smtp_host,
        smtp_port: Number(settings.smtp_port),
        smtp_secure: settings.smtp_secure,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        smtp_from_name: settings.smtp_from_name,
        smtp_from_email: settings.smtp_from_email,
      })
      setSettings(updated)
      toast.success('¡Configuración de correo oficial guardada con éxito!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al guardar configuración: ${msg}`)
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
        email_provider: settings.email_provider || 'gmail_api',
        gmail_client_id: settings.gmail_client_id,
        gmail_client_secret: settings.gmail_client_secret,
        gmail_refresh_token: settings.gmail_refresh_token,
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
        toast.error(`Error de conexión: ${res.message}`)
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

            {/* Indicador de Gmail REST API nativo */}
            {settings.is_gmail_api_configured ? (
              <div className="alert alert-success/15 border border-success/30 rounded-xl p-3 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-success flex items-center gap-1.5">
                    <span>Despacho Nativo Gmail REST API Activo</span>
                    <span className="badge badge-success badge-xs font-mono">PUERTO 443 HTTPS</span>
                  </div>
                  <p className="text-base-content/80">
                    El backend tiene configurada la <strong>Gmail API oficial</strong> mediante OAuth2 Refresh Token de Google Cloud. Los correos se despachan directamente por HTTPS con alta entregabilidad y logotipo verificado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert alert-info/10 border border-info/20 rounded-xl p-3 flex items-start gap-3">
                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <div className="text-xs text-base-content/70">
                  <span>Modo SMTP Estándar / Brevo API. Si deseas despacho nativo de Gmail sin contraseñas de aplicación, define <code>GMAIL_REFRESH_TOKEN</code> en el servidor.</span>
                </div>
              </div>
            )}

            {/* Selector Principal de Proveedor de Despacho */}
            <div className="bg-base-200/60 p-4 rounded-2xl border border-base-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-base-content/80">
                  Proveedor de Despacho Seleccionado:
                </span>
                <span className="badge badge-primary badge-sm font-semibold uppercase">
                  {settings.email_provider || 'gmail_api'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      email_provider: 'gmail_api',
                      smtp_port: 443,
                      smtp_secure: true,
                    })
                  }}
                  className={`btn btn-sm text-xs justify-start flex items-center gap-2 ${
                    (settings.email_provider || 'gmail_api') === 'gmail_api'
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="text-left leading-tight">
                    <span className="font-bold block">Gmail REST API</span>
                    <span className="text-[10px] opacity-75 font-normal">Google OAuth2 · HTTPS</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      email_provider: 'brevo',
                      smtp_host: 'api.brevo.com',
                      smtp_port: 443,
                      smtp_secure: false,
                    })
                  }}
                  className={`btn btn-sm text-xs justify-start flex items-center gap-2 ${
                    settings.email_provider === 'brevo'
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div className="text-left leading-tight">
                    <span className="font-bold block">Brevo API</span>
                    <span className="text-[10px] opacity-75 font-normal">HTTP Relay · Puerto 443</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      email_provider: 'smtp',
                      smtp_host: settings.smtp_host === 'api.brevo.com' ? 'smtp.gmail.com' : settings.smtp_host,
                      smtp_port: settings.smtp_port === 443 ? 587 : settings.smtp_port,
                      smtp_secure: false,
                    })
                  }}
                  className={`btn btn-sm text-xs justify-start flex items-center gap-2 ${
                    settings.email_provider === 'smtp'
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  <Server className="w-4 h-4 text-sky-400" />
                  <div className="text-left leading-tight">
                    <span className="font-bold block">SMTP Estándar</span>
                    <span className="text-[10px] opacity-75 font-normal">Host / STARTTLS 587</span>
                  </div>
                </button>
              </div>
            </div>

            {/* ─── CASO 1: GMAIL REST API NATIVO (RECOMENDADO) ─── */}
            {(settings.email_provider || 'gmail_api') === 'gmail_api' && (
              <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Credenciales Google Cloud OAuth2 (Gmail API)
                  </h3>
                  <span className="badge badge-success badge-xs font-mono">PUERTO 443 HTTPS</span>
                </div>
                <p className="text-[11px] text-base-content/70">
                  Los correos se despachan por HTTP REST a <code>googleapis.com</code> con el token de actualización de tu proyecto de Google Cloud. No sufre bloqueos de puertos ni caídas en Render o producción.
                </p>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Cuenta Gmail Remitente:</span>
                  </label>
                  <input
                    type="email"
                    placeholder="alertas.agendapro@gmail.com"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                    className="input input-bordered input-sm font-medium text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">Google Client ID:</span>
                    </label>
                    <input
                      type="text"
                      placeholder="...apps.googleusercontent.com"
                      value={settings.gmail_client_id || ''}
                      onChange={(e) => setSettings({ ...settings, gmail_client_id: e.target.value })}
                      className="input input-bordered input-sm font-mono text-xs w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">Google Client Secret:</span>
                    </label>
                    <input
                      type="password"
                      placeholder="GOCSPX-..."
                      value={settings.gmail_client_secret || ''}
                      onChange={(e) => setSettings({ ...settings, gmail_client_secret: e.target.value })}
                      className="input input-bordered input-sm font-mono text-xs w-full"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      OAuth2 Refresh Token (GMAIL_REFRESH_TOKEN):
                    </span>
                  </label>
                  <input
                    type="password"
                    placeholder="1//04..."
                    value={settings.gmail_refresh_token || ''}
                    onChange={(e) => setSettings({ ...settings, gmail_refresh_token: e.target.value })}
                    className="input input-bordered input-sm font-mono text-xs w-full"
                  />
                  <span className="text-[10px] text-base-content/50 mt-1">
                    Si dejas estos campos vacíos, el backend usará las variables de entorno <code>GMAIL_CLIENT_ID</code>, <code>GMAIL_CLIENT_SECRET</code> y <code>GMAIL_REFRESH_TOKEN</code> si existen.
                  </span>
                </div>
              </div>
            )}

            {/* ─── CASO 2: BREVO API O SMTP TRADICIONAL ─── */}
            {(settings.email_provider === 'brevo' || settings.email_provider === 'smtp') && (
              <div className="space-y-3">
                {/* Servidor Host y Puerto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">Host o Proveedor:</span>
                    </label>
                    <input
                      type="text"
                      placeholder="api.brevo.com o smtp.gmail.com"
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
                      placeholder="443 o 587"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: Number(e.target.value) })}
                      className="input input-bordered input-sm font-mono text-xs w-full"
                    />
                  </div>
                </div>

                {/* SSL/TLS Toggle */}
                {settings.email_provider === 'smtp' && (
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
                )}

                {/* Usuario y Contraseña / API Key */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">
                        {settings.email_provider === 'brevo'
                          ? 'Correo Remitente Registrado en Brevo:'
                          : 'Usuario / Correo Autenticación:'}
                      </span>
                    </label>
                    <input
                      type="email"
                      placeholder="alertas.agendapro@gmail.com"
                      value={settings.smtp_user}
                      onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                      className="input input-bordered input-sm font-medium text-xs w-full"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-primary" />
                        {settings.email_provider === 'brevo'
                          ? 'API Key de Brevo (xkeysib-...):'
                          : 'Contraseña de Aplicación:'}
                      </span>
                    </label>
                    <input
                      type="password"
                      placeholder={settings.email_provider === 'brevo' ? 'xkeysib-...' : '••••••••••••••••'}
                      value={settings.smtp_pass || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                      className="input input-bordered input-sm font-mono text-xs w-full"
                    />
                  </div>
                </div>
              </div>
            )}

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
              ¿Cómo funciona el despacho oficial de correos?
            </h3>
            <p className="text-base-content/80 leading-relaxed">
              Para garantizar que los recordatorios lleguen puntualmente a la bandeja principal de los usuarios sin caer en spam ni sufrir bloqueos de puertos:
            </p>
            <div className="space-y-2 text-base-content/80">
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <span className="font-bold text-primary flex items-center gap-1">
                  1. Gmail REST API (Por Defecto · Recomendado)
                </span>
                <p className="text-[11px]">
                  Utiliza las APIs oficiales de Google por el puerto HTTPS 443. Solo necesitas crear un proyecto en Google Cloud Console, habilitar la <strong>Gmail API</strong> y generar tus credenciales OAuth2 (Client ID, Client Secret y Refresh Token con scope <code>gmail.send</code>).
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-base-200/60 border border-base-300 space-y-1">
                <span className="font-bold text-base-content flex items-center gap-1">
                  2. Brevo API (Alternativa Gratuita)
                </span>
                <p className="text-[11px]">
                  Si aún no has tramitado tu Refresh Token de Google, crea una cuenta gratuita en <strong>brevo.com</strong> (300 correos/día gratis), valida tu remitente y pega tu API Key (<code>xkeysib-...</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
