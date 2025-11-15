import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event'
import { PaginationControls } from '@/components/recipes/PaginationControls'
import type { PaginationDTO } from '@/types'

describe('PaginationControls', () => {
  const mockOnPageChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
  })

  describe('Visibility', () => {
    it('should not render when total_pages is 1', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 10,
        total_pages: 1,
      }

      const { container } = render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should not render when total_pages is 0', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
      }

      const { container } = render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render when total_pages is greater than 1', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 50,
        total_pages: 3,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })

  describe('Navigation Buttons', () => {
    it('should disable Previous button on first page', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      expect(prevButton).toBeDisabled()
    })

    it('should enable Previous button when not on first page', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      expect(prevButton).not.toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      const pagination: PaginationDTO = {
        page: 5,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next page/i })
      expect(nextButton).toBeDisabled()
    })

    it('should enable Next button when not on last page', () => {
      const pagination: PaginationDTO = {
        page: 4,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next page/i })
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Page Change Handlers', () => {
    it('should call onPageChange with previous page number', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      await user.click(prevButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
      expect(mockOnPageChange).toHaveBeenCalledTimes(1)
    })

    it('should call onPageChange with next page number', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(4)
      expect(mockOnPageChange).toHaveBeenCalledTimes(1)
    })

    it('should call onPageChange with specific page number', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page3Button = screen.getByRole('button', { name: 'Page 3' })
      await user.click(page3Button)

      expect(mockOnPageChange).toHaveBeenCalledWith(3)
    })
  })

  describe('getVisiblePages Algorithm', () => {
    it('should show pages 1-5 when on page 1 with 10 total pages', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument()
    })

    it('should show pages 6-10 when on page 10 with 10 total pages', () => {
      const pagination: PaginationDTO = {
        page: 10,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.queryByRole('button', { name: 'Page 5' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 8' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 9' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument()
    })

    it('should show pages 3-7 when on page 5 with 10 total pages', () => {
      const pagination: PaginationDTO = {
        page: 5,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Page 8' })).not.toBeInTheDocument()
    })

    it('should show all pages when total_pages is 5 or less', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 80,
        total_pages: 4,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument()
    })

    it('should show exactly 5 pages when total_pages equals 5', () => {
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const pageButtons = screen.getAllByRole('button').filter(button =>
        button.getAttribute('aria-label')?.startsWith('Page')
      )

      expect(pageButtons).toHaveLength(5)
    })

    it('should show 2 pages correctly', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 30,
        total_pages: 2,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
    })
  })

  describe('Ellipsis Display', () => {
    it('should show ellipsis after page 1 when start > 2', () => {
      const pagination: PaginationDTO = {
        page: 8,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: /^1$/ })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('should show ellipsis before last page when end < total_pages - 1', () => {
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: /^10$/ })).toBeInTheDocument()
      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('should show both ellipses when in middle of many pages', () => {
      const pagination: PaginationDTO = {
        page: 15,
        limit: 20,
        total: 600,
        total_pages: 30,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const ellipses = screen.getAllByText('...')
      expect(ellipses).toHaveLength(2)
    })

    it('should show ellipsis after visible pages when on page 2', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      // Should show ellipsis between page 5 and page 10
      expect(screen.getByText('...')).toBeInTheDocument()
      
      // Should not show first page link separately (it's in visible pages)
      const pageButtons = screen.getAllByRole('button', { name: /^Page 1$|^1$/ })
      expect(pageButtons).toHaveLength(1)
    })

    it('should show ellipsis before visible pages when on page 9', () => {
      const pagination: PaginationDTO = {
        page: 9,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      // Should show ellipsis between page 1 and page 6
      expect(screen.getByText('...')).toBeInTheDocument()
      
      // Should not show last page link separately (it's in visible pages)
      const pageButtons = screen.getAllByRole('button', { name: /^Page 10$|^10$/ })
      expect(pageButtons).toHaveLength(1)
    })
  })

  describe('First and Last Page Links', () => {
    it('should always show page 1 link when not in visible range', () => {
      const pagination: PaginationDTO = {
        page: 10,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page1Button = screen.getByRole('button', { name: /^1$/ })
      expect(page1Button).toBeInTheDocument()
    })

    it('should always show last page link when not in visible range', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page10Button = screen.getByRole('button', { name: /^10$/ })
      expect(page10Button).toBeInTheDocument()
    })

    it('should allow clicking first page link', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 10,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page1Button = screen.getByRole('button', { name: /^1$/ })
      await user.click(page1Button)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should allow clicking last page link', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 200,
        total_pages: 10,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page10Button = screen.getByRole('button', { name: /^10$/ })
      await user.click(page10Button)

      expect(mockOnPageChange).toHaveBeenCalledWith(10)
    })
  })

  describe('Current Page Highlighting', () => {
    it('should mark current page with default variant', () => {
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const currentPageButton = screen.getByRole('button', { name: 'Page 3' })
      expect(currentPageButton).toHaveAttribute('aria-current', 'page')
    })

    it('should not mark other pages with aria-current', () => {
      const pagination: PaginationDTO = {
        page: 3,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const page2Button = screen.getByRole('button', { name: 'Page 2' })
      expect(page2Button).not.toHaveAttribute('aria-current')
    })
  })

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Pagination'
      )
    })

    it('should have proper aria-labels on navigation buttons', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    })

    it('should have proper aria-labels on page buttons', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large page numbers', () => {
      const pagination: PaginationDTO = {
        page: 999,
        limit: 20,
        total: 20000,
        total_pages: 1000,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      // Page 1000 should be in the visible range with aria-label
      expect(screen.getByRole('button', { name: 'Page 1000' })).toBeInTheDocument()
      
      // Should show page 1 as a separate link
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      
      // Should show both ellipsis (one after page 1, none at the end since 1000 is visible)
      const ellipses = screen.getAllByText('...')
      expect(ellipses).toHaveLength(1)
    })

    it('should handle page 2 of 2 correctly', () => {
      const pagination: PaginationDTO = {
        page: 2,
        limit: 20,
        total: 30,
        total_pages: 2,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      const nextButton = screen.getByRole('button', { name: /next page/i })

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).toBeDisabled()
    })

    it('should handle single visible page in middle of large range', () => {
      const pagination: PaginationDTO = {
        page: 50,
        limit: 20,
        total: 2000,
        total_pages: 100,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      // Should show pages 48-52
      expect(screen.getByRole('button', { name: 'Page 48' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 49' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 50' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 51' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Page 52' })).toBeInTheDocument()
    })

    it('should handle clicking disabled buttons gracefully', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      
      // Attempt to click disabled button
      await user.click(prevButton)

      // Should not trigger callback
      expect(mockOnPageChange).not.toHaveBeenCalled()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle typical pagination flow from page 1 to page 3', async () => {
      const user = userEvent.setup()
      const pagination: PaginationDTO = {
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      }

      const { rerender } = render(
        <PaginationControls
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      // Click next
      const nextButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextButton)
      expect(mockOnPageChange).toHaveBeenCalledWith(2)

      // Simulate page change
      rerender(
        <PaginationControls
          pagination={{ ...pagination, page: 2 }}
          onPageChange={mockOnPageChange}
        />
      )

      // Click page 3 directly
      const page3Button = screen.getByRole('button', { name: 'Page 3' })
      await user.click(page3Button)
      expect(mockOnPageChange).toHaveBeenCalledWith(3)
    })
  })
})

