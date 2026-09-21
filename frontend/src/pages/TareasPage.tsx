import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { TasksView, type ViewMode } from '@/components/tasks/TasksView'

interface TareasPageProps {
  initialView?: ViewMode
}

export default function TareasPage({ initialView }: TareasPageProps) {
  const [searchParams] = useSearchParams()
  const viewFromQuery = searchParams.get('view') as ViewMode | null
  const selectedMode = initialView || viewFromQuery || 'tabla'

  return (
    <AppLayout pageTitle={selectedMode === 'kanban' ? 'Tablero Kanban' : 'Tareas'}>
      <TasksView initialViewMode={selectedMode} />
    </AppLayout>
  )
}
