import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from '@/components/recipes/SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('Grid view', () => {
    it('should render skeleton cards in grid layout', () => {
      const { container } = render(<SkeletonLoader viewMode="grid" />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass(
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      );
    });

    it('should render 8 skeleton cards', () => {
      const { container } = render(<SkeletonLoader viewMode="grid" />);

      // Card components render as divs with rounded-xl class
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      // Count direct children of grid (should be 8 cards)
      const cards = grid?.children || [];
      expect(cards.length).toBe(8);
    });

    it('should render skeleton elements in each card', () => {
      const { container } = render(<SkeletonLoader viewMode="grid" />);

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      // 8 cards * 2 skeletons per card = 16 skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('List view', () => {
    it('should render skeleton cards in list layout', () => {
      const { container } = render(<SkeletonLoader viewMode="list" />);

      const list = container.querySelector('.flex.flex-col');
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('gap-3');
    });

    it('should render 8 skeleton cards', () => {
      const { container } = render(<SkeletonLoader viewMode="list" />);

      // Card components render as divs with rounded-xl class
      const list = container.querySelector('.flex.flex-col');
      expect(list).toBeInTheDocument();
      // Count direct children of list (should be 8 cards)
      const cards = list?.children || [];
      expect(cards.length).toBe(8);
    });

    it('should render skeleton elements in each card', () => {
      const { container } = render(<SkeletonLoader viewMode="list" />);

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      // 8 cards * 2 skeletons per card = 16 skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('View mode switching', () => {
    it('should render grid layout when viewMode is grid', () => {
      const { container } = render(<SkeletonLoader viewMode="grid" />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();

      // Check that it's not the list layout
      const listContainer = container.querySelector('.flex.flex-col.gap-3');
      expect(listContainer).not.toBeInTheDocument();
    });

    it('should render list layout when viewMode is list', () => {
      const { container } = render(<SkeletonLoader viewMode="list" />);

      const listContainer = container.querySelector('.flex.flex-col.gap-3');
      expect(listContainer).toBeInTheDocument();

      // Check that it's not the grid layout
      const grid = container.querySelector('.grid.grid-cols-1');
      expect(grid).not.toBeInTheDocument();
    });

    it('should switch from grid to list layout', () => {
      const { container, rerender } = render(
        <SkeletonLoader viewMode="grid" />
      );

      expect(container.querySelector('.grid')).toBeInTheDocument();

      rerender(<SkeletonLoader viewMode="list" />);

      const listContainer = container.querySelector('.flex.flex-col.gap-3');
      expect(listContainer).toBeInTheDocument();
    });

    it('should switch from list to grid layout', () => {
      const { container, rerender } = render(
        <SkeletonLoader viewMode="list" />
      );

      expect(
        container.querySelector('.flex.flex-col.gap-3')
      ).toBeInTheDocument();

      rerender(<SkeletonLoader viewMode="grid" />);

      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });
});
