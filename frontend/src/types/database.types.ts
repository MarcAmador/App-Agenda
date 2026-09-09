/**
 * Tipos TypeScript generados a partir del schema de Supabase.
 * Deben mantenerse sincronizados con `supabase/migrations/20260907000001_initial_schema.sql`.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'pendiente'
  | 'en_curso'
  | 'completada'
  | 'perdida'
  | 'anulada'
  | 'archivada'

export type TaskPriority =
  | 'urgente_importante'      // Cuadrante 1: Hacer ya
  | 'importante_no_urgente'   // Cuadrante 2: Planificar
  | 'urgente_no_importante'   // Cuadrante 3: Delegar
  | 'no_urgente_baja'         // Cuadrante 4: Eliminar / Baja prioridad

export type TaskScope =
  | 'diario'
  | 'semanal'
  | 'mensual'
  | 'bimestral'
  | 'anual'

export type NotificationChannel = 'email' | 'whatsapp' | 'telegram'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

// ─── Tabla: tasks ─────────────────────────────────────────────────────────────

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null       // ISO date string (YYYY-MM-DD)
  due_time: string | null       // HH:MM:SS
  location: string | null
  scope_period: TaskScope
  category: string | null
  tags: string[]
  is_shared: boolean
  shared_with: string[]
  deleted_at: string | null     // TIMESTAMPTZ — null = activa
  created_at: string
  updated_at: string
}

/** Payload para crear una nueva tarea (campos opcionales con defaults en la BD) */
export type CreateTaskInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>

/** Payload parcial para actualizar una tarea existente */
export type UpdateTaskInput = Partial<CreateTaskInput>

// ─── Tabla: user_preferences ─────────────────────────────────────────────────

export interface UserPreferences {
  user_id: string
  notification_channels: NotificationChannel[]
  phone_number: string | null
  telegram_chat_id: string | null
  reminder_lead_time_minutes: number
  theme: string
  created_at: string
  updated_at: string
}

export type UpdateUserPreferencesInput = Partial<
  Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>
>

// ─── Tabla: reminder_logs ─────────────────────────────────────────────────────

export interface ReminderLog {
  id: string
  task_id: string
  user_id: string
  channel: NotificationChannel
  status: NotificationStatus
  scheduled_for: string
  sent_at: string | null
  error_message: string | null
  created_at: string
}

// ─── Supabase Database types (para tipado del cliente) ─────────────────────

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: CreateTaskInput & { user_id: string }
        Update: UpdateTaskInput
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'created_at' | 'updated_at'>
        Update: UpdateUserPreferencesInput
      }
      reminder_logs: {
        Row: ReminderLog
        Insert: Omit<ReminderLog, 'id' | 'created_at'>
        Update: Partial<Pick<ReminderLog, 'status' | 'sent_at' | 'error_message'>>
      }
    }
    Enums: {
      task_status: TaskStatus
      task_priority: TaskPriority
      task_scope: TaskScope
      notification_channel: NotificationChannel
      notification_status: NotificationStatus
    }
  }
}

// ─── Helpers de UI: etiquetas y metadatos de los enums ────────────────────────

export interface PriorityMeta {
  label: string
  description: string
  quadrant: 1 | 2 | 3 | 4
  colorClass: string
  badgeClass: string
}

export const PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  urgente_importante: {
    label: 'Urgente e Importante',
    description: 'Hacer ya — Crisis, plazos inminentes',
    quadrant: 1,
    colorClass: 'text-error',
    badgeClass: 'badge-error',
  },
  importante_no_urgente: {
    label: 'Importante, No Urgente',
    description: 'Planificar — Desarrollo, relaciones',
    quadrant: 2,
    colorClass: 'text-success',
    badgeClass: 'badge-success',
  },
  urgente_no_importante: {
    label: 'Urgente, No Importante',
    description: 'Delegar — Interrupciones, reuniones',
    quadrant: 3,
    colorClass: 'text-warning',
    badgeClass: 'badge-warning',
  },
  no_urgente_baja: {
    label: 'Baja Prioridad',
    description: 'Eliminar — Trivialidades, tiempo perdido',
    quadrant: 4,
    colorClass: 'text-base-content/40',
    badgeClass: 'badge-ghost',
  },
}

export const STATUS_META: Record<TaskStatus, { label: string; badgeClass: string }> = {
  pendiente:  { label: 'Pendiente',  badgeClass: 'badge-neutral' },
  en_curso:   { label: 'En curso',   badgeClass: 'badge-info' },
  completada: { label: 'Completada', badgeClass: 'badge-success' },
  perdida:    { label: 'Perdida',    badgeClass: 'badge-error' },
  anulada:    { label: 'Anulada',    badgeClass: 'badge-ghost' },
  archivada:  { label: 'Archivada',  badgeClass: 'badge-neutral badge-outline' },
}

export const SCOPE_META: Record<TaskScope, { label: string }> = {
  diario:    { label: 'Diario' },
  semanal:   { label: 'Semanal' },
  mensual:   { label: 'Mensual' },
  bimestral: { label: 'Bimestral' },
  anual:     { label: 'Anual' },
}
