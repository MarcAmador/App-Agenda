import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge Component', () => {
  it('renders correct label and badgeClass for "pendiente"', () => {
    render(<StatusBadge status="pendiente" />)
    const badge = screen.getByText('Pendiente')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-neutral')
  })

  it('renders correct label and badgeClass for "en_curso"', () => {
    render(<StatusBadge status="en_curso" />)
    const badge = screen.getByText('En curso')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-info')
  })

  it('renders correct label and badgeClass for "completada"', () => {
    render(<StatusBadge status="completada" />)
    const badge = screen.getByText('Completada')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-success')
  })

  it('renders correct label and badgeClass for "perdida"', () => {
    render(<StatusBadge status="perdida" />)
    const badge = screen.getByText('Perdida')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-error')
  })

  it('renders correct label for "archivada"', () => {
    render(<StatusBadge status="archivada" />)
    const badge = screen.getByText('Archivada')
    expect(badge).toBeInTheDocument()
  })
})
