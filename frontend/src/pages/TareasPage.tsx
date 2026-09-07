import { AppLayout } from '@/components/layout/AppLayout'
import { TasksView } from '@/components/tasks/TasksView'

/**
 * Página de Tareas — Fase 3.
 * Aloja la vista principal de DataTable con CRUD completo.
 */
export default function TareasPage() {
  return (
    <AppLayout pageTitle="Tareas">
      <TasksView />
    </AppLayout>
  )
}
