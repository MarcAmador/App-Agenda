import type { TaskStatus } from '@/types/database.types'
import { STATUS_META } from '@/types/database.types'

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <span className={`badge badge-sm font-medium ${meta.badgeClass}`}>
      {meta.label}
    </span>
  )
}
