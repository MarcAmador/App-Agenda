import { useState } from 'react'
import {
  Search,
  X,
  RotateCcw,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react'

import type { TaskFilters } from '@/services/tasks.service'
import type { TaskPriority, TaskStatus, TaskScope } from '@/types/database.types'
import { PRIORITY_META, STATUS_META, SCOPE_META } from '@/types/database.types'

interface AdvancedFilterBarProps {
  filters: TaskFilters
  onFilterChange: (newFilters: TaskFilters) => void
  onClear: () => void
}

export function AdvancedFilterBar({
  filters,
  onFilterChange,
  onClear,
}: AdvancedFilterBarProps) {
  const [expanded, setExpanded] = useState(false)

  // Contar cuántos filtros no vacíos están aplicados
  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'include_archived') return val === true
    return val !== undefined && val !== ''
  }).length

  const handleSearchChange = (val: string) => {
    onFilterChange({
      ...filters,
      search: val.trim() ? val : undefined,
    })
  }

  const handleStatusChange = (val: string) => {
    onFilterChange({
      ...filters,
      status: val !== 'todos' ? val : undefined,
    })
  }

  const handlePriorityChange = (val: string) => {
    onFilterChange({
      ...filters,
      priority: val !== 'todos' ? val : undefined,
    })
  }

  const handleScopeChange = (val: string) => {
    onFilterChange({
      ...filters,
      scope_period: val !== 'todos' ? val : undefined,
    })
  }

  const handleDueFromChange = (val: string) => {
    onFilterChange({
      ...filters,
      due_from: val || undefined,
    })
  }

  const handleDueToChange = (val: string) => {
    onFilterChange({
      ...filters,
      due_to: val || undefined,
    })
  }

  const handleArchivedToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      include_archived: checked || undefined,
    })
  }

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm rounded-2xl p-3.5 flex flex-col gap-3">
      {/* ── Fila Principal: Buscador + Botón Expandir Filtros + Limpiar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        {/* Input de Búsqueda rápida */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={filters.search ?? ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input input-sm input-bordered w-full !pl-10 !pr-8 text-xs rounded-xl focus:border-primary"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botones de acción derecha */}
        <div className="flex items-center gap-2">
          {/* Botón toggle de filtros avanzados */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={[
              'btn btn-sm rounded-xl gap-2 text-xs font-semibold',
              expanded || activeCount > 0
                ? 'btn-primary'
                : 'btn-ghost border border-base-300',
            ].join(' ')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="badge badge-xs badge-neutral px-1.5 py-0 font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Botón Limpiar Todo */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost btn-sm rounded-xl text-xs text-base-content/60 hover:text-error gap-1.5"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Panel Desplegable de Filtros Avanzados ───────────────── */}
      {expanded && (
        <div className="pt-3 border-t border-base-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in-50 slide-in-from-top-2 duration-150 text-xs">
          {/* 1. Selector de Estado */}
          <div className="form-control">
            <label className="label py-1 text-[11px] font-semibold text-base-content/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-info" /> Estado
              </span>
            </label>
            <select
              value={filters.status ?? 'todos'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-medium"
            >
              <option value="todos">Todos los estados</option>
              {(Object.keys(STATUS_META) as TaskStatus[]).map((st) => (
                <option key={st} value={st}>
                  {STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Selector de Prioridad (Eisenhower) */}
          <div className="form-control">
            <label className="label py-1 text-[11px] font-semibold text-base-content/70">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-warning" /> Prioridad (Eisenhower)
              </span>
            </label>
            <select
              value={filters.priority ?? 'todos'}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-medium"
            >
              <option value="todos">Todas las prioridades</option>
              {(Object.keys(PRIORITY_META) as TaskPriority[]).map((pr) => (
                <option key={pr} value={pr}>
                  Q{PRIORITY_META[pr].quadrant}: {PRIORITY_META[pr].label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Selector de Alcance Temporal (Académico) */}
          <div className="form-control">
            <label className="label py-1 text-[11px] font-semibold text-base-content/70">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-secondary" /> Período Académico
              </span>
            </label>
            <select
              value={filters.scope_period ?? 'todos'}
              onChange={(e) => handleScopeChange(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-medium"
            >
              <option value="todos">Todos los períodos</option>
              {(Object.keys(SCOPE_META) as TaskScope[]).map((sc) => (
                <option key={sc} value={sc}>
                  {SCOPE_META[sc].label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Rango de Fechas & Archivadas */}
          <div className="form-control flex flex-col justify-between">
            <label className="label py-1 text-[11px] font-semibold text-base-content/70">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" /> Rango Fecha Límite
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.due_from ?? ''}
                onChange={(e) => handleDueFromChange(e.target.value)}
                className="input input-sm input-bordered w-full rounded-xl text-xs p-1.5"
                title="Fecha desde"
              />
              <span className="text-base-content/40 font-bold">-</span>
              <input
                type="date"
                value={filters.due_to ?? ''}
                onChange={(e) => handleDueToChange(e.target.value)}
                className="input input-sm input-bordered w-full rounded-xl text-xs p-1.5"
                title="Fecha hasta"
              />
            </div>
            {/* Checkbox incluir archivadas */}
            <label className="cursor-pointer label py-1 mt-1 justify-start gap-2">
              <input
                type="checkbox"
                checked={filters.include_archived ?? false}
                onChange={(e) => handleArchivedToggle(e.target.checked)}
                className="checkbox checkbox-xs checkbox-primary rounded"
              />
              <span className="label-text text-[11px] text-base-content/70">
                Incluir archivadas
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── Chips / Píldoras de Filtros Activos ──────────────────── */}
      {activeCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span className="text-base-content/40 font-medium mr-1">Filtros:</span>

          {filters.search && (
            <span className="badge badge-sm badge-outline gap-1 text-base-content">
              Texto: &ldquo;{filters.search}&rdquo;
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="badge badge-sm badge-info badge-outline gap-1">
              Estado: {STATUS_META[filters.status as TaskStatus]?.label ?? filters.status}
              <button
                type="button"
                onClick={() => handleStatusChange('todos')}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {filters.priority && (
            <span className="badge badge-sm badge-warning badge-outline gap-1">
              Prioridad: {PRIORITY_META[filters.priority as TaskPriority]?.label ?? filters.priority}
              <button
                type="button"
                onClick={() => handlePriorityChange('todos')}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {filters.scope_period && (
            <span className="badge badge-sm badge-secondary badge-outline gap-1">
              Período: {SCOPE_META[filters.scope_period as TaskScope]?.label ?? filters.scope_period}
              <button
                type="button"
                onClick={() => handleScopeChange('todos')}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {(filters.due_from || filters.due_to) && (
            <span className="badge badge-sm badge-outline gap-1">
              Fechas: {filters.due_from ?? '...'} / {filters.due_to ?? '...'}
              <button
                type="button"
                onClick={() => {
                  handleDueFromChange('')
                  handleDueToChange('')
                }}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}

          {filters.include_archived && (
            <span className="badge badge-sm badge-ghost gap-1">
              Archivadas incluidas
              <button
                type="button"
                onClick={() => handleArchivedToggle(false)}
                className="hover:text-error"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
