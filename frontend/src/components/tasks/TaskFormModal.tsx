import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { Chips } from 'primereact/chips'
import { X } from 'lucide-react'
import type { Task, CreateTaskInput, TaskStatus, TaskPriority, TaskScope } from '@/types/database.types'
import { PRIORITY_META, SCOPE_META, STATUS_META } from '@/types/database.types'

// ─── Opciones de selects ──────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = (
  Object.entries(STATUS_META) as [TaskStatus, (typeof STATUS_META)[TaskStatus]][]
).map(([value, m]) => ({ label: m.label, value }))

const PRIORITY_OPTIONS: { label: string; value: TaskPriority; description: string }[] = (
  Object.entries(PRIORITY_META) as [TaskPriority, (typeof PRIORITY_META)[TaskPriority]][]
).map(([value, m]) => ({ label: m.label, value, description: m.description }))

const SCOPE_OPTIONS: { label: string; value: TaskScope }[] = (
  Object.entries(SCOPE_META) as [TaskScope, (typeof SCOPE_META)[TaskScope]][]
).map(([value, m]) => ({ label: m.label, value }))

const CATEGORY_OPTIONS = [
  'Reunión', 'Examen', 'Entrega de notas', 'Planificación', 'Capacitación',
  'Seguimiento', 'Revisión', 'Administrativo', 'Otro',
].map((c) => ({ label: c, value: c }))

