import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Clock,
  Save,
  CheckCircle2,
  HelpCircle,
  Play,
  Loader2,
  ExternalLink,
  Smartphone,
  Sparkles,
  Sun,
  Calendar,
  ShieldCheck,
  Moon,
  BellRing,
} from 'lucide-react'
import {
  useUserPreferences,
  useUpdatePreferences,
  useSendTestNotification,
  useSendDailyDigest,
} from '@/hooks/usePreferences'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import type { NotificationChannel } from '@/types/database.types'
import { MultiSelect } from 'primereact/multiselect'
import { LEAD_TIME_OPTIONS, encodeLeadTimes, decodeLeadTimes } from '@/utils/leadTimes'

/**
 * Componente de Preferencias de Notificación de Usuario.
 * Permite a cada docente/coordinador seleccionar sus canales de recordatorio (Email, WhatsApp, Telegram),
 * sus identificadores de mensajería y los tiempos de anticipación en minutos.
 *
 * La configuración del servidor de correo SMTP oficial es gestionada de manera exclusiva
 * por el Super Administrador en /admin/smtp.
 */
export function NotificationSettings() {
  const { user } = useAuth()
  const { data: prefs, isLoading } = useUserPreferences()
  const updatePrefs = useUpdatePreferences()
  const sendTest = useSendTestNotification()
  const sendDigest = useSendDailyDigest()

  const [channels, setChannels] = useState<NotificationChannel[]>(['email'])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [leadTimes, setLeadTimes] = useState<number[]>([15])

  // Toggles de control y frecuencia de notificaciones
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(true)
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true)
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true)
  const [taskRemindersEnabled, setTaskRemindersEnabled] = useState(true)
  const [dndEnabled, setDndEnabled] = useState(false)

  // Pruebas en vivo
  const [testChannel, setTestChannel] = useState<NotificationChannel>('email')
  const [destinationEmail, setDestinationEmail] = useState(user?.email || '')
  const [lastEmailPreviewUrl, setLastEmailPreviewUrl] = useState<string | null>(null)
  const [lastSentEmailReal, setLastSentEmailReal] = useState<boolean | null>(null)

  useEffect(() => {
    if (user?.email) {
      setDestinationEmail(user.email)
    }
  }, [user?.email])

  // Cargar datos iniciales de las preferencias
  useEffect(() => {
    if (prefs) {
      setChannels(prefs.notification_channels ?? ['email'])
      setPhoneNumber(prefs.phone_number ?? '')
      setTelegramChatId(prefs.telegram_chat_id ?? '')
      setLeadTimes(decodeLeadTimes(prefs.reminder_lead_time_minutes))
      setDailyDigestEnabled(prefs.daily_digest_enabled !== false)
      setWeeklyDigestEnabled(prefs.weekly_digest_enabled !== false)
      setLoginAlertsEnabled(prefs.login_alerts_enabled !== false)
      setTaskRemindersEnabled(prefs.task_reminders_enabled !== false)
      setDndEnabled(Boolean(prefs.dnd_enabled))
    }
  }, [prefs])

  const toggleChannel = (ch: NotificationChannel) => {
    if (channels.includes(ch)) {
      if (channels.length === 1) return // Mínimo un canal activo
      setChannels(channels.filter((c) => c !== ch))
    } else {
      setChannels([...channels, ch])
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePrefs.mutate({
      notification_channels: channels,
      phone_number: phoneNumber.trim() ? phoneNumber.trim() : null,
      telegram_chat_id: telegramChatId.trim() ? telegramChatId.trim() : null,
      reminder_lead_time_minutes: encodeLeadTimes(leadTimes),
      daily_digest_enabled: dailyDigestEnabled,
      weekly_digest_enabled: weeklyDigestEnabled,
      login_alerts_enabled: loginAlertsEnabled,
      task_reminders_enabled: taskRemindersEnabled,
      dnd_enabled: dndEnabled,
    })
  }

  const handleTogglePreference = (
    field: 'daily_digest_enabled' | 'weekly_digest_enabled' | 'login_alerts_enabled' | 'task_reminders_enabled' | 'dnd_enabled',
    value: boolean
  ) => {
    if (field === 'daily_digest_enabled') setDailyDigestEnabled(value)
    if (field === 'weekly_digest_enabled') setWeeklyDigestEnabled(value)
    if (field === 'login_alerts_enabled') setLoginAlertsEnabled(value)
    if (field === 'task_reminders_enabled') setTaskRemindersEnabled(value)
    if (field === 'dnd_enabled') setDndEnabled(value)

    updatePrefs.mutate({
      [field]: value,
    })
  }

  const handleSendTest = () => {
    setLastEmailPreviewUrl(null)
    setLastSentEmailReal(null)

    const destination =
      testChannel === 'email'
        ? destinationEmail.trim()
        : testChannel === 'whatsapp'
        ? phoneNumber
        : telegramChatId

    sendTest.mutate(
      { channel: testChannel, destination },
      {
        onSuccess: (data) => {
          if (data.result?.channel === 'email') {
            if (data.result.previewUrl) {
              setLastEmailPreviewUrl(data.result.previewUrl)
              setLastSentEmailReal(false)
            } else if (data.result.success) {
              setLastSentEmailReal(true)
            }
          }
        },
      }
    )
  }

  const handleOpenDirectWhatsApp = () => {
    if (!phoneNumber) {
      toast.error('Por favor ingresa primero tu número de teléfono con código de país (ej: +50212345678).')
      return
    }
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
    const msg = `🔔 *AgendaPro · Notificación de Prueba*\n\n¡Hola! Tu WhatsApp ha sido configurado con éxito para recibir alertas y recordatorios de actividades académicas.\n\n_AgendaPro SaaS · Gestión Docente_`
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(msg).catch(() => {})
    }
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)
    const url = isMobile
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
    toast.success('💬 Abriendo WhatsApp y mensaje copiado al portapapeles', { icon: '📱' })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 flex items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSave}
      className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 flex flex-col gap-5"
    >
      {/* ── Encabezado de la Sección ──────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-base-content tracking-tight">
              Canales de Recordatorio & Despacho
            </h3>
            <p className="text-xs text-base-content/60">
              Configura por qué vías deseas recibir las alertas automáticas de tus entregas académicas.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={updatePrefs.isPending}
          className="btn btn-primary btn-sm rounded-xl gap-2 font-semibold shadow-xs"
        >
          {updatePrefs.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar Preferencias
        </button>
      </div>

      {/* ── Tarjetas de Canales ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Canal 1: Correo Electrónico */}
        <div
          onClick={() => toggleChannel('email')}
          className={[
            'p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3',
            channels.includes('email')
              ? 'border-primary bg-primary/5 shadow-xs'
              : 'border-base-200 opacity-60 bg-base-100',
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-base-content">Email</span>
            </div>
            <input
              type="checkbox"
              checked={channels.includes('email')}
              onChange={() => {}}
              className="checkbox checkbox-xs checkbox-primary rounded"
            />
          </div>
          <p className="text-[11px] text-base-content/60 leading-relaxed">
            Alertas detalladas con formato HTML institucional enviadas directamente a tu buzón oficial.
          </p>
          <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Canal Principal Activo
          </div>
        </div>

        {/* Canal 2: WhatsApp */}
        <div
          onClick={() => toggleChannel('whatsapp')}
          className={[
            'p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3',
            channels.includes('whatsapp')
              ? 'border-success bg-success/5 shadow-xs'
              : 'border-base-200 opacity-60 bg-base-100',
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-base-content">WhatsApp</span>
            </div>
            <input
              type="checkbox"
              checked={channels.includes('whatsapp')}
              onChange={() => {}}
              className="checkbox checkbox-xs checkbox-success rounded"
            />
          </div>
          <p className="text-[11px] text-base-content/60 leading-relaxed">
            Mensajes directos vía WhatsApp Web / App con 1 clic y despacho en segundo plano.
          </p>
          <div className="text-[10px] text-success font-semibold flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Envío Directo Disponible
          </div>
        </div>

        {/* Canal 3: Telegram */}
        <div
          onClick={() => toggleChannel('telegram')}
          className={[
            'p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3',
            channels.includes('telegram')
              ? 'border-info bg-info/5 shadow-xs'
              : 'border-base-200 opacity-60 bg-base-100',
          ].join(' ')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-info/10 text-info flex items-center justify-center">
                <Send className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-xs text-base-content">Telegram</span>
            </div>
            <input
              type="checkbox"
              checked={channels.includes('telegram')}
              onChange={() => {}}
              className="checkbox checkbox-xs checkbox-info rounded"
            />
          </div>
          <p className="text-[11px] text-base-content/60 leading-relaxed">
            Mensajes instantáneos y alertas mediante el bot oficial de AgendaPro.
          </p>
          <div className="text-[10px] text-info font-semibold">
            {telegramChatId ? 'Chat ID configurado' : 'Requiere Chat ID'}
          </div>
        </div>
      </div>

      {/* ── Parámetros de Configuración por Canal ─────────────────── */}
      <div className="pt-3 border-t border-base-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Input WhatsApp Phone */}
        <div className="form-control">
          <label className="label py-1 text-[11px] font-semibold text-base-content/70 flex items-center justify-between">
            <span>Número de WhatsApp (con código de país)</span>
            {phoneNumber && (
              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="text-success hover:underline font-bold flex items-center gap-1 text-[11px]"
                title="Abre WhatsApp inmediatamente con un mensaje de prueba prellenado"
              >
                <Smartphone className="w-3 h-3" /> Probar en WhatsApp ↗
              </button>
            )}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="+50212345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input input-sm input-bordered rounded-xl text-xs font-mono flex-1"
            />
            <button
              type="button"
              onClick={handleOpenDirectWhatsApp}
              className="btn btn-sm btn-outline btn-success rounded-xl gap-1 text-xs"
              title="Abrir chat directo en WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>

        </div>

        {/* Input Telegram Chat ID */}
        <div className="form-control">
          <label className="label py-1 text-[11px] font-semibold text-base-content/70 flex items-center justify-between">
            <span>ID de Chat de Telegram</span>
            <span
              className="text-primary hover:underline cursor-pointer flex items-center gap-0.5 text-[10px]"
              title="Abre Telegram, busca @userinfobot y escribe /start para ver tu Chat ID numérico."
            >
              <HelpCircle className="w-3 h-3" /> ¿Cómo obtenerlo?
            </span>
          </label>
          <input
            type="text"
            placeholder="Ej: 123456789"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            className="input input-sm input-bordered rounded-xl text-xs font-mono"
          />
          <span className="text-[10px] text-base-content/40 mt-1">
            Introduce el ID numérico asignado por Telegram para el bot.
          </span>
        </div>

        {/* Selector MultiSelect de Tiempos de Anticipación */}
        <div id="tour-lead-times-multiselect" className="form-control md:col-span-2">
          <label className="label py-1 text-[11px] font-semibold text-base-content/70 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Tiempos de anticipación para las alertas (Multiselección)
            </span>
            <span className="text-[10px] text-primary font-bold">
              {leadTimes.length} {leadTimes.length === 1 ? 'alerta programada' : 'alertas programadas'}
            </span>
          </label>
          <div className="custom-multiselect-wrapper">
            <MultiSelect
              value={leadTimes}
              options={LEAD_TIME_OPTIONS}
              onChange={(e) => {
                if (e.value && e.value.length > 0) {
                  setLeadTimes(e.value.sort((a: number, b: number) => a - b))
                }
              }}
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona uno o más tiempos de anticipación"
              display="chip"
              className="w-full text-xs"
              panelClassName="text-xs"
              maxSelectedLabels={5}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] text-base-content/50 self-center mr-1">Atajos rápidos:</span>
            {[3, 5, 10, 15, 60].map((mins) => {
              const active = leadTimes.includes(mins)
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    if (active) {
                      if (leadTimes.length > 1) {
                        setLeadTimes(leadTimes.filter((m) => m !== mins))
                      }
                    } else {
                      setLeadTimes([...leadTimes, mins].sort((a, b) => a - b))
                    }
                  }}
                  className={`btn btn-xs rounded-lg transition-all ${
                    active ? 'btn-primary text-white shadow-xs' : 'btn-outline border-base-300 text-base-content/70 hover:btn-ghost'
                  }`}
                >
                  {active ? `✓ ${mins < 60 ? `${mins}m` : '1h'}` : `+ ${mins < 60 ? `${mins}m` : '1h'}`}
                </button>
              )
            })}
          </div>
          <span className="text-[10px] text-base-content/50 mt-1">
            Se despachará una alerta independiente para cada tiempo seleccionado (ej. 15 min, 10 min, 5 min y 3 min antes).
          </span>
        </div>
      </div>

      {/* ── Joya 4: Frecuencia & Control de Notificaciones (Toggles) ── */}
      <div id="tour-notification-toggles" className="pt-4 border-t border-base-200 flex flex-col gap-4">
        <div>
          <h4 className="font-bold text-xs text-base-content flex items-center gap-1.5 uppercase tracking-wider">
            <BellRing className="w-3.5 h-3.5 text-primary" />
            Frecuencia & Tipos de Notificación
          </h4>
          <p className="text-[11px] text-base-content/60 mt-0.5">
            Decide exactamente qué comunicaciones automáticas deseas recibir en tus canales activos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Toggle 1: Resumen Diario 7:00 AM */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 border border-base-200 gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                  Resumen Matutino Diario
                  <span className="badge badge-warning badge-xs py-0.5 px-1.5 text-[9px] font-semibold">07:00 AM</span>
                </span>
                <p className="text-[11px] text-base-content/60 leading-snug mt-0.5">
                  Reporte diario con tus actividades del día y tareas urgentes del Cuadrante 1.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dailyDigestEnabled}
              onChange={(e) => handleTogglePreference('daily_digest_enabled', e.target.checked)}
              className="toggle toggle-primary toggle-sm shrink-0"
              title="Activar/Desactivar Resumen Diario"
            />
          </div>

          {/* Toggle 2: Planificación Semanal */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 border border-base-200 gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                  Planificación Semanal
                  <span className="badge badge-primary badge-xs py-0.5 px-1.5 text-[9px] font-semibold">Lunes 8 AM</span>
                </span>
                <p className="text-[11px] text-base-content/60 leading-snug mt-0.5">
                  Panorama consolidado de entregas y compromisos al inicio de cada semana.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigestEnabled}
              onChange={(e) => handleTogglePreference('weekly_digest_enabled', e.target.checked)}
              className="toggle toggle-primary toggle-sm shrink-0"
              title="Activar/Desactivar Planificación Semanal"
            />
          </div>

          {/* Toggle 3: Recordatorios de Tareas Próximas */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 border border-base-200 gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                  Recordatorios de Tareas
                  <span className="badge badge-info badge-xs py-0.5 px-1.5 text-[9px] font-semibold">Tiempo Real</span>
                </span>
                <p className="text-[11px] text-base-content/60 leading-snug mt-0.5">
                  Avisos previos según los tiempos de anticipación configurados arriba.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={taskRemindersEnabled}
              onChange={(e) => handleTogglePreference('task_reminders_enabled', e.target.checked)}
              className="toggle toggle-info toggle-sm shrink-0"
              title="Activar/Desactivar Recordatorios de Tareas"
            />
          </div>

          {/* Toggle 4: Alertas de Inicio de Sesión y Nuevos Dispositivos */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 border border-base-200 gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                  Alertas de Nuevo Dispositivo
                  <span className="badge badge-success badge-xs py-0.5 px-1.5 text-[9px] font-semibold">Seguridad</span>
                </span>
                <p className="text-[11px] text-base-content/60 leading-snug mt-0.5">
                  Aviso por correo si se detecta un inicio de sesión desde un navegador o equipo no visto antes.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={loginAlertsEnabled}
              onChange={(e) => handleTogglePreference('login_alerts_enabled', e.target.checked)}
              className="toggle toggle-success toggle-sm shrink-0"
              title="Activar/Desactivar Alertas de Nuevo Dispositivo"
            />
          </div>
        </div>

        {/* Toggle 5: Modo No Molestar (DND) */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
          dndEnabled ? 'bg-error/10 border-error/30' : 'bg-base-200/30 border-base-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              dndEnabled ? 'bg-error/20 text-error' : 'bg-base-300/50 text-base-content/60'
            }`}>
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-base-content flex items-center gap-2">
                Modo No Molestar / Silenciar Notificaciones (DND)
                {dndEnabled && (
                  <span className="badge badge-error badge-xs text-white font-bold py-0.5 px-2">
                    Activo: Envíos en Pausa
                  </span>
                )}
              </span>
              <p className="text-[11px] text-base-content/60 leading-snug mt-0.5">
                Pausa temporalmente todos los envíos salientes (recordatorios, resúmenes y avisos) sin perder tu configuración de canales.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={dndEnabled}
            onChange={(e) => handleTogglePreference('dnd_enabled', e.target.checked)}
            className="toggle toggle-error toggle-sm shrink-0"
            title="Activar/Desactivar Modo No Molestar"
          />
        </div>

        {/* Tarjeta de prueba inmediata de Daily Digest */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-base-content/80 font-medium">
              ¿Quieres probar cómo luce tu correo diario matutino ahora mismo?
            </span>
          </div>
          <button
            type="button"
            id="tour-test-digest-btn"
            onClick={() => sendDigest.mutate({ force: true, onlyMe: true })}
            disabled={sendDigest.isPending}
            className="btn btn-warning btn-outline btn-xs rounded-lg gap-1.5 font-semibold shadow-xs"
            title="Disparar un resumen diario inmediato hacia tu correo para verificar el diseño"
          >
            {sendDigest.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
            Enviar Mi Resumen Ahora (Prueba)
          </button>
        </div>
      </div>

      {/* ── Zona de Prueba en Vivo (Despacho Directo) ─────────────── */}
      <div className="pt-3 border-t border-base-200 flex flex-col gap-3 bg-base-200/40 p-4 rounded-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-xs text-base-content flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Validar y Probar Despacho en Vivo
            </h4>
            <p className="text-[11px] text-base-content/60">
              Despacha un recordatorio de prueba hacia el buzón o canal especificado para verificar la recepción.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
              className="select select-xs select-bordered rounded-lg text-xs font-semibold"
            >
              <option value="email">✉️ Correo Electrónico</option>
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="telegram">✈️ Telegram</option>
            </select>

            {/* Input de correo destino en vivo si el canal es email */}
            {testChannel === 'email' && (
              <input
                type="email"
                value={destinationEmail}
                onChange={(e) => setDestinationEmail(e.target.value)}
                placeholder="tu-correo@institucion.edu"
                className="input input-xs input-bordered rounded-lg text-xs w-56 font-mono"
                title="Bandeja de destino para la prueba"
              />
            )}

            <button
              type="button"
              onClick={handleSendTest}
              disabled={sendTest.isPending}
              className="btn btn-primary btn-xs rounded-lg gap-1 font-semibold shadow-xs"
            >
              {sendTest.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              Enviar Recordatorio de Prueba
            </button>
          </div>
        </div>

        {/* Feedback visual del resultado del correo */}
        {lastSentEmailReal === true && (
          <div className="alert alert-success py-2.5 px-3.5 text-xs rounded-xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-success" />
            <span>
              ¡Recordatorio entregado con éxito a <strong>{destinationEmail}</strong>! Revisa tu bandeja de entrada.
            </span>
          </div>
        )}

        {lastEmailPreviewUrl && (
          <div className="alert alert-info py-2.5 px-3.5 text-xs rounded-xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                Correo generado en simulador Ethereal. Puedes inspeccionar el diseño HTML en el visor web.
              </span>
            </div>
            <a
              href={lastEmailPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs btn-neutral gap-1 flex-shrink-0"
            >
              <span>Ver Correo en Navegador</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </form>
  )
}
