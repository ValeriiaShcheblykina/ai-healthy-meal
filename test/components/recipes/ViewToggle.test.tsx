import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '@/components/recipes/ViewToggle';

describe('ViewToggle', () => {
  const mockOnViewModeChange = vi.fn();

  beforeEach(() => {
    mockOnViewModeChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render grid and list buttons', () => {
      render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      const listButton = screen.getByTestId('recipes-view-list-button');

      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
    });

    it('should have proper aria labels', () => {
      render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      const listButton = screen.getByTestId('recipes-view-list-button');

      expect(gridButton).toHaveAttribute('aria-label', 'Grid view');
      expect(listButton).toHaveAttribute('aria-label', 'List view');
    });
  });

  describe('Grid view', () => {
    it('should highlight grid button when in grid mode', () => {
      render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not highlight list button when in grid mode', () => {
      render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const listButton = screen.getByTestId('recipes-view-list-button');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should call onViewModeChange when clicking list button', async () => {
      const user = userEvent.setup();
      render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const listButton = screen.getByTestId('recipes-view-list-button');
      await user.click(listButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('list');
      expect(mockOnViewModeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('List view', () => {
    it('should highlight list button when in list mode', () => {
      render(
        <ViewToggle viewMode="list" onViewModeChange={mockOnViewModeChange} />
      );

      const listButton = screen.getByTestId('recipes-view-list-button');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not highlight grid button when in list mode', () => {
      render(
        <ViewToggle viewMode="list" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      expect(gridButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should call onViewModeChange when clicking grid button', async () => {
      const user = userEvent.setup();
      render(
        <ViewToggle viewMode="list" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      await user.click(gridButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
      expect(mockOnViewModeChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toggle behavior', () => {
    it('should toggle between grid and list views', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />
      );

      const listButton = screen.getByTestId('recipes-view-list-button');
      await user.click(listButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('list');

      // Simulate view mode change
      rerender(
        <ViewToggle viewMode="list" onViewModeChange={mockOnViewModeChange} />
      );

      const gridButton = screen.getByTestId('recipes-view-grid-button');
      await user.click(gridButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
    });
  });
});
