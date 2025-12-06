import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDropdown } from '@/components/recipes/SortDropdown';

describe('SortDropdown', () => {
  const mockOnSortChange = vi.fn();

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render sort dropdown', () => {
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const select = screen.getByTestId('recipes-sort-select');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('aria-label', 'Sort recipes by');
    });

    it('should render all sort options', () => {
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      expect(
        screen.getByRole('option', { name: 'Date Created' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Date Modified' })
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Title' })).toBeInTheDocument();
    });

    it('should render order toggle button', () => {
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', 'Sort descending');
    });
  });

  describe('Sort selection', () => {
    it('should display current sort value', () => {
      render(
        <SortDropdown
          sort="title"
          order="asc"
          onSortChange={mockOnSortChange}
        />
      );

      const select = screen.getByTestId('recipes-sort-select');
      expect(select).toHaveValue('title');
    });

    it('should call onSortChange when sort option changes', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const select = screen.getByTestId('recipes-sort-select');
      await user.selectOptions(select, 'title');

      expect(mockOnSortChange).toHaveBeenCalledWith('title', 'desc');
      expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    });

    it('should preserve order when changing sort', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="created_at"
          order="asc"
          onSortChange={mockOnSortChange}
        />
      );

      const select = screen.getByTestId('recipes-sort-select');
      await user.selectOptions(select, 'updated_at');

      expect(mockOnSortChange).toHaveBeenCalledWith('updated_at', 'asc');
    });
  });

  describe('Order toggle', () => {
    it('should show ascending icon when order is asc', () => {
      render(
        <SortDropdown
          sort="created_at"
          order="asc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      expect(toggleButton).toHaveAttribute('aria-label', 'Sort ascending');
    });

    it('should show descending icon when order is desc', () => {
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      expect(toggleButton).toHaveAttribute('aria-label', 'Sort descending');
    });

    it('should toggle order from desc to asc', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="created_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      await user.click(toggleButton);

      expect(mockOnSortChange).toHaveBeenCalledWith('created_at', 'asc');
      expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    });

    it('should toggle order from asc to desc', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="title"
          order="asc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      await user.click(toggleButton);

      expect(mockOnSortChange).toHaveBeenCalledWith('title', 'desc');
    });

    it('should preserve sort when toggling order', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="updated_at"
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      await user.click(toggleButton);

      expect(mockOnSortChange).toHaveBeenCalledWith('updated_at', 'asc');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined sort with default', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort={undefined}
          order="desc"
          onSortChange={mockOnSortChange}
        />
      );

      const toggleButton = screen.getByTestId('recipes-sort-order-toggle');
      await user.click(toggleButton);

      expect(mockOnSortChange).toHaveBeenCalledWith('created_at', 'asc');
    });

    it('should handle undefined order with default', async () => {
      const user = userEvent.setup();
      render(
        <SortDropdown
          sort="title"
          order={undefined}
          onSortChange={mockOnSortChange}
        />
      );

      const select = screen.getByTestId('recipes-sort-select');
      await user.selectOptions(select, 'created_at');

      expect(mockOnSortChange).toHaveBeenCalledWith('created_at', 'desc');
    });
  });
});
