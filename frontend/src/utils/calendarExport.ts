import type { Task } from '@/types/database.types'

/**
 * Genera el enlace directo para añadir la tarea a Google Calendar con 1 clic.
 */
export function getGoogleCalendarUrl(task: Task): string {
  const title = encodeURIComponent(task.title)
  let description = task.description || ''

  if (task.checklist && task.checklist.length > 0) {
    description += '\n\n📋 Subtareas:\n' + task.checklist.map((s) => `• [${s.completed ? 'X' : ' '}] ${s.text}`).join('\n')
  }
  description += '\n\nOrganizado con AgendaPro.'

  const details = encodeURIComponent(description)
  const location = encodeURIComponent(task.location || '')

  let datesParam = ''
  if (task.due_date) {
    const dateStr = task.due_date.replace(/-/g, '') // YYYYMMDD
    if (task.due_time) {
      const timeParts = task.due_time.split(':')
      const hh = timeParts[0].padStart(2, '0')
      const mm = timeParts[1].padStart(2, '0')
      const ss = (timeParts[2] || '00').substring(0, 2)
      const startDateTime = `${dateStr}T${hh}${mm}${ss}`

      // Calcular 1 hora después para fecha fin
      const endHour = String((parseInt(hh, 10) + 1) % 24).padStart(2, '0')
      const endDateTime = `${dateStr}T${endHour}${mm}${ss}`
      datesParam = `&dates=${startDateTime}/${endDateTime}`
    } else {
      // Evento de todo el día (formato Google Calendar: fecha inicio inclusive / fecha fin exclusiva)
      const [y, m, day] = task.due_date.split('-')
      const nextD = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10) + 1)
      const nextDateStr = `${nextD.getFullYear()}${String(nextD.getMonth() + 1).padStart(2, '0')}${String(nextD.getDate()).padStart(2, '0')}`
      datesParam = `&dates=${dateStr}/${nextDateStr}`
    }
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${datesParam}`
}

/**
 * Genera el contenido de archivo universal iCalendar (.ics) estándar RFC 5545.
 * Compatible con Google Calendar, Apple Calendar, Microsoft Outlook y Thunderbird.
 */
export function generateICalendar(tasks: Task[]): string {
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const events = tasks
    .filter((t) => t.due_date)
    .map((task) => {
      const dateParts = (task.due_date || '').replace(/-/g, '')
      let dtStart = `${dateParts}T090000Z`
      let dtEnd = `${dateParts}T100000Z`

      if (task.due_time) {
        const timeClean = task.due_time.replace(/:/g, '').padEnd(6, '0').substring(0, 6)
        dtStart = `${dateParts}T${timeClean}Z`
        const hh = parseInt(timeClean.substring(0, 2), 10)
        const nextHour = String((hh + 1) % 24).padStart(2, '0')
        dtEnd = `${dateParts}T${nextHour}${timeClean.substring(2)}Z`
      }

      // Prioridad numérica RFC 5545 (1=alta, 5=media, 9=baja)
      let icalPriority = '5'
      if (task.priority === 'urgente_importante') icalPriority = '1'
      if (task.priority === 'no_urgente_baja') icalPriority = '9'

      let icalStatus = 'CONFIRMED'
      if (task.status === 'completada') icalStatus = 'COMPLETED'
      if (task.status === 'anulada') icalStatus = 'CANCELLED'

      let desc = (task.description || '').replace(/\n/g, '\\n')
      if (task.checklist && task.checklist.length > 0) {
        desc += '\\n\\nSubtareas:\\n' + task.checklist.map((s) => `- ${s.text}`).join('\\n')
      }

      return [
        'BEGIN:VEVENT',
        `UID:task-${task.id}@agendapro.app`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${task.title.replace(/\n/g, ' ')}`,
        `DESCRIPTION:${desc}`,
        `PRIORITY:${icalPriority}`,
        `STATUS:${icalStatus}`,
        task.category ? `CATEGORIES:${task.category.toUpperCase()}` : '',
        task.location ? `LOCATION:${task.location}` : '',
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n')
    })
    .join('\r\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AgendaPro//Gestión Docente//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AgendaPro — Actividades Académicas',
    'X-WR-TIMEZONE:UTC',
    events,
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Descarga el archivo de calendario .ics en el navegador.
 */
export function downloadICalFile(tasks: Task[], filename = 'AgendaPro_Calendario.ics'): void {
  const content = generateICalendar(tasks)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
