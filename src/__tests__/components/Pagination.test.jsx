import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '../../components/common/Pagination'

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} itemsPerPage={20} totalItems={15} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows page count info', () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} itemsPerPage={20} totalItems={55} />
    )
    expect(screen.getByText(/1 - 20 de 55/)).toBeInTheDocument()
  })

  it('disables prev button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} itemsPerPage={20} totalItems={55} />
    )
    expect(screen.getByLabelText(/página anterior/i)).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={3} totalPages={3} onPageChange={vi.fn()} itemsPerPage={20} totalItems={55} />
    )
    expect(screen.getByLabelText(/página siguiente/i)).toBeDisabled()
  })

  it('calls onPageChange with next page when next is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} itemsPerPage={20} totalItems={55} />
    )
    await user.click(screen.getByLabelText(/página siguiente/i))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when a page number is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} itemsPerPage={20} totalItems={55} />
    )
    await user.click(screen.getByLabelText(/ir a página 3/i))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('marks current page with aria-current', () => {
    render(
      <Pagination currentPage={2} totalPages={3} onPageChange={vi.fn()} itemsPerPage={20} totalItems={55} />
    )
    expect(screen.getByLabelText(/ir a página 2/i)).toHaveAttribute('aria-current', 'page')
  })

  it('shows ellipsis for large page counts', () => {
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} itemsPerPage={20} totalItems={200} />
    )
    const ellipses = screen.getAllByText('...')
    expect(ellipses.length).toBeGreaterThanOrEqual(1)
  })
})
