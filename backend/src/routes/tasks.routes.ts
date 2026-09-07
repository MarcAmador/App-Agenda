import { Router } from 'express'
import type { Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { supabaseAdmin } from '../config/supabase'
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskFiltersSchema,
} from '../schemas/task.schemas'

export const tasksRouter = Router()

// Todas las rutas de tasks requieren autenticación
tasksRouter.use(authMiddleware)

/**
 * GET /api/v1/tasks
 * Lista las tareas del usuario con filtros opcionales y paginación.
 */
tasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const filters = TaskFiltersSchema.parse(req.query)
    const userId = req.userId!
    const offset = (filters.page - 1) * filters.limit

    let query = supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + filters.limit - 1)

    if (filters.status)       query = query.eq('status', filters.status)
    if (filters.priority)     query = query.eq('priority', filters.priority)
    if (filters.scope_period) query = query.eq('scope_period', filters.scope_period)
    if (filters.category)     query = query.ilike('category', `%${filters.category}%`)
    if (filters.search)       query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    if (filters.due_from)     query = query.gte('due_date', filters.due_from)
    if (filters.due_to)       query = query.lte('due_date', filters.due_to)

    if (!filters.include_archived) {
      query = query.neq('status', 'archivada')
    }

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      data,
      pagination: {
        total: count ?? 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil((count ?? 0) / filters.limit),
      },
    })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las tareas' })
  }
})

/**
 * POST /api/v1/tasks
 * Crea una nueva tarea para el usuario autenticado.
 */
tasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const input = CreateTaskSchema.parse(req.body)
    const userId = req.userId!

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({ ...input, user_id: userId })
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ data })
  } catch (err) {
    res.status(400).json({ error: 'Error al crear la tarea', detail: String(err) })
  }
})

/**
 * PATCH /api/v1/tasks/:id
 * Actualización parcial de una tarea existente.
 */
tasksRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!
    const input = UpdateTaskSchema.parse(req.body)

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(input)
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error || !data) {
      res.status(404).json({ error: 'Tarea no encontrada o sin permisos para editarla' })
      return
    }

    res.json({ data })
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar la tarea', detail: String(err) })
  }
})

/**
 * DELETE /api/v1/tasks/:id
 * Soft-delete: establece deleted_at en lugar de eliminar el registro.
 */
tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }

    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la tarea' })
  }
})
