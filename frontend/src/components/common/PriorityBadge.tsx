import type { TaskPriority } from '@/types/database.types'
import { PRIORITY_META } from '@/types/database.types'

interface PriorityBadgeProps {
  priority: TaskPriority
  /** Mostrar solo el cuadrante numérico en lugar de la etiqueta completa */
  compact?: boolean
}

const QUADRANT_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: 'badge-error',
  2: 'badge-success',
  3: 'badge-warning',
  4: 'badge-ghost',
}

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={`badge badge-sm font-medium ${QUADRANT_COLORS[meta.quadrant]}`}
      title={meta.description}
    >
      {compact ? `Q${meta.quadrant}` : meta.label}
    </span>
  )
}
