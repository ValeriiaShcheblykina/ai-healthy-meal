import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/recipes/EmptyState';

describe('EmptyState', () => {
  describe('Without search query', () => {
    it('should render empty state message', () => {
      render(<EmptyState />);

      expect(screen.getByTestId('recipes-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No recipes yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Start building your healthy meal collection by creating your first recipe.'
        )
      ).toBeInTheDocument();
    });

    it('should render create recipe button', () => {
      render(<EmptyState />);

      const createButton = screen.getByTestId(
        'recipes-create-first-recipe-button'
      );
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('href', '/recipes/new');
      expect(createButton).toHaveTextContent('Create New Recipe');
    });
  });

  describe('With search query', () => {
    it('should render no results message', () => {
      render(<EmptyState hasSearchQuery={true} />);

      expect(screen.getByTestId('recipes-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No recipes found')).toBeInTheDocument();
      expect(
        screen.getByText(
          "We couldn't find any recipes matching your search. Try adjusting your filters or search terms."
        )
      ).toBeInTheDocument();
    });

    it('should not render create recipe button when searching', () => {
      render(<EmptyState hasSearchQuery={true} />);

      expect(
        screen.queryByTestId('recipes-create-first-recipe-button')
      ).not.toBeInTheDocument();
    });
  });
});
