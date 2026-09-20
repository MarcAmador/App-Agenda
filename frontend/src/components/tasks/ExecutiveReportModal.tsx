import { useState, useMemo, useRef } from 'react'
import { Dialog } from 'primereact/dialog'
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  BarChart3,
  Sparkles,
  Calendar,
} from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types/database.types'
import { useAuth } from '@/context/AuthContext'
import { downloadICalFile } from '@/utils/calendarExport'
import { printExecutiveReport } from '@/utils/printReport'
import toast from 'react-hot-toast'

interface ExecutiveReportModalProps {
  visible: boolean
  onHide: () => void
  tasks: Task[]
}

type PeriodFilter = 'todos' | 'hoy' | 'semana' | 'mes' | 'proximos30'
type StatusReportFilter = 'todas' | 'pendientes' | 'completadas'

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgente_importante: 'Q1: Urgente e Importante (Hacer Ya)',
  importante_no_urgente: 'Q2: Importante, No Urgente (Planificar)',
  urgente_no_importante: 'Q3: Urgente, No Importante (Delegar)',
  no_urgente_baja: 'Q4: No Urgente, Baja Prioridad',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En Curso',
  completada: 'Completada',
  perdida: 'Vencida / Perdida',
  anulada: 'Anulada',
  archivada: 'Archivada',
}

