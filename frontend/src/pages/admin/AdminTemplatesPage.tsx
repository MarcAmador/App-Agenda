import { useEffect, useState } from 'react'
import { adminService, type EmailTemplate } from '@/services/admin.service'
import { useAuth } from '@/context/AuthContext'
import {
  FileText,
  Save,
  Send,
  Smartphone,
  Monitor,
  Sparkles,
  Copy,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedSlug, setSelectedSlug] = useState('recordatorio_tarea')
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const TEMPLATE_TRIGGERS: Record<string, string> = {
    recordatorio_tarea: 'Disparador: Cuando una tarea alcanza el tiempo de anticipación configurado (3m, 5m, 15m, 1h...)',
    bienvenida: 'Disparador: Al registrarse o iniciar sesión por primera vez',
    recuperacion_password: 'Disparador: Solicitud de restablecimiento desde login (Exclusivo cuentas con email)',
    resumen_diario: 'Disparador: Programado automáticamente a las 07:00 AM con prioridades del día',
    resumen_semanal: 'Disparador: Programado los lunes por la mañana con el panorama semanal',
    nuevo_dispositivo: 'Disparador: Al detectar un inicio de sesión desde un navegador o IP nuevo',
    seguridad: 'Disparador: Al cambiar contraseña, correo o revocar sesiones activas',
    confirmacion_email: 'Disparador: Al registrar nueva cuenta que requiere activación',
    alerta_sistema: 'Disparador: Despacho manual por Superadmin o avisos críticos',
  }

  // Modal de prueba de envío
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [testEmail, setTestEmail] = useState(user?.email || '')
  const [sendingTest, setSendingTest] = useState(false)

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const list = await adminService.getTemplates()
      setTemplates(list)
      const found = list.find((t) => t.slug === selectedSlug) || list[0]
      if (found) {
        setSelectedSlug(found.slug)
        setCurrentTemplate({ ...found })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error cargando plantillas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleSelectTemplate = (slug: string) => {
    setSelectedSlug(slug)
    const found = templates.find((t) => t.slug === slug)
    if (found) {
      setCurrentTemplate({ ...found })
    }
  }

  const handleCopyVariable = (variableName: string) => {
    const text = `{{${variableName}}}`
    navigator.clipboard.writeText(text)
    toast.success(`Copiado: ${text}`, { duration: 1500, icon: '📋' })
  }

  const handleSave = async () => {
    if (!currentTemplate) return
    try {
      setSaving(true)
      const updated = await adminService.updateTemplate(currentTemplate.slug, currentTemplate)
      toast.success('¡Plantilla guardada exitosamente!')
      setTemplates((prev) => prev.map((t) => (t.slug === updated.slug ? updated : t)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al guardar: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!currentTemplate || !testEmail.trim()) return
    try {
      setSendingTest(true)
      await adminService.sendTestTemplate(currentTemplate.slug, testEmail.trim())
      toast.success(`Correo de prueba despachado a ${testEmail}`)
      setIsTestModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al enviar prueba: ${msg}`)
    } finally {
      setSendingTest(false)
    }
  }

  // Generador de preview con variables simuladas
  const renderPreviewHtml = () => {
    if (!currentTemplate) return ''

    const sampleVars: Record<string, string> = {
      name: 'Prof. Mario Alvarado',
      title: 'Entrega de Boletas del 3er Bimestre',
      due_date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      due_time: '16:00',
      priority: 'Urgente e Importante (Q1)',
      action_url: `${import.meta.env.VITE_APP_URL || window.location.origin}/tareas`,
      app_name: 'AgendaPro',
      tasks_today_count: '4',
      urgent_tasks_count: '2',
      week_range: '10 al 16 de Septiembre',
      total_week_tasks: '7',
      ip_address: '190.56.24.112',
      login_time: new Date().toLocaleString('es-ES'),
      user_agent: 'Chrome en Windows 11',
      action_details: 'Contraseña de aplicación actualizada',
    }

    let subject = currentTemplate.subject
    let headerTitle = currentTemplate.header_title
    let bodyHtml = currentTemplate.body_html
    let buttonText = currentTemplate.button_text || 'Ir a la plataforma'
    let footerText = currentTemplate.footer_text || 'AgendaPro'

    Object.entries(sampleVars).forEach(([k, v]) => {
      const reg = new RegExp(`{{${k}}}`, 'g')
      subject = subject.replace(reg, v)
      headerTitle = headerTitle.replace(reg, v)
      bodyHtml = bodyHtml.replace(reg, v)
      buttonText = buttonText.replace(reg, v)
      footerText = footerText.replace(reg, v)
    })

    return { subject, headerTitle, bodyHtml, buttonText, footerText }
  }

  const previewData = renderPreviewHtml()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">Cargando editor de plantillas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Personalización de Plantillas de Correo
            <FileText className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Gestiona los 9 tipos oficiales de notificaciones del sistema con variables dinámicas y vista previa en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="btn btn-sm btn-outline gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-primary" />
            <span>Enviar Prueba</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/25"
          >
            {saving ? <span className="loading loading-spinner loading-xs"></span> : <Save className="w-3.5 h-3.5" />}
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* ─── Selector de Plantillas (Pills Horizontales) ─────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-base-300">
        {templates.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => handleSelectTemplate(tpl.slug)}
            className={`btn btn-sm whitespace-nowrap rounded-xl transition-all ${
              selectedSlug === tpl.slug
                ? 'btn-primary font-bold shadow-md shadow-primary/20'
                : 'btn-ghost text-base-content/70 hover:bg-base-200'
            }`}
          >
            <span>{tpl.name}</span>
          </button>
        ))}
      </div>

      {/* ─── Editor y Live Preview Dividido (Grid 2 Columnas) ────────────────── */}
      {currentTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Formulario Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">{currentTemplate.name}</h3>
                  <p className="text-xs text-base-content/60">{currentTemplate.description}</p>
                  {TEMPLATE_TRIGGERS[currentTemplate.slug] && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      <span>⚡</span>
                      <span>{TEMPLATE_TRIGGERS[currentTemplate.slug]}</span>
                    </div>
                  )}
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <span className="label-text text-xs font-semibold">Plantilla Activa:</span>
                    <input
                      type="checkbox"
                      checked={currentTemplate.is_active}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, is_active: e.target.checked })}
                      className="toggle toggle-sm toggle-success"
                    />
                  </label>
                </div>
              </div>

              {/* Asunto */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Asunto del Correo (Subject):</span>
                </label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, subject: e.target.value })}
                  className="input input-bordered input-sm w-full font-medium"
                />
              </div>

              {/* Título de Encabezado */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Título del Banner Superior:</span>
                </label>
                <input
                  type="text"
                  value={currentTemplate.header_title}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, header_title: e.target.value })}
                  className="input input-bordered input-sm w-full"
                />
              </div>

              {/* Paleta de Variables Clicables */}
              <div>
                <label className="label py-1">
                  <span className="label-text font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Variables Dinámicas Disponibles (clic para copiar):
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-base-200/80 border border-base-300">
                  {currentTemplate.available_variables.map((varName) => (
                    <button
                      key={varName}
                      type="button"
                      onClick={() => handleCopyVariable(varName)}
                      className="badge badge-sm badge-outline hover:badge-primary gap-1 cursor-pointer font-mono transition-colors"
                      title="Copiar variable"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{{${varName}}}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuerpo del Correo (HTML) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Cuerpo del Mensaje (HTML / Texto):</span>
                </label>
                <textarea
                  rows={6}
                  value={currentTemplate.body_html}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, body_html: e.target.value })}
                  className="textarea textarea-bordered font-mono text-xs w-full leading-relaxed"
                />
              </div>

              {/* Botón CTA y Pie de Página */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Texto del Botón CTA:</span>
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.button_text || ''}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, button_text: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">URL del Botón (o variable):</span>
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.button_url || ''}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, button_url: e.target.value })}
                    className="input input-bordered input-sm w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Pie de Página (Footer):</span>
                </label>
                <input
                  type="text"
                  value={currentTemplate.footer_text || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, footer_text: e.target.value })}
                  className="input input-bordered input-sm w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Live Preview en Tiempo Real (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-primary" />
                Live Preview en Tiempo Real
              </span>

              {/* Switch Desktop / Móvil */}
              <div className="join">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`btn btn-xs join-item ${previewDevice === 'desktop' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`btn btn-xs join-item ${previewDevice === 'mobile' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Contenedor del Preview */}
            <div
              className={`mx-auto transition-all bg-base-300 p-3 rounded-2xl border border-base-300 shadow-md ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}
            >
              {/* Barra de título del cliente de correo */}
              <div className="bg-base-200 px-3 py-2 rounded-xl mb-3 border border-base-300/60 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-base-content/50 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                  <span className="ml-2 font-mono truncate">De: AgendaPro Notificaciones</span>
                </div>
                <div className="font-bold text-xs truncate">
                  Asunto: {typeof previewData === 'object' ? previewData.subject : ''}
                </div>
              </div>

              {/* Tarjeta de Correo Renderizada */}
              <div className="bg-white text-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                {/* Header con gradiente y logo real */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src="/logo.png"
                      alt="AgendaPro Logo"
                      className="w-6 h-6 rounded-md object-cover bg-white shadow-xs"
                    />
                    <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      AgendaPro
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold leading-snug">
                    {typeof previewData === 'object' ? previewData.headerTitle : ''}
                  </h2>
                </div>

                {/* Cuerpo del correo renderizado */}
                <div className="p-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: typeof previewData === 'object' ? previewData.bodyHtml : '',
                    }}
                  />

                  {/* Botón CTA */}
                  <div className="my-5 text-center">
                    <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm">
                      {typeof previewData === 'object' ? previewData.buttonText : ''} →
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-100 p-3 text-center text-[10px] text-slate-500 border-t border-slate-200">
                  <p className="m-0 font-medium">{typeof previewData === 'object' ? previewData.footerText : ''}</p>
                  <p className="m-0 mt-1 text-slate-400">Notificación oficial de AgendaPro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Envío de Prueba ────────────────────────────────────────── */}
      {isTestModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300 max-w-md">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Enviar Correo de Prueba en Vivo
            </h3>
            <p className="text-xs text-base-content/70 mt-1">
              Despacharemos la plantilla <strong>{currentTemplate?.name}</strong> con variables de muestra a través de tu servidor SMTP.
            </p>

            <div className="form-control mt-4">
              <label className="label py-1">
                <span className="label-text font-bold text-xs">Correo de Destino:</span>
              </label>
              <input
                type="email"
                placeholder="tu-correo@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>

            <div className="modal-action mt-6">
              <button
                onClick={() => setIsTestModalOpen(false)}
                disabled={sendingTest}
                className="btn btn-sm btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail.trim()}
                className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/20"
              >
                {sendingTest ? <span className="loading loading-spinner loading-xs"></span> : <Send className="w-3.5 h-3.5" />}
                Despachar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
