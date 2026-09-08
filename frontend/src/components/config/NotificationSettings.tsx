import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Key,
  Check,
  X,
  Sparkles,
} from 'lucide-react'
import {
  useUserPreferences,
  useUpdatePreferences,
  useSendTestNotification,
  useSmtpStatus,
  useConfigureSmtp,
} from '@/hooks/usePreferences'
import { useAuth } from '@/context/AuthContext'
import type { NotificationChannel } from '@/types/database.types'

const LEAD_TIME_OPTIONS = [
  { label: '15 minutos antes', value: 15 },
  { label: '30 minutos antes', value: 30 },
  { label: '1 hora antes (Recomendado)', value: 60 },
  { label: '2 horas antes', value: 120 },
  { label: '1 día antes (24 horas)', value: 1440 },
]

export function NotificationSettings() {
  const { user } = useAuth()
  const { data: prefs, isLoading } = useUserPreferences()
  const updatePrefs = useUpdatePreferences()
  const sendTest = useSendTestNotification()
  const { data: smtpStatus, refetch: refetchSmtp } = useSmtpStatus()
  const configureSmtp = useConfigureSmtp()

  const [channels, setChannels] = useState<NotificationChannel[]>(['email'])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [leadTime, setLeadTime] = useState(60)

  // Pruebas
  const [testChannel, setTestChannel] = useState<NotificationChannel>('email')
  const [destinationEmail, setDestinationEmail] = useState(
    user?.email || 'ronaldo22amador@gmail.com'
  )
  const [lastEmailPreviewUrl, setLastEmailPreviewUrl] = useState<string | null>(null)
  const [lastSentEmailReal, setLastSentEmailReal] = useState<boolean | null>(null)

  // Configuración SMTP Modal/Form
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [showSmtpGuide, setShowSmtpGuide] = useState(false)
  const [smtpUser, setSmtpUser] = useState(user?.email || 'ronaldo22amador@gmail.com')
  const [smtpPass, setSmtpPass] = useState('')

  // Sincronizar correo
  useEffect(() => {
    if (smtpStatus?.user) {
      setSmtpUser(smtpStatus.user)
    }
  }, [smtpStatus?.user])

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
      setLeadTime(prefs.reminder_lead_time_minutes ?? 60)
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
      reminder_lead_time_minutes: leadTime,
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
        : testChannel === 'telegram'
        ? telegramChatId
        : undefined

    sendTest.mutate(
      { channel: testChannel, destination },
      {
        onSuccess: (data) => {
          if (testChannel === 'email') {
            const wasReal = !data.result?.previewUrl
            setLastSentEmailReal(wasReal)
            if (data.result?.previewUrl) {
              setLastEmailPreviewUrl(data.result.previewUrl)
            }
          }
          if (data.result?.directUrl && testChannel === 'whatsapp') {
            window.open(data.result.directUrl, '_blank')
          }
        },
      }
    )
  }

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!smtpUser.trim() || !smtpPass.trim()) {
      alert('Por favor ingresa tu correo y tu contraseña de aplicación de Google de 16 caracteres.')
      return
    }

    configureSmtp.mutate(
      {
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        host: 'smtp.gmail.com',
        port: 587,
        from: `"AgendaPro Académico" <${smtpUser.trim()}>`,
      },
      {
        onSuccess: () => {
          setShowSmtpModal(false)
          setSmtpPass('')
          refetchSmtp()
        },
      }
    )
  }

  const handleOpenDirectWhatsApp = () => {
    if (!phoneNumber) {
      alert('Por favor ingresa primero tu número de teléfono con código de país (ej: +50212345678).')
      return
    }
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
    const msg = encodeURIComponent(
      `🔔 *AgendaPro · Notificación de Prueba*\n\n¡Hola! Tu WhatsApp ha sido configurado con éxito para recibir alertas y recordatorios de actividades académicas.\n\n_AgendaPro SaaS · Gestión Docente_`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank')
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

      {/* ── Estado del Motor de Correo Real (Banner Informativo) ──── */}
      <div
        className={[
          'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all',
          smtpStatus?.configured
            ? 'bg-success/5 border-success/30 text-success-content'
            : 'bg-warning/5 border-warning/30 text-warning-content',
        ].join(' ')}
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              smtpStatus?.configured ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning',
            ].join(' ')}
          >
            {smtpStatus?.configured ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-base-content flex items-center gap-1.5">
              <span>
                {smtpStatus?.configured
                  ? 'Despacho de Correos Reales Activo'
                  : 'Despacho en Modo Simulación'}
              </span>
              <span
                className={`badge badge-xs font-semibold ${
                  smtpStatus?.configured ? 'badge-success' : 'badge-warning'
                }`}
              >
                {smtpStatus?.configured ? 'Gmail SMTP Conectado' : 'Requiere Contraseña de App'}
              </span>
            </h4>
            <p className="text-[11px] text-base-content/65 mt-0.5">
              {smtpStatus?.configured
                ? `Los correos salen de forma real desde: ${smtpStatus.user || 'tu cuenta de Gmail'}.`
                : 'Para que los correos aterricen directamente en tu buzón personal de Gmail, conecta tu contraseña de aplicación de Google de 16 caracteres.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSmtpModal(true)}
          className="btn btn-xs rounded-lg btn-outline gap-1.5 font-semibold text-xs flex-shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          {smtpStatus?.configured ? 'Cambiar Credenciales' : 'Conectar Gmail Real'}
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
            Alertas detalladas con formato HTML premium enviadas directamente a tu bandeja de entrada.
          </p>
          <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {smtpStatus?.configured ? 'Entrega Real Verificada' : 'Listo para Activar'}
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
          <span className="text-[10px] text-base-content/40 mt-1">
            Ejemplo: +502 (Guatemala), +52 (México), +1 (EE.UU.). Formato internacional.
          </span>
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

        {/* Selector de Tiempo de Anticipación */}
        <div className="form-control md:col-span-2">
          <label className="label py-1 text-[11px] font-semibold text-base-content/70">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Tiempo de anticipación para las alertas
            </span>
          </label>
          <select
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="select select-sm select-bordered rounded-xl text-xs font-medium max-w-sm"
          >
            {LEAD_TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Guía Desplegable para Configuración SMTP de Correo ─────── */}
      <div className="rounded-xl border border-base-200 overflow-hidden bg-base-200/30">
        <button
          type="button"
          onClick={() => setShowSmtpGuide(!showSmtpGuide)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-base-content/80 hover:bg-base-200/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-primary" />
            ¿Cómo generar la Contraseña de Aplicación de 16 letras en Google? (1 minuto)
          </span>
          {showSmtpGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSmtpGuide && (
          <div className="p-4 pt-2 border-t border-base-200 text-xs text-base-content/70 flex flex-col gap-2 leading-relaxed bg-base-100/50">
            <p>
              Google no permite usar contraseñas habituales en aplicaciones externas por motivos de seguridad. Sigue estos 3 pasos:
            </p>
            <ol className="list-decimal pl-5 flex flex-col gap-1.5 font-medium">
              <li>
                Ingresa directamente a:{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline font-bold"
                >
                  myaccount.google.com/apppasswords ↗
                </a>{' '}
                (debes tener activada la Verificación en 2 pasos de tu cuenta Google).
              </li>
              <li>
                En el campo Nombre de la app, escribe <strong>AgendaPro</strong> y haz clic en <strong>Crear</strong>.
              </li>
              <li>
                Google te mostrará una contraseña amarilla de 16 letras (ejemplo: <code className="bg-base-300 px-1 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>).
              </li>
              <li>
                Haz clic en el botón <strong>Conectar Gmail Real</strong> arriba y pégala. ¡Listo! El sistema verificará la conexión inmediatamente.
              </li>
            </ol>
          </div>
        )}
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
              Despacha un recordatorio de prueba hacia el buzón o canal especificado.
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
                placeholder="ronaldo22amador@gmail.com"
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
              Enviar Recordatorio Real
            </button>
          </div>
        </div>

        {/* Feedback visual del resultado del correo */}
        {lastSentEmailReal === true && (
          <div className="alert alert-success py-2.5 px-3.5 text-xs rounded-xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-success" />
            <span>
              ¡Recordatorio entregado con éxito a <strong>{destinationEmail}</strong>! Revisa tu bandeja de entrada en Gmail.
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

      {/* ── Modal de Configuración SMTP ──────────────────────────── */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="card bg-base-100 border border-base-300 shadow-2xl max-w-md w-full rounded-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowSmtpModal(false)}
              className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Conectar Cuenta de Gmail SMTP
                </h3>
                <p className="text-xs text-base-content/60">
                  Activa el envío de correos directos y 100% reales.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-base-200/60 rounded-xl border border-base-200 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-base-content">
                  ¿Cómo obtener la contraseña de 16 letras?
                </p>
                <p className="text-base-content/70">
                  Ve a{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold underline"
                  >
                    Google Contraseñas de aplicaciones ↗
                  </a>
                  , escribe "AgendaPro", crea la contraseña y pégala aquí abajo.
                </p>
              </div>

              <div className="p-2.5 bg-info/10 border border-info/20 rounded-xl text-[11px] text-info-content leading-relaxed">
                💡 <strong>Cuenta Emisora:</strong> Debe ser la cuenta de Google con la cual generaste la contraseña de 16 letras (ej: <code>ronaldo22amador@gmail.com</code>). Puedes estar conectado en AgendaPro con otra cuenta (como <code>marlon21ronaldo@gmail.com</code>), y el sistema enviará los correos desde aquí hacia cualquier buzón.
              </div>

              <div className="form-control">
                <label className="label py-1 text-xs font-semibold text-base-content">
                  Correo emisor de Gmail (dueño de la clave)
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="ronaldo22amador@gmail.com"
                  className="input input-sm input-bordered rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1 text-xs font-semibold text-base-content">
                  Contraseña de aplicación de Google (16 caracteres)
                </label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="input input-sm input-bordered rounded-xl text-xs font-mono tracking-wider"
                  required
                />
                <span className="text-[10px] text-base-content/40 mt-1">
                  Se almacena de forma segura y se verifica en tiempo real con Google.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowSmtpModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSmtp}
                  disabled={configureSmtp.isPending}
                  className="btn btn-primary btn-sm rounded-xl gap-1.5 text-xs font-semibold shadow-xs"
                >
                  {configureSmtp.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando con Google...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Verificar y Guardar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
