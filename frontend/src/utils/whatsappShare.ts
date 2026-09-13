import toast from 'react-hot-toast'
import { soundEngine } from './audioEffects'

export interface TaskWhatsAppShareParams {
  title: string
  description?: string | null
  dueDate?: string | null
  dueTime?: string | null
  priorityLabel?: string | null
  category?: string | null
  phone?: string | null
}

/**
 * Detecta si el usuario está en un dispositivo móvil (Android / iOS)
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Formatea la fecha en español legible (ej: "18 de octubre de 2026")
 */
function formatReadableDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const [y, m, d] = dateStr.split('-')
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
    return date.toLocaleDateString('es-GT', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Construye el mensaje estructurado para WhatsApp con formato premium.
 */
export function buildWhatsAppTaskMessage(params: TaskWhatsAppShareParams): string {
  const { title, description, dueDate, dueTime, priorityLabel, category } = params

  const baseUrl =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://app-agenda-pied.vercel.app'

  let text = `⏰ *Recordatorio AgendaPro*\n\n`
  text += `📌 *Actividad:* ${title}\n`

  if (category) {
    text += `🏷️ *Categoría:* ${category}\n`
  }

  if (description && description.trim()) {
    const cleanDesc = description.trim().substring(0, 160)
    text += `📝 *Detalles:* ${cleanDesc}${description.length > 160 ? '...' : ''}\n`
  }

  if (dueDate) {
    const dateFormatted = formatReadableDate(dueDate)
    const timeFormatted = dueTime ? ` a las ${dueTime.substring(0, 5)}` : ''
    text += `📅 *Vencimiento:* ${dateFormatted}${timeFormatted}\n`
  }

  if (priorityLabel) {
    text += `⚡ *Prioridad:* ${priorityLabel}\n`
  }

  text += `\n🔗 *Ver en portal:* ${baseUrl}/tareas`

  return text
}

/**
 * Despacha el mensaje de WhatsApp al destino adecuado:
 * - En móvil: Abre la app nativa mediante api.whatsapp.com
 * - En escritorio: Abre WhatsApp Web directamente para evitar problemas de codificación de caracteres en Windows
 * - Copia automáticamente el texto al portapapeles para respaldo inmediato
 */
export function shareTaskViaWhatsApp(params: TaskWhatsAppShareParams): void {
  const message = buildWhatsAppTaskMessage(params)
  const encodedText = encodeURIComponent(message)
  const cleanPhone = params.phone ? params.phone.replace(/[^\d]/g, '') : ''

  // 1. Copiar al portapapeles de forma nativa para que siempre se pueda pegar con 100% de fidelidad
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(message).catch(() => {})
  }

  // 2. Feedback acústico y toast informativo
  soundEngine.playSuccessChime()
  toast.success('💬 Abriendo WhatsApp y mensaje copiado al portapapeles', {
    duration: 3500,
    icon: '📱',
  })

  // 3. Determinar URL óptima según dispositivo
  let url: string
  if (isMobileDevice()) {
    url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`
  } else {
    // En navegadores de escritorio, WhatsApp Web procesa UTF-8 con fidelidad absoluta
    url = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
