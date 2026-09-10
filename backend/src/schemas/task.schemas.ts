import { z } from 'zod'

// ─── Enums sincronizados con el schema SQL ────────────────────────────────────

const TaskStatusEnum = z.enum([
  'pendiente', 'en_curso', 'completada', 'perdida', 'anulada', 'archivada',
])

const TaskPriorityEnum = z.enum([
  'urgente_importante', 'importante_no_urgente', 'urgente_no_importante', 'no_urgente_baja',
])

const TaskScopeEnum = z.enum([
  'diario', 'semanal', 'mensual', 'bimestral', 'anual',
])

const TaskSubtaskSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'El texto de la subtarea es requerido').max(500),
  completed: z.boolean().default(false),
})

const TaskLinkSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'El título del enlace es requerido').max(255),
  url: z.string().url('URL inválida').max(1000),
  type: z.enum(['drive', 'meet', 'classroom', 'teams', 'zoom', 'link']).default('link'),
})

// ─── Schema de creación de tarea ─────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  title:        z.string().min(1, 'El título es requerido').max(255),
  description:  z.string().max(5000).nullable().optional(),
  status:       TaskStatusEnum.default('pendiente'),
  priority:     TaskPriorityEnum.default('importante_no_urgente'),
  due_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').nullable().optional(),
  due_time:     z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Formato de hora inválido (HH:MM)').nullable().optional(),
  location:     z.string().max(255).nullable().optional(),
  scope_period: TaskScopeEnum.default('semanal'),
  category:     z.string().max(100).nullable().optional(),
  tags:         z.array(z.string().max(50)).default([]),
  is_shared:    z.boolean().default(false),
  shared_with:  z.array(z.string().uuid()).default([]),
  checklist:    z.array(TaskSubtaskSchema).default([]),
  links:        z.array(TaskLinkSchema).default([]),
})

// ─── Schema de actualización (todos los campos opcionales) ────────────────────

export const UpdateTaskSchema = CreateTaskSchema.partial()

// ─── Schema de filtros de listado ─────────────────────────────────────────────

export const TaskFiltersSchema = z.object({
  status:       TaskStatusEnum.optional(),
  priority:     TaskPriorityEnum.optional(),
  scope_period: TaskScopeEnum.optional(),
  category:     z.string().optional(),
  search:       z.string().max(200).optional(),
  due_from:     z.string().optional(),
  due_to:       z.string().optional(),
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
  include_archived: z.coerce.boolean().default(false),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type TaskFilters = z.infer<typeof TaskFiltersSchema>
