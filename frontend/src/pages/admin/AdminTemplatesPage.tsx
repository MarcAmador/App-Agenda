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
  Palette,
  Shapes,
  Plus,
  Layers,
  Circle,
  Square,
  Maximize2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const GRADIENT_PRESETS = [
  {
    name: 'Docente Ocean',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    bg: 'from-blue-600 to-indigo-600',
  },
  {
    name: 'Aurora Violet',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    bg: 'from-purple-600 to-pink-600',
  },
  {
    name: 'Emerald Forest',
    gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    bg: 'from-emerald-600 to-teal-600',
  },
  {
    name: 'Sunset Amber',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
    bg: 'from-orange-600 to-amber-500',
  },
  {
    name: 'Midnight Dark',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    bg: 'from-slate-900 to-indigo-950',
  },
  {
    name: 'Ruby Crimson',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
    bg: 'from-rose-600 to-rose-800',
  },
]

const BUTTON_COLORS = [
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Violeta', hex: '#7c3aed' },
  { name: 'Ámbar', hex: '#ea580c' },
  { name: 'Oscuro', hex: '#0f172a' },
]

export default function AdminTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedSlug, setSelectedSlug] = useState('recordatorio_tarea')
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [editorTab, setEditorTab] = useState<'content' | 'design'>('design')

  const TEMPLATE_TRIGGERS: Record<string, string> = {
    recordatorio_tarea: 'Disparador: Cuando una tarea alcanza el tiempo de anticipación configurado (3m, 5m, 15m, 1h...)',
    bienvenida: 'Disparador: Al registrarse o iniciar sesión por primera vez',
    recuperacion_password: 'Disparador: Solicitud de restablecimiento desde login (Exclusivo cuentas con email)',
    resumen_diario: 'Disparador: Programado automáticamente a las 07:00 AM con prioridades del día',
    resumen_semanal: 'Disparador: Programado los lunes por la mañana con el panorama semanal',
    nuevo_dispositivo: 'Disparador: Al detectar un inicio de sesión desde un navegador o IP nuevo',
    seguridad: 'Disparador: Al cambiar contraseña, correo o revocar sesiones activas',
    verificacion_email: 'Disparador: Al registrar nueva cuenta que requiere verificación o activación',
    confirmacion_email: 'Disparador: Al registrar nueva cuenta que requiere verificación o activación',
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

  const handleInsertSnippet = (snippetHtml: string) => {
    if (!currentTemplate) return
    setCurrentTemplate({
      ...currentTemplate,
      body_html: (currentTemplate.body_html || '') + '\n' + snippetHtml,
    })
    toast.success('Bloque visual insertado en el cuerpo del correo', { icon: '✨' })
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
    if (!currentTemplate) return null

    const sampleVars: Record<string, string> = {
      name: 'Prof. Mario Alvarado',
      summary_intro: '¡Buenos días, Prof. Mario Alvarado! Para hoy tienes <strong>3 actividades docentes programadas</strong>, incluyendo <strong>1 tarea crítica urgente (Q1)</strong>.',
      title: 'Entrega de Planificaciones del 3er Bimestre',
      due_date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      due_time: '16:00',
      priority: 'Urgente e Importante (Q1)',
      action_url: `${import.meta.env.VITE_APP_URL || window.location.origin}/tareas`,
      app_name: 'AgendaPro',
      tasks_today_count: '3',
      urgent_tasks_count: '1',
      overdue_tasks_count: '0',
      week_range: '10 al 16 de Septiembre',
      total_week_tasks: '7',
      ip_address: '190.56.24.112',
      login_time: new Date().toLocaleString('es-ES'),
      user_agent: 'Chrome en Windows 11',
      action_details: 'Contraseña de aplicación actualizada',
    }

    let subject = currentTemplate.subject || ''
    let headerTitle = currentTemplate.header_title || ''
    let bodyHtml = currentTemplate.body_html || ''
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

    const headerGradient =
      currentTemplate.theme_gradient || 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
    const buttonColor = currentTemplate.button_color || '#2563eb'
    const buttonShape = currentTemplate.button_shape || 'rounded'
    const themePattern = currentTemplate.theme_pattern || 'bubbles'

    return {
      subject,
      headerTitle,
      bodyHtml,
      buttonText,
      footerText,
      headerGradient,
      buttonColor,
      buttonShape,
      themePattern,
    }
  }

  const previewData = renderPreviewHtml()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-3 text-sm text-base-content/60 font-medium">
          Cargando Taller de Plantillas...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* ─── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <span>Taller de Diseño de Plantillas de Correo</span>
            <Sparkles className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            Personaliza figuras geométricas, gradientes, estilos de botón y contenido interactivo de cada notificación oficial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="btn btn-sm btn-outline gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5 text-primary" />
            <span>Enviar Prueba</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/25 rounded-xl text-xs font-bold"
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
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
            className={`btn btn-sm whitespace-nowrap rounded-xl transition-all text-xs ${
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
          {/* Columna Izquierda: Formulario Editor & Taller (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4 rounded-3xl">
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <div>
                  <h3 className="font-bold text-base text-base-content">{currentTemplate.name}</h3>
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
                    <span className="label-text text-xs font-semibold">Activa:</span>
                    <input
                      type="checkbox"
                      checked={currentTemplate.is_active}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, is_active: e.target.checked })
                      }
                      className="toggle toggle-sm toggle-success"
                    />
                  </label>
                </div>
              </div>

              {/* Selector de Pestañas: Taller Visual vs Contenido */}
              <div className="flex items-center gap-2 bg-base-200 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setEditorTab('design')}
                  className={`btn btn-xs flex-1 rounded-xl text-xs gap-1.5 transition-all ${
                    editorTab === 'design'
                      ? 'btn-primary shadow-xs font-bold'
                      : 'btn-ghost text-base-content/70 hover:text-base-content'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Taller de Formas & Colores</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('content')}
                  className={`btn btn-xs flex-1 rounded-xl text-xs gap-1.5 transition-all ${
                    editorTab === 'content'
                      ? 'btn-primary shadow-xs font-bold'
                      : 'btn-ghost text-base-content/70 hover:text-base-content'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Contenido & Variables</span>
                </button>
              </div>

              {/* ── Pestaña 1: Taller de Diseño Visual & Formas Geométricas ── */}
              {editorTab === 'design' && (
                <div className="space-y-4 animate-fade-in">
                  {/* 1. Gradientes Predefinidos */}
                  <div className="space-y-2">
                    <label className="label py-0">
                      <span className="label-text font-bold text-xs flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-primary" />
                        Paleta de Gradiente del Encabezado:
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GRADIENT_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() =>
                            setCurrentTemplate({ ...currentTemplate, theme_gradient: p.gradient })
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center gap-2.5 ${
                            (currentTemplate.theme_gradient || GRADIENT_PRESETS[0].gradient) ===
                            p.gradient
                              ? 'border-primary ring-2 ring-primary/30 shadow-xs'
                              : 'border-base-200 hover:border-base-300'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-lg shrink-0 shadow-2xs"
                            style={{ background: p.gradient }}
                          />
                          <span className="font-semibold truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Figuras Geométricas del Banner */}
                  <div className="space-y-2">
                    <label className="label py-0">
                      <span className="label-text font-bold text-xs flex items-center gap-1.5">
                        <Shapes className="w-3.5 h-3.5 text-secondary" />
                        Figuras Geométricas Abstractas del Banner:
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'bubbles', label: 'Burbujas Esféricas', icon: Circle },
                        { id: 'diamonds', label: 'Polígonos 25°', icon: Square },
                        { id: 'minimal', label: 'Líneas & Ondas', icon: Layers },
                        { id: 'none', label: 'Sin Figuras (Liso)', icon: Maximize2 },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              theme_pattern: shape.id,
                            })
                          }
                          className={`p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center justify-center gap-1.5 ${
                            (currentTemplate.theme_pattern || 'bubbles') === shape.id
                              ? 'border-secondary bg-secondary/5 font-bold text-secondary ring-2 ring-secondary/20'
                              : 'border-base-200 hover:border-base-300 text-base-content/70'
                          }`}
                        >
                          <shape.icon className="w-4 h-4" />
                          <span className="text-[11px]">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Estilo del Botón CTA (Color y Forma) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-base-200">
                    <div className="space-y-1.5">
                      <label className="label py-0">
                        <span className="label-text font-bold text-xs">Color del Botón CTA:</span>
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {BUTTON_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() =>
                              setCurrentTemplate({ ...currentTemplate, button_color: c.hex })
                            }
                            className={`w-7 h-7 rounded-xl border-2 transition-transform hover:scale-105 ${
                              (currentTemplate.button_color || '#2563eb') === c.hex
                                ? 'border-primary ring-2 ring-primary/40 scale-105'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="label py-0">
                        <span className="label-text font-bold text-xs">Forma Geométrica del Botón:</span>
                      </label>
                      <div className="join w-full">
                        {[
                          { id: 'pill', label: 'Píldora' },
                          { id: 'rounded', label: 'Curvado' },
                          { id: 'square', label: 'Rectangular' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              setCurrentTemplate({ ...currentTemplate, button_shape: s.id })
                            }
                            className={`btn btn-xs join-item flex-1 ${
                              (currentTemplate.button_shape || 'rounded') === s.id
                                ? 'btn-primary'
                                : 'btn-ghost'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Bloques Rápidos para Insertar (1-Click) */}
                  <div className="space-y-2 pt-2 border-t border-base-200">
                    <label className="label py-0">
                      <span className="label-text font-bold text-xs flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        Insertar Bloques Visuales Predefinidos al Cuerpo:
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          handleInsertSnippet(
                            '<div style="margin: 16px 0; padding: 14px; background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #16a34a; color: #166534;"><strong style="display: block; font-size: 13px; margin-bottom: 4px;">✅ Hito Cumplido</strong><p style="margin: 0; font-size: 13px;">Esta actividad docente ha sido verificada satisfactoriamente en la plataforma.</p></div>'
                          )
                        }
                        className="btn btn-xs btn-outline btn-success rounded-xl text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tarjeta de Éxito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleInsertSnippet(
                            '<div style="margin: 16px 0; padding: 14px; background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626; color: #991b1b;"><strong style="display: block; font-size: 13px; margin-bottom: 4px;">⚠️ Atención Requerida</strong><p style="margin: 0; font-size: 13px;">Por favor completa los requerimientos antes del cierre formal del ciclo escolar.</p></div>'
                          )
                        }
                        className="btn btn-xs btn-outline btn-error rounded-xl text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Alerta Importante</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleInsertSnippet(
                            '<div style="margin: 16px 0; padding: 14px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;"><h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #475569;">💡 Tip Docente</h4><p style="margin: 0; font-size: 13px; color: #334155;">Recuerda que puedes agendar actividades y generar informes ejecutivos en PDF desde la aplicación.</p></div>'
                          )
                        }
                        className="btn btn-xs btn-outline btn-info rounded-xl text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Caja de Consejo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pestaña 2: Contenido & Variables Dinámicas ────────────── */}
              {editorTab === 'content' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Asunto */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs">Asunto del Correo (Subject):</span>
                    </label>
                    <input
                      type="text"
                      value={currentTemplate.subject}
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, subject: e.target.value })
                      }
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
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, header_title: e.target.value })
                      }
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
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, body_html: e.target.value })
                      }
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
                        onChange={(e) =>
                          setCurrentTemplate({ ...currentTemplate, button_text: e.target.value })
                        }
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
                        onChange={(e) =>
                          setCurrentTemplate({ ...currentTemplate, button_url: e.target.value })
                        }
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
                      onChange={(e) =>
                        setCurrentTemplate({ ...currentTemplate, footer_text: e.target.value })
                      }
                      className="input input-bordered input-sm w-full text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Live Preview en Tiempo Real (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-primary" />
                Vista Previa en Vivo
              </span>

              {/* Switch Desktop / Móvil */}
              <div className="join">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`btn btn-xs join-item ${
                    previewDevice === 'desktop' ? 'btn-active btn-primary' : 'btn-ghost'
                  }`}
                  title="Vista de escritorio"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`btn btn-xs join-item ${
                    previewDevice === 'mobile' ? 'btn-active btn-primary' : 'btn-ghost'
                  }`}
                  title="Vista móvil"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Contenedor del Preview */}
            <div
              className={`mx-auto transition-all bg-base-300 p-3 rounded-3xl border border-base-300 shadow-md ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}
            >
              {/* Barra de título del cliente de correo */}
              <div className="bg-base-200 px-3 py-2 rounded-2xl mb-3 border border-base-300/60 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-base-content/50 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-success inline-block"></span>
                  <span className="ml-2 font-mono truncate">De: AgendaPro Notificaciones</span>
                </div>
                <div className="font-bold text-xs truncate">
                  Asunto: {previewData?.subject}
                </div>
              </div>

              {/* Tarjeta de Correo Renderizada */}
              <div className="bg-white text-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                {/* Header con gradiente personalizado y figuras geométricas */}
                <div
                  className="p-5 text-white relative overflow-hidden transition-all duration-300"
                  style={{ background: previewData?.headerGradient }}
                >
                  {/* Figuras geométricas abstractas */}
                  {previewData?.themePattern === 'bubbles' && (
                    <>
                      <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full bg-white/10 pointer-events-none blur-xs" />
                      <div className="absolute right-12 -bottom-6 w-20 h-20 rounded-full bg-white/8 pointer-events-none" />
                    </>
                  )}
                  {previewData?.themePattern === 'diamonds' && (
                    <>
                      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-2xl bg-white/10 rotate-25 pointer-events-none" />
                      <div className="absolute right-16 -bottom-6 w-16 h-16 rounded-xl bg-white/8 rotate-45 pointer-events-none" />
                    </>
                  )}
                  {previewData?.themePattern === 'minimal' && (
                    <div className="absolute right-0 top-0 bottom-0 w-32 border-l border-white/10 bg-white/5 pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src="/logo.png"
                        alt="AgendaPro Logo"
                        className="w-7 h-7 rounded-lg object-cover bg-white shadow-xs ring-1 ring-white/30"
                      />
                      <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md">
                        AgendaPro
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold leading-snug">
                      {previewData?.headerTitle}
                    </h2>
                  </div>
                </div>

                {/* Cuerpo del correo renderizado */}
                <div className="p-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: previewData?.bodyHtml || '',
                    }}
                  />

                  {/* Botón CTA con forma y color configurados */}
                  <div className="my-6 text-center">
                    <span
                      className={`inline-block text-white font-bold text-xs px-6 py-3 shadow-md transition-transform hover:scale-102 ${
                        previewData?.buttonShape === 'pill'
                          ? 'rounded-full'
                          : previewData?.buttonShape === 'square'
                          ? 'rounded-md'
                          : 'rounded-xl'
                      }`}
                      style={{ backgroundColor: previewData?.buttonColor }}
                    >
                      {previewData?.buttonText} →
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center text-[10px] text-slate-500 border-t border-slate-200">
                  <p className="m-0 font-semibold text-slate-600">{previewData?.footerText}</p>
                  <p className="m-0 mt-1 text-slate-400">
                    Notificación oficial de AgendaPro. Gestión académica institucional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Envío de Prueba ────────────────────────────────────────── */}
      {isTestModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-base-300 max-w-md rounded-3xl">
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Enviar Correo de Prueba en Vivo
            </h3>
            <p className="text-xs text-base-content/70 mt-1">
              Despacharemos la plantilla <strong>{currentTemplate?.name}</strong> con tu diseño personalizado a través del servidor de correo.
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
                className="input input-bordered input-sm w-full rounded-xl"
              />
            </div>

            <div className="modal-action mt-6">
              <button
                onClick={() => setIsTestModalOpen(false)}
                disabled={sendingTest}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testEmail.trim()}
                className="btn btn-sm btn-primary gap-1.5 shadow-md shadow-primary/20 rounded-xl text-xs font-bold"
              >
                {sendingTest ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Despachar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
