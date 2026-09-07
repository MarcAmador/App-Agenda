import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from '../PriorityBadge'

describe('PriorityBadge Component', () => {
  it('renders full label for Q1 (urgente_importante)', () => {
    render(<PriorityBadge priority="urgente_importante" />)
    const badge = screen.getByText('Urgente e Importante')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-error')
  })

  it('renders compact mode Q1 for urgente_importante', () => {
    render(<PriorityBadge priority="urgente_importante" compact />)
    const badge = screen.getByText('Q1')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-error')
  })

  it('renders full label and color for Q2 (importante_no_urgente)', () => {
    render(<PriorityBadge priority="importante_no_urgente" />)
    const badge = screen.getByText('Importante, No Urgente')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-success')
  })

  it('renders compact mode Q2 for importante_no_urgente', () => {
    render(<PriorityBadge priority="importante_no_urgente" compact />)
    const badge = screen.getByText('Q2')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-success')
  })

  it('renders compact mode Q3 for urgente_no_importante', () => {
    render(<PriorityBadge priority="urgente_no_importante" compact />)
    const badge = screen.getByText('Q3')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-warning')
  })

  it('renders compact mode Q4 for no_urgente_baja', () => {
    render(<PriorityBadge priority="no_urgente_baja" compact />)
    const badge = screen.getByText('Q4')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('badge-ghost')
  })
})
