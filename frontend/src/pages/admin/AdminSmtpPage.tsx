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

            {/* Selector de Proveedor Rápido */}
            <div className="bg-base-200/60 p-3 rounded-xl border border-base-300 space-y-2">
              <span className="text-xs font-bold text-base-content/70 block">
                Selecciona tu proveedor de correo:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      smtp_host: 'api.brevo.com',
                      smtp_port: 443,
                      smtp_secure: false,
                    })
                  }}
                  className={`btn btn-xs ${
                    settings.smtp_host.includes('brevo')
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  🚀 Brevo API (Gratis · Puerto 443 HTTPS)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      smtp_host: 'smtp.gmail.com',
                      smtp_port: 587,
                      smtp_secure: false,
                    })
                  }}
                  className={`btn btn-xs ${
                    settings.smtp_host.includes('gmail')
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  ✉️ Gmail SMTP (Puerto 587)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      smtp_host: 'api.resend.com',
                      smtp_port: 443,
                      smtp_secure: false,
                    })
                  }}
                  className={`btn btn-xs ${
                    settings.smtp_host.includes('resend')
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline'
                  }`}
                >
                  ⚡ Resend API (Puerto 443)
                </button>
              </div>
              {settings.smtp_host.includes('brevo') && (
                <p className="text-[11px] text-success font-medium flex items-center gap-1 mt-1">
                  ✓ Ideal para el plan gratuito de Render: Se comunica por HTTPS (puerto 443) y envía 300 correos diarios gratis desde tu cuenta de Gmail.
                </p>
              )}
            </div>

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

            {/* SSL/TLS Toggle (solo para SMTP directo) */}
            {!settings.smtp_host.includes('brevo') && !settings.smtp_host.includes('resend') && (
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
                    {settings.smtp_host.includes('brevo')
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
                    {settings.smtp_host.includes('brevo')
                      ? 'API Key de Brevo (xkeysib-...):'
                      : settings.smtp_host.includes('resend')
                      ? 'API Key de Resend (re_...):'
                      : 'Contraseña de Aplicación:'}
                  </span>
                </label>
                <input
                  type="password"
                  placeholder={
                    settings.smtp_host.includes('brevo')
                      ? 'xkeysib-...'
                      : settings.smtp_host.includes('resend')
                      ? 're_...'
                      : '••••••••••••••••'
                  }
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
              ¿Cómo configurar Brevo gratis para enviar desde tu Gmail?
            </h3>
            <p className="text-base-content/80 leading-relaxed">
              El plan gratuito de Render bloquea los puertos SMTP estándar (25, 465 y 587). Para enviar gratis sin pagar Render:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-base-content/80">
              <li>
                Crea una cuenta gratuita en <strong><a href="https://www.brevo.com" target="_blank" rel="noreferrer" className="link link-primary font-bold">brevo.com</a></strong> (te da 300 correos gratis al día).
              </li>
              <li>
                Ve a tu perfil en Brevo &gt; <strong>Remitentes e IPs</strong> (Senders) &gt; Añade <code className="bg-base-200 px-1 py-0.5 rounded font-mono">alertas.agendapro@gmail.com</code>. Te llegará un correo de confirmación de 6 dígitos para verificar que eres el dueño.
              </li>
              <li>
                Ve a tu perfil en Brevo &gt; <strong>SMTP y API</strong> &gt; pestaña <strong>Claves de API</strong> y genera una nueva clave (inicia con <code className="bg-base-200 px-1 py-0.5 rounded font-mono">xkeysib-...</code>).
              </li>
              <li>
                En el formulario de la izquierda, haz clic en el botón <strong>"Brevo API (Gratis · Puerto 443 HTTPS)"</strong>, pega la clave en el campo <strong>API Key</strong> y haz clic en <strong>Diagnosticar Conexión</strong>.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
