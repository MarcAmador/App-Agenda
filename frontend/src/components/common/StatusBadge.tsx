import type { TaskStatus } from '@/types/database.types'
import { STATUS_META } from '@/types/database.types'

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  return (
    <span className={`badge badge-sm font-semibold tracking-wide h-6 px-3 py-1 rounded-lg ${meta.badgeClass}`}>
      {meta.label}
    </span>
  )
}
