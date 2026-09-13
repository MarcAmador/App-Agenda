import { useState, useCallback } from 'react'
import { DataTable, type DataTableSelectionMultipleChangeEvent } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Tooltip } from 'primereact/tooltip'
import { Calendar } from 'primereact/calendar'
import {
  Pencil, Trash2, Archive, CheckCircle2, Clock, Ban,
  ChevronDown, MessageSquare, Check, ListChecks, ExternalLink,
  Folder, Video, BookOpen, Globe, Eye
} from 'lucide-react'

import type { Task, TaskStatus } from '@/types/database.types'
import { STATUS_META, PRIORITY_META } from '@/types/database.types'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { soundEngine } from '@/utils/audioEffects'
import { triggerConfetti } from '@/utils/confetti'
import { shareTaskViaWhatsApp } from '@/utils/whatsappShare'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TaskDataTableProps {
  tasks: Task[]
  loading: boolean
  totalRecords: number
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onArchive: (id: string) => void
  onViewDetails?: (task: Task) => void
}

const STATUS_CHANGE_OPTIONS: { label: string; value: TaskStatus; icon: React.ElementType }[] = [
  { label: 'Pendiente',  value: 'pendiente',  icon: Clock },
  { label: 'En curso',   value: 'en_curso',   icon: Clock },
  { label: 'Completada', value: 'completada', icon: CheckCircle2 },
  { label: 'Perdida',    value: 'perdida',    icon: Ban },
  { label: 'Anulada',    value: 'anulada',    icon: Ban },
]

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  const [h, min] = timeStr.split(':')
  const hour = parseInt(h, 10)
  return `${hour > 12 ? hour - 12 : hour || 12}:${min} ${hour >= 12 ? 'PM' : 'AM'}`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TaskDataTable({
  tasks,
  loading,
  totalRecords,
  onEdit,
  onDelete,
  onStatusChange,
  onArchive,
  onViewDetails,
}: TaskDataTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rows, setRows] = useState(15)

  // ─── Templates de columnas ────────────────────────────────────────────────

  const titleTemplate = (row: Task) => {
    const subtasks = row.checklist || []
    const completedSubtasks = subtasks.filter((s) => s.completed).length
    const links = row.links || []

    return (
      <div className="flex flex-col gap-1 max-w-xs">
        <button
          type="button"
          onClick={() => onViewDetails?.(row)}
          className="text-left font-medium text-sm text-base-content leading-tight truncate hover:text-primary hover:underline transition-colors"
          title={`Ver detalles de: ${row.title}`}
        >
          {row.title}
        </button>
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.category && (
            <span className="text-xs text-base-content/50">{row.category}</span>
          )}
          {subtasks.length > 0 && (
            <span
              className="badge badge-primary badge-outline badge-xs gap-1 font-semibold py-1"
              title={`${completedSubtasks} de ${subtasks.length} pasos completados`}
            >
              <ListChecks className="w-2.5 h-2.5" />
              <span>{completedSubtasks}/{subtasks.length}</span>
            </span>
          )}
        </div>
        {links.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            {links.map((lnk) => (
              <a
                key={lnk.id}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="badge badge-ghost badge-xs hover:badge-primary gap-1 transition-all"
                title={lnk.title || lnk.url}
              >
                {lnk.type === 'drive' ? (
                  <Folder className="w-2.5 h-2.5 text-amber-500" />
                ) : lnk.type === 'meet' || lnk.type === 'teams' || lnk.type === 'zoom' ? (
                  <Video className="w-2.5 h-2.5 text-emerald-500" />
                ) : lnk.type === 'classroom' ? (
                  <BookOpen className="w-2.5 h-2.5 text-green-600" />
                ) : (
                  <Globe className="w-2.5 h-2.5 text-primary" />
                )}
                <span className="max-w-[90px] truncate">{lnk.title}</span>
                <ExternalLink className="w-2 h-2 opacity-50" />
              </a>
            ))}
          </div>
        )}
        {row.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {row.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-xs badge-outline">{tag}</span>
            ))}
            {row.tags.length > 3 && (
              <span className="badge badge-xs badge-ghost">+{row.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  const statusTemplate = (row: Task) => {
    return (
      <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
        <div
          tabIndex={0}
          role="button"
          className="flex items-center gap-1 cursor-pointer group/badge py-1 px-1.5 rounded-lg hover:bg-base-200 transition-colors"
          title="Cambiar estado"
        >
          <StatusBadge status={row.status} />
          <ChevronDown className="w-3 h-3 text-base-content/40 group-hover/badge:text-base-content transition-colors" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-50 menu p-1.5 shadow-xl bg-base-100 border border-base-200 rounded-box w-44 gap-0.5"
        >
          {STATUS_CHANGE_OPTIONS.map(({ label, value }) => (
            <li key={value}>
              <button
                type="button"
                disabled={row.status === value}
                onClick={(e) => {
                  e.stopPropagation()
                  if (value === 'completada' && row.status !== 'completada') {
                    soundEngine.playSuccessChime()
                    triggerConfetti()
                  }
                  onStatusChange(row.id, value)
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur()
                  }
                }}
                className={`flex items-center justify-between py-1.5 px-2.5 text-xs rounded-lg ${
                  row.status === value ? 'active font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`badge badge-xs ${STATUS_META[value].badgeClass}`} />
                  <span>{label}</span>
                </div>
                {row.status === value && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const priorityTemplate = (row: Task) => (
    <PriorityBadge priority={row.priority} compact />
  )

  const dueDateTemplate = (row: Task) => (
    <div className="flex flex-col gap-0">
      <span className="text-sm text-base-content">{formatDate(row.due_date)}</span>
      {row.due_time && (
        <span className="text-xs text-base-content/50">{formatTime(row.due_time)}</span>
      )}
    </div>
  )

  const scopeTemplate = (row: Task) => {
    const SCOPE_LABELS: Record<string, string> = {
      diario: 'Diario', semanal: 'Semanal', mensual: 'Mensual',
      bimestral: 'Bimestral', anual: 'Anual',
    }
    return (
      <span className="badge badge-sm badge-outline badge-neutral">
        {SCOPE_LABELS[row.scope_period] ?? row.scope_period}
      </span>
    )
  }

  const actionsTemplate = useCallback((row: Task) => (
    <div className="flex items-center gap-1">
      {/* Completar / Desmarcar Rápido */}
      <button
        type="button"
        className={[
          'btn btn-ghost btn-xs btn-circle transition-colors',
          row.status === 'completada'
            ? 'text-success hover:bg-success/15'
            : 'text-base-content/40 hover:text-success hover:bg-base-200',
        ].join(' ')}
        title={row.status === 'completada' ? 'Marcar como pendiente' : 'Marcar como completada'}
        onClick={() => {
          const nextStatus = row.status === 'completada' ? 'pendiente' : 'completada'
          if (nextStatus === 'completada') {
            soundEngine.playSuccessChime()
            triggerConfetti()
          }
          onStatusChange(row.id, nextStatus)
        }}
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      {/* Ver Detalles */}
      {onViewDetails && (
        <button
          type="button"
          id="tour-task-detail-btn"
          className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
          title="Ver detalles de la tarea"
          onClick={() => onViewDetails(row)}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Editar */}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-circle"
        title="Editar tarea"
        onClick={() => onEdit(row)}
      >
        <Pencil className="w-3.5 h-3.5 text-base-content/70" />
      </button>

      {/* Compartir / Enviar por WhatsApp */}
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-circle text-success hover:bg-success/10"
        title="Enviar recordatorio por WhatsApp"
        onClick={() => {
          shareTaskViaWhatsApp({
            title: row.title,
            description: row.description,
            dueDate: row.due_date,
            dueTime: row.due_time,
            priorityLabel: PRIORITY_META[row.priority]?.label ?? row.priority,
            category: row.category,
          })
        }}
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>


      {/* Archivar */}
      <button
        className="btn btn-ghost btn-xs btn-circle"
        title="Archivar"
        onClick={() => onArchive(row.id)}
      >
        <Archive className="w-3.5 h-3.5 text-base-content/50" />
      </button>

      {/* Eliminar */}
      <button
        className="btn btn-ghost btn-xs btn-circle"
        title="Eliminar"
        onClick={() =>
          confirmDialog({
            message: `¿Eliminar "${row.title}"? Esta acción no se puede deshacer.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger p-button-sm',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => onDelete(row.id),
          })
        }
      >
        <Trash2 className="w-3.5 h-3.5 text-error/70 hover:text-error transition-colors" />
      </button>
    </div>
  ), [onStatusChange, onEdit, onDelete, onArchive, onViewDetails])

  // ─── Header del DataTable ─────────────────────────────────────────────────

  const tableHeader = (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-base-content/70">
          {totalRecords} tarea{totalRecords !== 1 ? 's' : ''}
        </span>
        {selectedTasks.length > 0 && (
          <span className="badge badge-primary badge-sm">
            {selectedTasks.length} seleccionada{selectedTasks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="relative">
        <span className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 text-xs pointer-events-none" />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar actividades..."
          className="input input-sm input-bordered rounded-xl !pl-10 !pr-4 w-64 text-xs font-medium focus:outline-primary transition-all shadow-2xs"
        />
      </div>
    </div>
  )

  return (
    <>
      <ConfirmDialog />
      <Tooltip target="[data-pr-tooltip]" />

      <DataTable
        value={tasks}
        loading={loading}
        paginator
        rows={rows}
        onPage={(e) => {
          if (e.rows) setRows(e.rows)
        }}
        totalRecords={totalRecords}
        dataKey="id"
        globalFilter={globalFilter}
        globalFilterFields={['title', 'description', 'category', 'tags']}
        selection={selectedTasks}
        onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<Task[]>) =>
          setSelectedTasks(e.value)
        }
        selectionMode="multiple"
        header={tableHeader}
        emptyMessage={
          <div className="flex flex-col items-center gap-3 py-12 text-base-content/40">
            <span className="pi pi-inbox text-4xl" />
            <p className="text-sm font-medium">No hay tareas para mostrar</p>
            <p className="text-xs">Crea tu primera tarea con el botón &quot;Nueva Tarea&quot;</p>
          </div>
        }
        rowClassName={() => 'group/row transition-colors'}
        className="text-sm"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="{first}-{last} de {totalRecords}"
        rowsPerPageOptions={[10, 15, 25, 50]}
        sortMode="multiple"
        removableSort
        stripedRows
        size="small"
      >
        <Column selectionMode="multiple" style={{ width: '3rem' }} frozen />

        <Column
          field="title"
          header="Título / Categoría"
          body={titleTemplate}
          sortable
          style={{ minWidth: '16rem' }}
        />

        <Column
          field="status"
          header="Estado"
          body={statusTemplate}
          sortable
          style={{ minWidth: '9rem' }}
          filter
          filterElement={(options) => (
            <Dropdown
              value={options.value as string}
              options={Object.entries(STATUS_META).map(([v, m]) => ({ label: m.label, value: v }))}
              onChange={(e) => options.filterCallback(e.value as string)}
              placeholder="Estado"
              className="p-column-filter p-inputtext-sm"
              showClear
            />
          )}
          showFilterMenu={false}
        />

        <Column
          field="priority"
          header="Prioridad"
          body={priorityTemplate}
          sortable
          style={{ minWidth: '7rem' }}
        />

        <Column
          field="due_date"
          header="Fecha"
          body={dueDateTemplate}
          sortable
          style={{ minWidth: '8rem' }}
          filter
          filterElement={(options) => (
            <Calendar
              value={options.value as Date}
              onChange={(e) => options.filterCallback(e.value)}
              dateFormat="dd/mm/yy"
              placeholder="Filtrar por fecha"
              className="p-column-filter p-inputtext-sm"
              showButtonBar
            />
          )}
          showFilterMenu={false}
        />

        <Column
          field="scope_period"
          header="Alcance"
          body={scopeTemplate}
          sortable
          style={{ minWidth: '8rem' }}
        />

        <Column
          header="Acciones"
          body={actionsTemplate}
          style={{ width: '8rem' }}
          frozen
          alignFrozen="right"
        />
      </DataTable>
    </>
  )
}