const LOCATION_OPTIONS = [
  { label: 'Presencial', value: 'Presencial' },
  { label: 'Virtual (Meet/Zoom)', value: 'Virtual' },
  { label: 'Híbrido', value: 'Híbrido' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskFormModalProps {
  visible: boolean
  task?: Task | null          // Si se proporciona, es modo edición
  initialValues?: Partial<CreateTaskInput> | null // Valores prellenados para nueva tarea (ej: fecha o prioridad)
  onHide: () => void
  onSubmit: (data: CreateTaskInput) => void
  isSubmitting?: boolean
}

type FormValues = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  scope_period: TaskScope
  due_date: Date | null
  due_time: Date | null
  location: string
  category: string
  tags: string[]
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function TaskFormModal({ visible, task, initialValues, onHide, onSubmit, isSubmitting }: TaskFormModalProps) {
  const isEditing = !!task

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      status: 'pendiente',
      priority: 'importante_no_urgente',
      scope_period: 'semanal',
      due_date: null,
      due_time: null,
      location: '',
      category: '',
      tags: [],
    },
  })

  // Poblar el formulario al abrir en modo edición o con valores iniciales
  useEffect(() => {
    if (task) {
      reset({
        title:        task.title,
        description:  task.description ?? '',
        status:       task.status,
        priority:     task.priority,
        scope_period: task.scope_period,
        due_date:     task.due_date ? new Date(task.due_date + 'T00:00:00') : null,
        due_time:     task.due_time ? new Date(`1970-01-01T${task.due_time}`) : null,
        location:     task.location ?? '',
        category:     task.category ?? '',
        tags:         task.tags ?? [],
      })
    } else {
      reset({
        title: '',
        description: '',
        status: initialValues?.status ?? 'pendiente',
        priority: initialValues?.priority ?? 'importante_no_urgente',
        scope_period: initialValues?.scope_period ?? 'semanal',
        due_date: initialValues?.due_date ? new Date(initialValues.due_date + 'T00:00:00') : null,
        due_time: null,
        location: initialValues?.location ?? '',
        category: initialValues?.category ?? '',
        tags: initialValues?.tags ?? [],
      })
    }
  }, [task, initialValues, reset, visible])

  const handleFormSubmit = (values: FormValues) => {
    let formattedDate: string | null = null
    if (values.due_date) {
      const y = values.due_date.getFullYear()
      const m = String(values.due_date.getMonth() + 1).padStart(2, '0')
      const d = String(values.due_date.getDate()).padStart(2, '0')
      formattedDate = `${y}-${m}-${d}`
    }

    const payload: CreateTaskInput = {
      title:        values.title,
      description:  values.description || null,
      status:       values.status,
      priority:     values.priority,
      scope_period: values.scope_period,
      due_date:     formattedDate,

      due_time:     values.due_time
        ? `${String(values.due_time.getHours()).padStart(2,'0')}:${String(values.due_time.getMinutes()).padStart(2,'0')}:00`
        : null,
      location:     values.location || null,
      category:     values.category || null,
      tags:         values.tags,
      is_shared:    false,
      shared_with:  [],
    }
    onSubmit(payload)
  }

  const header = (
    <div className="flex items-center justify-between pr-2">
      <div>
        <h3 className="text-base font-semibold text-base-content">
          {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
        </h3>
        <p className="text-xs text-base-content/50 mt-0.5">
          {isEditing ? 'Modifica los detalles de la actividad' : 'Completa los detalles de la nueva actividad'}
        </p>
      </div>
      <button
        onClick={onHide}
        className="btn btn-ghost btn-sm btn-circle"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )

  const priorityTemplate = (option: (typeof PRIORITY_OPTIONS)[number]) => (
    <div className="flex flex-col gap-0.5 py-0.5">
      <span className="text-sm font-medium">{option.label}</span>
      <span className="text-xs text-base-content/50">{option.description}</span>
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      className="w-full max-w-2xl"
      modal
      draggable={false}
      resizable={false}
      closable={false}
      style={{ borderRadius: '1rem' }}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5 pt-2">

        {/* Título */}
        <div className="form-control gap-1.5">
          <label className="label-text font-medium text-sm">
            Título <span className="text-error">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'El título es requerido', maxLength: { value: 255, message: 'Máximo 255 caracteres' } }}
            render={({ field }) => (
              <InputText
                {...field}
                placeholder="Ej: Entrega de notas bimestre 1"
                className={`p-inputtext-sm w-full ${errors.title ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.title && <span className="text-error text-xs">{errors.title.message}</span>}
        </div>

        {/* Descripción */}
        <div className="form-control gap-1.5">
          <label className="label-text font-medium text-sm">Descripción</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                rows={3}
                placeholder="Detalles adicionales de la actividad..."
                className="p-inputtext-sm w-full resize-none"
              />
            )}
          />
        </div>

        {/* Fila: Estado + Prioridad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Estado</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={STATUS_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">
              Prioridad (Matriz Eisenhower)
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={PRIORITY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  itemTemplate={priorityTemplate}
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Fila: Fecha + Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Fecha límite</label>
            <Controller
              name="due_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  {...field}
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  showButtonBar
                  className="p-inputtext-sm w-full"
                  inputClassName="w-full"
                  showIcon
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Hora</label>
            <Controller
              name="due_time"
              control={control}
              render={({ field }) => (
                <Calendar
                  {...field}
                  timeOnly
                  hourFormat="12"
                  placeholder="HH:MM"
                  className="p-inputtext-sm w-full"
                  inputClassName="w-full"
                  showIcon
                  icon="pi pi-clock"
                />
              )}
            />
          </div>
        </div>

        {/* Fila: Alcance + Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Alcance temporal</label>
            <Controller
              name="scope_period"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={SCOPE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
          <div className="form-control gap-1.5">
            <label className="label-text font-medium text-sm">Categoría</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={CATEGORY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  editable
                  placeholder="Selecciona o escribe..."
                  className="p-inputtext-sm w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="form-control gap-1.5">
          <label className="label-text font-medium text-sm">Modalidad / Lugar</label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                options={LOCATION_OPTIONS}
                optionLabel="label"
                optionValue="value"
                editable
                placeholder="Selecciona o escribe la ubicación..."
                className="p-inputtext-sm w-full"
              />
            )}
          />
        </div>

        {/* Etiquetas */}
        <div className="form-control gap-1.5">
          <label className="label-text font-medium text-sm">Etiquetas</label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Chips
                {...field}
                placeholder="Escribe y presiona Enter..."
                className="w-full"
                max={10}
              />
            )}
          />
          <span className="text-xs text-base-content/40">Presiona Enter para agregar cada etiqueta</span>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2 border-t border-base-200">
          <button type="button" onClick={onHide} className="btn btn-ghost btn-sm">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-sm min-w-24"
          >
            {isSubmitting
              ? <span className="loading loading-spinner loading-xs" />
              : isEditing ? 'Guardar cambios' : 'Crear tarea'
            }
          </button>
        </div>

      </form>
    </Dialog>
  )
}
