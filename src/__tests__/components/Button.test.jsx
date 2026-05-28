import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../../components/common/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })

  it('shows loading spinner and text when loading=true', () => {
    render(<Button loading>Guardar</Button>)
    expect(screen.getByText('Procesando...')).toBeInTheDocument()
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument()
  })

  it('is disabled when loading=true', () => {
    render(<Button loading>Guardar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Acción</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Acción</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies primary variant classes by default', () => {
    render(<Button>Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/bg-blue-600/)
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Eliminar</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/bg-red-600/)
  })

  it('merges custom className', () => {
    render(<Button className="w-full">Test</Button>)
    expect(screen.getByRole('button').className).toMatch(/w-full/)
  })
})
