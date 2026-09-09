import { useEffect, useState } from 'react'
import { adminService, type AppSettings } from '@/services/admin.service'
import {
  Settings,
  Save,
  Image,
  Palette,
  Shield,
  Clock,
  Users,
  Megaphone,
  Plus,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'app' | 'users' | 'security' | 'notifications'>('app')
  const [newDomain, setNewDomain] = useState('')

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await adminService.getSettings()
      setSettings(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando configuración: ${msg}`)
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
      const updated = await adminService.updateSettings(settings)
      setSettings(updated)
      toast.success('¡Configuración global guardada con éxito!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al guardar: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen de logotipo no debe superar los 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && settings) {
        setSettings({ ...settings, app_logo_url: reader.result })
        toast.success('Logotipo cargado exitosamente. Guarda los cambios para aplicar.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error('El archivo de favicon no debe superar 1MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && settings) {
        setSettings({ ...settings, app_favicon_url: reader.result })
        toast.success('Favicon cargado exitosamente. Guarda los cambios para aplicar.')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddDomain = () => {
    if (!settings || !newDomain.trim()) return
    const domain = newDomain.trim().toLowerCase()
    if (!settings.allowed_email_domains.includes(domain)) {
      setSettings({
        ...settings,
        allowed_email_domains: [...settings.allowed_email_domains, domain],
      })
      setNewDomain('')
    }
  }

  const handleRemoveDomain = (domainToRemove: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      allowed_email_domains: settings.allowed_email_domains.filter((d) => d !== domainToRemove),
    })
  }

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">Cargando configuración global...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Configuración Global de AgendaPro
            <Settings className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Personaliza el branding, banner institucional, políticas de registro de profesores y horarios de silencio.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/25 self-start sm:self-auto"
        >
          {saving ? <span className="loading loading-spinner loading-xs"></span> : <Save className="w-3.5 h-3.5" />}
          <span>Guardar Cambios</span>
        </button>
      </div>

      {/* ─── Pestañas de Ajustes (DaisyUI Tabs Lifted) ────────────────────────── */}
      <div className="tabs tabs-lifted">
        <button
          onClick={() => setActiveTab('app')}
          className={`tab font-bold text-sm ${activeTab === 'app' ? 'tab-active' : ''}`}
        >
          <Palette className="w-4 h-4 mr-1.5 text-primary" />
          Aplicación &amp; Branding
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`tab font-bold text-sm ${activeTab === 'users' ? 'tab-active' : ''}`}
        >
          <Users className="w-4 h-4 mr-1.5 text-secondary" />
          Usuarios &amp; Registro
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`tab font-bold text-sm ${activeTab === 'notifications' ? 'tab-active' : ''}`}
        >
          <Clock className="w-4 h-4 mr-1.5 text-accent" />
          Notificaciones &amp; Horarios
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`tab font-bold text-sm ${activeTab === 'security' ? 'tab-active' : ''}`}
        >
          <Shield className="w-4 h-4 mr-1.5 text-warning" />
          Seguridad &amp; Sesiones
        </button>
      </div>

      {/* ─── Contenido de las Pestañas ─────────────────────────────────────────── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm p-6 -mt-2">
        {/* ── TAB 1: APLICACIÓN & BRANDING ── */}
        {activeTab === 'app' && (
          <div className="space-y-5">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Identidad Visual y Metadatos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Nombre de la Aplicación:</span>
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  className="input input-bordered input-sm w-full font-semibold"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Tema / Paleta de Colores por Defecto:</span>
                </label>
                <select
                  value={settings.theme_palette}
                  onChange={(e) => setSettings({ ...settings, theme_palette: e.target.value })}
                  className="select select-bordered select-sm w-full capitalize font-semibold"
                >
                  <option value="light">Light (Clásico)</option>
                  <option value="dark">Dark (Noche)</option>
                  <option value="corporate">Corporate (Institucional)</option>
                  <option value="emerald">Emerald (Esmeralda)</option>
                  <option value="synthwave">Synthwave (Neón)</option>
                  <option value="winter">Winter (Invierno)</option>
                  <option value="nord">Nord (Minimalista)</option>
                  <option value="business">Business (Ejecutivo)</option>
                </select>
              </div>

              {/* Logotipo: Carga local + URL opcional */}
              <div className="form-control space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs">Logotipo de la Aplicación:</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-base-300 bg-base-200/60 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                    {settings.app_logo_url ? (
                      <img src={settings.app_logo_url} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <img src="/logo.png" alt="Default Logo" className="w-full h-full object-contain opacity-70" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file-input file-input-bordered file-input-xs w-full text-xs"
                      title="Seleccionar archivo de imagen local para el logo"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="O pega URL directa (https://...)"
                        value={settings.app_logo_url}
                        onChange={(e) => setSettings({ ...settings, app_logo_url: e.target.value })}
                        className="input input-bordered input-xs w-full font-mono text-[11px]"
                      />
                      {settings.app_logo_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, app_logo_url: '' })}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                          title="Restaurar logo predeterminado"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon: Carga local + URL opcional */}
              <div className="form-control space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs">Favicon de la Aplicación:</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-base-300 bg-base-200/60 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                    {settings.app_favicon_url ? (
                      <img src={settings.app_favicon_url} alt="Favicon Preview" className="w-6 h-6 object-contain" />
                    ) : (
                      <img src="/favicon.png" alt="Default Favicon" className="w-6 h-6 object-contain opacity-70" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconUpload}
                      className="file-input file-input-bordered file-input-xs w-full text-xs"
                      title="Seleccionar archivo de icono local para el favicon"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="O pega URL directa (https://...)"
                        value={settings.app_favicon_url}
                        onChange={(e) => setSettings({ ...settings, app_favicon_url: e.target.value })}
                        className="input input-bordered input-xs w-full font-mono text-[11px]"
                      />
                      {settings.app_favicon_url && (
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, app_favicon_url: '' })}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                          title="Restaurar favicon predeterminado"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs">Descripción del SaaS:</span>
              </label>
              <textarea
                rows={2}
                value={settings.app_description}
                onChange={(e) => setSettings({ ...settings, app_description: e.target.value })}
                className="textarea textarea-bordered text-xs w-full"
              />
            </div>

            <div className="divider my-2"></div>

            {/* Banner Global */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-warning" />
                  Banner Institucional Global (Anuncio visible en el Dashboard)
                </h3>
                <input
                  type="checkbox"
                  checked={settings.global_banner_enabled}
                  onChange={(e) => setSettings({ ...settings, global_banner_enabled: e.target.checked })}
                  className="toggle toggle-sm toggle-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Texto del Comunicado:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Estimados docentes, el viernes 18 habrá suspensión de actividades por claustro."
                    value={settings.global_banner_text}
                    onChange={(e) => setSettings({ ...settings, global_banner_text: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Tipo de Alerta:</span>
                  </label>
                  <select
                    value={settings.global_banner_type}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        global_banner_type: e.target.value as AppSettings['global_banner_type'],
                      })
                    }
                    className="select select-bordered select-sm w-full font-semibold capitalize"
                  >
                    <option value="info">Información (Azul)</option>
                    <option value="warning">Advertencia (Amarillo)</option>
                    <option value="success">Éxito (Verde)</option>
                    <option value="error">Urgente (Rojo)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview del Banner */}
              {settings.global_banner_enabled && (
                <div className="mt-3">
                  <span className="text-xs font-bold text-base-content/60 block mb-1">
                    Vista previa de cómo lo verán los profesores en su Dashboard:
                  </span>
                  <div
                    className={`alert text-xs py-2.5 shadow-sm border ${
                      settings.global_banner_type === 'info'
                        ? 'alert-info'
                        : settings.global_banner_type === 'warning'
                        ? 'alert-warning'
                        : settings.global_banner_type === 'success'
                        ? 'alert-success'
                        : 'alert-error'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span className="font-semibold">{settings.global_banner_text}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: USUARIOS & REGISTRO ── */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Políticas de Registro y Proveedores de Identidad
            </h2>

            <div className="space-y-3">
              <div className="form-control bg-base-200/50 p-4 rounded-2xl border border-base-300">
                <label className="label cursor-pointer p-0">
                  <div>
                    <span className="label-text font-bold text-sm block">Permitir Nuevos Registros de Usuarios:</span>
                    <span className="text-xs text-base-content/60">
                      Si se desactiva, solo los administradores podrán invitar docentes al sistema.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_signups}
                    onChange={(e) => setSettings({ ...settings, allow_signups: e.target.checked })}
                    className="toggle toggle-primary"
                  />
                </label>
              </div>

              <div className="form-control bg-base-200/50 p-4 rounded-2xl border border-base-300">
                <label className="label cursor-pointer p-0">
                  <div>
                    <span className="label-text font-bold text-sm block">Permitir Inicio de Sesión con Google OAuth:</span>
                    <span className="text-xs text-base-content/60">
                      Habilita el botón de acceso con 1 clic usando cuentas de Google.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_google_oauth}
                    onChange={(e) => setSettings({ ...settings, allow_google_oauth: e.target.checked })}
                    className="toggle toggle-primary"
                  />
                </label>
              </div>
            </div>

            {/* Dominios Permitidos (Whitelist) */}
            <div className="space-y-2 pt-2">
              <label className="label py-0">
                <div>
                  <span className="label-text font-bold text-sm block">Dominios de Correo Permitidos (Whitelist):</span>
                  <span className="text-xs text-base-content/60">
                    Si agregas dominios, solo se permitirá el registro con correos institucionales (ej: colegio.edu.gt).
                  </span>
                </div>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ejemplo: colegio.edu"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  className="input input-bordered input-sm w-full max-w-xs font-mono text-xs"
                />
                <button onClick={handleAddDomain} className="btn btn-sm btn-outline gap-1">
                  <Plus className="w-3.5 h-3.5" /> Agregar Dominio
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {settings.allowed_email_domains.length === 0 ? (
                  <span className="text-xs text-base-content/50 italic">
                    Sin restricciones: se permiten registros desde cualquier dominio de correo (Gmail, Outlook, etc.).
                  </span>
                ) : (
                  settings.allowed_email_domains.map((dom) => (
                    <span key={dom} className="badge badge-primary gap-1 font-mono text-xs py-2">
                      @{dom}
                      <button onClick={() => handleRemoveDomain(dom)} className="hover:text-error">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: NOTIFICACIONES & HORARIOS ── */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Horarios de Silencio y Límites de Envío
            </h2>

            <div className="form-control bg-base-200/50 p-4 rounded-2xl border border-base-300">
              <label className="label cursor-pointer p-0">
                <div>
                  <span className="label-text font-bold text-sm block">Activar Horario de Silencio Nocturno:</span>
                  <span className="text-xs text-base-content/60">
                    Los recordatorios programados durante la noche se pausarán y se despacharán a primera hora matutina.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.quiet_hours_enabled}
                  onChange={(e) => setSettings({ ...settings, quiet_hours_enabled: e.target.checked })}
                  className="toggle toggle-primary"
                />
              </label>
            </div>

            {settings.quiet_hours_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-base-200/30 border border-base-300">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Inicio del Silencio (Noche):</span>
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                    className="input input-bordered input-sm font-mono w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Fin del Silencio (Mañana):</span>
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                    className="input input-bordered input-sm font-mono w-full"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Límite Diario de Correos por Usuario:</span>
                </label>
                <input
                  type="number"
                  value={settings.daily_email_limit}
                  onChange={(e) => setSettings({ ...settings, daily_email_limit: Number(e.target.value) })}
                  className="input input-bordered input-sm w-full font-mono"
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Reintentos Automáticos tras Fallo SMTP:</span>
                </label>
                <input
                  type="number"
                  value={settings.email_retry_attempts}
                  onChange={(e) => setSettings({ ...settings, email_retry_attempts: Number(e.target.value) })}
                  className="input input-bordered input-sm w-full font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SEGURIDAD & SESIONES ── */}
        {activeTab === 'security' && (
          <div className="space-y-5">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-warning" />
              Políticas de Seguridad y Sesiones Activas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-bold text-sm">Protección de Rate Limit (Fuerza Bruta)</h4>
                <p className="text-xs text-base-content/70">
                  Límite global: <strong>200 solicitudes / 15 minutos</strong> por dirección IP. Previene ataques DoS en los endpoints de autenticación.
                </p>
                <span className="badge badge-success badge-sm font-semibold">Activo en Express</span>
              </div>

              <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 space-y-2">
                <h4 className="font-bold text-sm">Trazabilidad de Sesiones</h4>
                <p className="text-xs text-base-content/70">
                  Los administradores pueden revocar remotamente tokens JWT en tiempo real desde la pestaña <strong>Usuarios y Roles</strong>.
                </p>
                <span className="badge badge-primary badge-sm font-semibold">Integrado con Supabase Auth</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
