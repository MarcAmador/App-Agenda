import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatrixTaskCard } from '../MatrixTaskCard'
import type { Task } from '@/types/database.types'

const mockTask: Task = {
  id: 'task-123',
  user_id: 'user-abc',
  title: 'Entrega de Planificación Anual',
  description: 'Revisión con dirección académica',
  status: 'pendiente',
  priority: 'urgente_importante',
  due_date: '2026-10-15',
  due_time: '14:30:00',
  location: null,
  scope_period: 'anual',
  category: 'Coordinación',
  tags: ['planificacion', 'direccion'],
  is_shared: false,
  shared_with: [],
  deleted_at: null,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-01T10:00:00Z',
}

describe('MatrixTaskCard Component', () => {
  it('renders task title and description', () => {
    render(
      <MatrixTaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onPriorityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Entrega de Planificación Anual')).toBeInTheDocument()
    expect(screen.getByText('Revisión con dirección académica')).toBeInTheDocument()
    expect(screen.getByText(/2026-10-15/)).toBeInTheDocument()
  })

  it('calls onStatusChange with "completada" when checkbox is clicked', () => {
    const onStatusChange = vi.fn()
    render(
      <MatrixTaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={onStatusChange}
        onPriorityChange={vi.fn()}
      />
    )

    const checkboxBtn = screen.getByTitle('Marcar como completada')
    fireEvent.click(checkboxBtn)
    expect(onStatusChange).toHaveBeenCalledWith('task-123', 'completada')
  })

  it('calls onEdit when clicking the task title', () => {
    const onEdit = vi.fn()
    render(
      <MatrixTaskCard
        task={mockTask}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onPriorityChange={vi.fn()}
      />
    )

    const titleEl = screen.getByText('Entrega de Planificación Anual')
    fireEvent.click(titleEl)
    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })

  it('opens contextual menu with WhatsApp and Quadrant options', () => {
    render(
      <MatrixTaskCard
        task={mockTask}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onPriorityChange={vi.fn()}
      />
    )

    const menuBtn = screen.getByTitle('Opciones de la tarea')
    fireEvent.click(menuBtn)

    expect(screen.getByText('Enviar por WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Editar tarea')).toBeInTheDocument()
    expect(screen.getByText('Eliminar tarea')).toBeInTheDocument()
  })
})
