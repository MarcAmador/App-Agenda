import type { Task, TaskPriority, TaskStatus } from '@/types/database.types'

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgente_importante: 'Q1: Urgente e Importante',
  importante_no_urgente: 'Q2: Planificar',
  urgente_no_importante: 'Q3: Delegar',
  no_urgente_baja: 'Q4: Baja Prioridad',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En Curso',
  completada: 'Completada',
  perdida: 'Vencida',
  anulada: 'Anulada',
  archivada: 'Archivada',
}

export interface ReportKPIs {
  total: number
  completadas: number
  pendientes: number
  vencidas: number
  completionRate: number
  q1: number
  q2: number
  q3: number
  q4: number
}

export interface PrintReportOptions {
  tasks: Task[]
  kpis: ReportKPIs
  userName?: string
  userEmail?: string
}

export function printExecutiveReport({
  tasks,
  kpis,
  userName = 'Docente Titular',
  userEmail = '',
}: PrintReportOptions) {
  const currentDateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rowsHtml =
    tasks.length === 0
      ? `<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b; font-style: italic;">No se encontraron actividades con los filtros seleccionados.</td></tr>`
      : tasks
          .map((t) => {
            const totalSteps = t.checklist ? t.checklist.length : 0
            const doneSteps = t.checklist ? t.checklist.filter((s) => s.completed).length : 0
            const isDone = t.status === 'completada'

            let priorityColor = '#64748b'
            let priorityBg = '#f1f5f9'
            if (t.priority === 'urgente_importante') {
              priorityColor = '#dc2626'
              priorityBg = '#fee2e2'
            } else if (t.priority === 'importante_no_urgente') {
              priorityColor = '#0284c7'
              priorityBg = '#e0f2fe'
            } else if (t.priority === 'urgente_no_importante') {
              priorityColor = '#d97706'
              priorityBg = '#fef3c7'
            }

            const statusBg = isDone ? '#dcfce7' : t.status === 'en_curso' ? '#e0e7ff' : '#f1f5f9'
            const statusColor = isDone ? '#15803d' : t.status === 'en_curso' ? '#4338ca' : '#475569'

            return `
              <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
                <td style="padding: 8px 10px; font-size: 11px; white-space: nowrap; vertical-align: top;">
                  <strong style="color: #0f172a; display: block;">${t.due_date || 'Sin fecha'}</strong>
                  ${t.due_time ? `<span style="color: #64748b; font-size: 10px;">${t.due_time.substring(0, 5)}</span>` : ''}
                </td>
                <td style="padding: 8px 10px; font-size: 11px; vertical-align: top;">
                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${escapeHtml(t.title)}</div>
                  ${t.description ? `<div style="color: #64748b; font-size: 10px; line-height: 1.3;">${escapeHtml(t.description)}</div>` : ''}
                </td>
                <td style="padding: 8px 10px; font-size: 11px; vertical-align: top; white-space: nowrap;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 600; text-transform: capitalize;">
                    ${escapeHtml(t.category || 'General')}
                  </span>
                </td>
                <td style="padding: 8px 10px; font-size: 11px; vertical-align: top; white-space: nowrap;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: ${priorityBg}; color: ${priorityColor}; font-size: 10px; font-weight: 700;">
                    ${PRIORITY_LABELS[t.priority] || t.priority}
                  </span>
                </td>
                <td style="padding: 8px 10px; font-size: 11px; vertical-align: top; white-space: nowrap;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; font-size: 10px; font-weight: 700;">
                    ${STATUS_LABELS[t.status] || t.status}
                  </span>
                </td>
                <td style="padding: 8px 10px; font-size: 11px; vertical-align: top; text-align: right; white-space: nowrap;">
                  ${
                    totalSteps > 0
                      ? `<span style="font-family: monospace; font-size: 11px; color: ${doneSteps === totalSteps ? '#15803d' : '#334155'}; font-weight: bold;">
                          ${doneSteps}/${totalSteps} (${Math.round((doneSteps / totalSteps) * 100)}%)
                        </span>`
                      : '<span style="color: #94a3b8;">—</span>'
                  }
                </td>
              </tr>
            `
          })
          .join('')

  const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AgendaPro - Informe Ejecutivo de Actividades</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 1.2cm 1.5cm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .header-left p {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      text-transform: capitalize;
    }
    .header-right {
      text-align: right;
      font-size: 11px;
    }
    .header-right strong {
      display: block;
      font-size: 12px;
      color: #0f172a;
    }
    .header-right span {
      display: block;
      color: #64748b;
    }
    .badge-role {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      background: #f1f5f9;
      color: #475569;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 9px;
    }
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
    }
    .kpi-card.success { background: #f0fdf4; border-color: #bbf7d0; }
    .kpi-card.success .kpi-value { color: #16a34a; }
    .kpi-card.warning { background: #fffbeb; border-color: #fde68a; }
    .kpi-card.warning .kpi-value { color: #d97706; }
    .kpi-card.danger { background: #fef2f2; border-color: #fecaca; }
    .kpi-card.danger .kpi-value { color: #dc2626; }
    
    .eisenhower-summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 11px;
    }
    .eisenhower-tag {
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
    }
    .table-container {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    thead th {
      background: #f1f5f9;
      color: #475569;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .signatures {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      text-align: center;
      font-size: 11px;
      page-break-inside: avoid;
    }
    .sign-line {
      width: 220px;
      margin: 0 auto 8px auto;
      border-bottom: 1px solid #0f172a;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>AgendaPro — Informe de Gestión Académica</h1>
      <p>${currentDateStr}</p>
    </div>
    <div class="header-right">
      <strong>${escapeHtml(userName)}</strong>
      <span>${escapeHtml(userEmail || 'docente@institucion.edu')}</span>
      <span class="badge-role">Docencia & Coordinación</span>
    </div>
  </div>

  <div class="kpis-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Actividades</div>
      <div class="kpi-value">${kpis.total}</div>
    </div>
    <div class="kpi-card success">
      <div class="kpi-label">Cumplimiento</div>
      <div class="kpi-value">${kpis.completionRate}% <span style="font-size: 12px; font-weight: normal; color: #16a34a;">(${kpis.completadas}/${kpis.total})</span></div>
    </div>
    <div class="kpi-card warning">
      <div class="kpi-label">Pendientes / En Curso</div>
      <div class="kpi-value">${kpis.pendientes}</div>
    </div>
    <div class="kpi-card danger">
      <div class="kpi-label">Vencidas</div>
      <div class="kpi-value">${kpis.vencidas}</div>
    </div>
  </div>

  <div class="eisenhower-summary">
    <strong>Distribución Eisenhower:</strong>
    <span class="eisenhower-tag" style="background: #fee2e2; color: #dc2626;">Q1 Urgente: ${kpis.q1}</span>
    <span class="eisenhower-tag" style="background: #e0f2fe; color: #0284c7;">Q2 Planificar: ${kpis.q2}</span>
    <span class="eisenhower-tag" style="background: #fef3c7; color: #d97706;">Q3 Delegar: ${kpis.q3}</span>
    <span class="eisenhower-tag" style="background: #f1f5f9; color: #475569;">Q4 Baja: ${kpis.q4}</span>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Actividad Docente</th>
          <th>Categoría</th>
          <th>Prioridad</th>
          <th>Estado</th>
          <th style="text-align: right;">Subtareas</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <div class="signatures">
    <div>
      <div class="sign-line"></div>
      <strong>${escapeHtml(userName)}</strong>
      <p style="color: #64748b;">Docente Responsable</p>
    </div>
    <div>
      <div class="sign-line"></div>
      <strong>Coordinación Académica</strong>
      <p style="color: #64748b;">Sello y Conformidad Institucional</p>
    </div>
  </div>
</body>
</html>`

  // Use print window with fallback to iframe
  const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 400)
  } else {
    // Fallback: invisible iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(printHtml)
      doc.close()
      iframe.contentWindow?.focus()
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 400)
    }
  }
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