export function ExecutiveReportModal({ visible, onHide, tasks }: ExecutiveReportModalProps) {
  const { user } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)

  // Filtros de reporte
  const [period, setPeriod] = useState<PeriodFilter>('todos')
  const [statusFilter, setStatusFilter] = useState<StatusReportFilter>('todas')
  const [categoryFilter, setCategoryFilter] = useState<string>('todas')

  // Obtener categorías únicas presentes en las tareas
  const categories = useMemo(() => {
    const set = new Set<string>()
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim())
      }
    })
    return Array.from(set).sort()
  }, [tasks])

  // Filtrar tareas según selecciones
  const filteredTasks = useMemo(() => {
    const today = new Date()
    const fmt = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    return tasks.filter((t) => {
      // Filtro por Estado
      if (statusFilter === 'completadas' && t.status !== 'completada') return false
      if (statusFilter === 'pendientes' && (t.status === 'completada' || t.status === 'anulada' || t.status === 'archivada')) return false

      // Filtro por Categoría
      if (categoryFilter !== 'todas' && t.category !== categoryFilter) return false

      // Filtro por Período
      if (period === 'hoy') {
        if (!t.due_date) return false
        return t.due_date === fmt(today)
      }

      if (period === 'semana') {
        if (!t.due_date) return false
        const tDate = new Date(t.due_date + 'T00:00:00')
        const dayOfWeek = today.getDay()
        const start = new Date(today)
        start.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        return tDate >= start && tDate <= end
      }

      if (period === 'mes') {
        if (!t.due_date) return false
        const tDate = new Date(t.due_date + 'T00:00:00')
        return (
          tDate.getFullYear() === today.getFullYear() &&
          tDate.getMonth() === today.getMonth()
        )
      }

      if (period === 'proximos30') {
        if (!t.due_date) return false
        const tDate = new Date(t.due_date + 'T00:00:00')
        const diffDays = Math.ceil((tDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 30
      }

      return true
    })
  }, [tasks, period, statusFilter, categoryFilter])

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredTasks.length
    const completadas = filteredTasks.filter((t) => t.status === 'completada').length
    const pendientes = filteredTasks.filter((t) => t.status === 'pendiente' || t.status === 'en_curso').length
    const now = new Date()
    const hoyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const vencidas = filteredTasks.filter(
      (t) => t.status !== 'completada' && t.due_date && t.due_date < hoyStr
    ).length
    const completionRate = total > 0 ? Math.round((completadas / total) * 100) : 0

    // Conteo por cuadrante
    const q1 = filteredTasks.filter((t) => t.priority === 'urgente_importante').length
    const q2 = filteredTasks.filter((t) => t.priority === 'importante_no_urgente').length
    const q3 = filteredTasks.filter((t) => t.priority === 'urgente_no_importante').length
    const q4 = filteredTasks.filter((t) => t.priority === 'no_urgente_baja').length

    return { total, completadas, pendientes, vencidas, completionRate, q1, q2, q3, q4 }
  }, [filteredTasks])

  // Exportar a Excel (CSV con UTF-8 BOM)
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      toast.error('No hay actividades para exportar con los filtros seleccionados')
      return
    }

    const headers = [
      'ID',
      'Título',
      'Estado',
      'Prioridad (Eisenhower)',
      'Categoría',
      'Ámbito',
      'Fecha Límite',
      'Hora',
      'Total Subtareas',
      'Subtareas Completadas',
      '% Avance',
      'Descripción',
    ]

    const rows = filteredTasks.map((t) => {
      const totalSteps = t.checklist ? t.checklist.length : 0
      const completedSteps = t.checklist ? t.checklist.filter((s) => s.completed).length : 0
      const progress = totalSteps > 0 ? `${Math.round((completedSteps / totalSteps) * 100)}%` : 'N/A'
      const cleanDesc = (t.description || '').replace(/"/g, '""').replace(/(\r\n|\n|\r)/gm, ' ')

      return [
        `"${t.id}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${STATUS_LABELS[t.status] || t.status}"`,
        `"${PRIORITY_LABELS[t.priority] || t.priority}"`,
        `"${t.category || 'Sin categoría'}"`,
        `"${t.scope_period}"`,
        `"${t.due_date || 'Sin fecha'}"`,
        `"${t.due_time || ''}"`,
        totalSteps,
        completedSteps,
        `"${progress}"`,
        `"${cleanDesc}"`,
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const todayStr = new Date().toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `AgendaPro_Informe_Ejecutivo_${todayStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('📊 Archivo Excel/CSV generado con éxito', { icon: '📥' })
  }

  // Imprimir / Guardar en PDF con ventana y documento dedicado
  const handlePrint = () => {
    printExecutiveReport({
      tasks: filteredTasks,
      kpis,
      userName: (user?.user_metadata?.full_name as string) || 'Docente Titular',
      userEmail: user?.email || '',
    })
  }
  // Exportar a Calendario (.ics para Google Calendar, Apple, Outlook)
  const handleExportICal = () => {
    if (filteredTasks.length === 0) {
      toast.error('No hay actividades para exportar con los filtros seleccionados')
      return
    }
    const todayStr = new Date().toISOString().split('T')[0]
    downloadICalFile(filteredTasks, `AgendaPro_Calendario_${todayStr}.ics`)
    toast.success('📅 Archivo iCalendar (.ics) generado con éxito', { icon: '🗓️' })
  }

  const currentDateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      closable={false}
      className="w-full max-w-5xl mx-4 rounded-3xl overflow-hidden shadow-2xl border border-base-200"
      contentClassName="p-0 bg-base-100"
      maskClassName="backdrop-blur-sm bg-base-900/50"
    >


      {/* ── Encabezado Modal y Controles de Acción ─────────────────── */}
      <div className="p-5 border-b border-base-200 bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 flex items-center justify-between gap-4 flex-wrap no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-md shadow-primary/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-base-content flex items-center gap-2">
              Informe Ejecutivo de Actividades Docentes
              <span className="badge badge-primary badge-sm font-semibold">Pro</span>
            </h2>
            <p className="text-xs text-base-content/60">
              Visualización y exportación formal para claustros, coordinaciones y dirección.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-sm btn-outline gap-2 rounded-xl text-xs hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-colors"
            title="Exportar a formato compatible con Excel / Google Sheets"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportICal}
            className="btn btn-sm btn-outline gap-2 rounded-xl text-xs hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-colors"
            title="Exportar archivo iCalendar (.ics) para sincronizar con Google Calendar, Apple Calendar o Outlook"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Exportar iCal (.ics)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-sm btn-primary gap-2 rounded-xl text-xs shadow-sm"
            title="Imprimir o guardar como documento PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={onHide}
            className="btn btn-ghost btn-circle btn-sm"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Barra de Filtros de Reporte ────────────────────────────── */}
      <div className="p-4 bg-base-200/50 border-b border-base-200 flex items-center gap-3 flex-wrap text-xs no-print">
        <div className="flex items-center gap-1.5 text-base-content/70 font-semibold shrink-0">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filtros de Informe:</span>
        </div>

        {/* Período */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          className="select select-bordered select-xs rounded-lg"
        >
          <option value="todos">Todos los tiempos</option>
          <option value="hoy">Sólo Hoy</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mes</option>
          <option value="proximos30">Próximos 30 días</option>
        </select>

        {/* Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusReportFilter)}
          className="select select-bordered select-xs rounded-lg"
        >
          <option value="todas">Todos los estados</option>
          <option value="pendientes">Pendientes / En Curso</option>
          <option value="completadas">Sólo Completadas</option>
        </select>

        {/* Categoría */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select select-bordered select-xs rounded-lg capitalize"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        )}

        <span className="text-base-content/50 ml-auto font-medium">
          Mostrando <strong className="text-base-content">{filteredTasks.length}</strong> de {tasks.length} actividades
        </span>
      </div>

      {/* ── Área Imprimible / Vista Previa Formal ───────────────────── */}
      <div
        id="executive-printable-area"
        ref={printRef}
        className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto bg-base-100 space-y-6"
      >
        {/* Cabecera Membretada Institucional */}
        <div className="flex items-start justify-between border-b-2 border-primary/30 pb-5 gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-base-300"
            />
            <div>
              <h1 className="text-xl font-extrabold text-base-content tracking-tight uppercase">
                AgendaPro — Informe de Gestión Académica
              </h1>
              <p className="text-xs text-base-content/60 font-medium capitalize">
                {currentDateStr}
              </p>
            </div>
          </div>

          <div className="text-right text-xs space-y-0.5">
            <span className="font-bold text-base-content block">
              {(user?.user_metadata?.full_name as string) || 'Docente Titular'}
            </span>
            <span className="text-base-content/60 block">{user?.email || 'docente@institucion.edu'}</span>
            <span className="inline-block badge badge-xs badge-neutral mt-1">
              Docencia & Coordinación
            </span>
          </div>
        </div>

        {/* Resumen Ejecutivo de Métricas (KPI Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-base-200/50 border border-base-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-base-content/60 mb-1">
              <span className="text-xs font-medium">Total Tareas</span>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-black text-base-content">{kpis.total}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Tasa de Cumplimiento</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {kpis.completionRate}%
              </span>
              <span className="text-xs text-emerald-600/70">
                ({kpis.completadas}/{kpis.total})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
              <span className="text-xs font-semibold">Pendientes / En Curso</span>
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {kpis.pendientes}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
              <span className="text-xs font-semibold">Vencidas</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {kpis.vencidas}
            </span>
          </div>
        </div>

        {/* Desglose Cuadrantes de Eisenhower */}
        <div className="p-4 rounded-2xl bg-base-200/30 border border-base-200 flex items-center justify-between gap-3 flex-wrap text-xs">
          <span className="font-bold text-base-content/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Distribución Eisenhower:
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="badge badge-error badge-outline gap-1 font-medium">
              Q1 Urgente: <strong>{kpis.q1}</strong>
            </span>
            <span className="badge badge-info badge-outline gap-1 font-medium">
              Q2 Planificar: <strong>{kpis.q2}</strong>
            </span>
            <span className="badge badge-warning badge-outline gap-1 font-medium">
              Q3 Delegar: <strong>{kpis.q3}</strong>
            </span>
            <span className="badge badge-neutral badge-outline gap-1 font-medium">
              Q4 Baja: <strong>{kpis.q4}</strong>
            </span>
          </div>
        </div>

        {/* Tabla Detallada de Actividades */}
        <div className="overflow-x-auto rounded-2xl border border-base-200">
          <table className="table table-xs sm:table-sm w-full">
            <thead className="bg-base-200 text-base-content/70 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Actividad Docente</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Prioridad</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Subtareas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200 font-normal">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-base-content/50 italic text-xs">
                    No se encontraron actividades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const totalSteps = t.checklist ? t.checklist.length : 0
                  const doneSteps = t.checklist ? t.checklist.filter((s) => s.completed).length : 0
                  const isDone = t.status === 'completada'

                  return (
                    <tr key={t.id} className="hover:bg-base-200/40 transition-colors">
                      {/* Fecha */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-semibold text-xs block text-base-content">
                          {t.due_date || 'Sin fecha'}
                        </span>
                        {t.due_time && (
                          <span className="text-[10px] text-base-content/50 block">
                            {t.due_time.substring(0, 5)}
                          </span>
                        )}
                      </td>

                      {/* Título & Descripción */}
                      <td className="px-3 py-2.5 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-xs text-base-content line-clamp-1">
                          {t.title}
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-base-content/60 line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="badge badge-ghost badge-xs capitalize text-[11px]">
                          {t.category || 'General'}
                        </span>
                      </td>

                      {/* Prioridad */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`badge badge-xs text-[10px] font-semibold ${
                            t.priority === 'urgente_importante'
                              ? 'badge-error'
                              : t.priority === 'importante_no_urgente'
                              ? 'badge-info'
                              : t.priority === 'urgente_no_importante'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {t.priority === 'urgente_importante'
                            ? 'Urgente'
                            : t.priority === 'importante_no_urgente'
                            ? 'Planificar'
                            : t.priority === 'urgente_no_importante'
                            ? 'Delegar'
                            : 'Baja'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`badge badge-xs font-semibold ${
                            isDone
                              ? 'badge-success'
                              : t.status === 'en_curso'
                              ? 'badge-primary'
                              : 'badge-ghost'
                          }`}
                        >
                          {STATUS_LABELS[t.status] || t.status}
                        </span>
                      </td>

                      {/* Subtareas */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-right text-xs">
                        {totalSteps > 0 ? (
                          <span className="font-mono text-[11px] text-base-content/70">
                            <strong className={doneSteps === totalSteps ? 'text-success' : ''}>
                              {doneSteps}
                            </strong>
                            /{totalSteps} ({Math.round((doneSteps / totalSteps) * 100)}%)
                          </span>
                        ) : (
                          <span className="text-base-content/40 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de Firma Institucional para Impresión */}
        <div className="pt-8 mt-8 border-t border-base-200 grid grid-cols-2 gap-8 text-center text-xs text-base-content/60">
          <div>
            <div className="w-48 mx-auto border-b border-base-content/30 mb-2"></div>
            <p className="font-semibold text-base-content">
              {(user?.user_metadata?.full_name as string) || 'Firma del Docente'}
            </p>
            <p className="text-[11px]">Docente Responsable</p>
          </div>
          <div>
            <div className="w-48 mx-auto border-b border-base-content/30 mb-2"></div>
            <p className="font-semibold text-base-content">Coordinación Académica</p>
            <p className="text-[11px]">Sello y Conformidad</p>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
