import { supabase } from '@/lib/supabaseClient'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/database.types'

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface TaskListResponse {
  data: Task[]
  count: number
}

export interface TaskFilters {
  status?: string
  priority?: string
  scope_period?: string
  search?: string
  due_from?: string
  due_to?: string
  include_archived?: boolean
}

// ─── Servicio de Tareas (acceso directo a Supabase con RLS) ──────────────────

/**
 * Obtiene las tareas activas del usuario autenticado.
 * La RLS de Supabase garantiza que solo se retornan sus propias tareas.
 */
export async function getTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters.status)       query = query.eq('status', filters.status)
  if (filters.priority)     query = query.eq('priority', filters.priority)
  if (filters.scope_period) query = query.eq('scope_period', filters.scope_period)
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    )
  }
  if (filters.due_from) query = query.gte('due_date', filters.due_from)
  if (filters.due_to)   query = query.lte('due_date', filters.due_to)

  if (!filters.include_archived) {
    query = query.neq('status', 'archivada')
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

/** Crea una nueva tarea para el usuario autenticado */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tasks') as any)
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Task
}

/** Actualización parcial de una tarea */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tasks') as any)
    .update(input)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

/** Soft-delete: establece deleted_at en la tarea */
export async function deleteTask(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('tasks') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

/** Cambia únicamente el estado de una tarea (acción rápida desde DataTable) */
export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  return updateTask(id, { status })
}

/** Cambia únicamente la prioridad de una tarea (para la Matriz de Eisenhower) */
export async function updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
  return updateTask(id, { priority })
}

