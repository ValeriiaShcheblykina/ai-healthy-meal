import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeListItem } from '@/components/recipes/RecipeListItem';
import type { RecipeListItemDTO } from '@/types';

describe('RecipeListItem', () => {
  const mockRecipe: RecipeListItemDTO = {
    id: 'recipe-1',
    title: 'Delicious Pasta',
    content: 'A tasty pasta recipe',
    content_json: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    is_public: false,
  };

  describe('Rendering', () => {
    it('should render recipe list item', () => {
      const { container } = render(<RecipeListItem recipe={mockRecipe} />);

      const link = container.querySelector('a[href="/recipes/recipe-1"]');
      expect(link).toBeInTheDocument();
    });

    it('should render recipe title', () => {
      render(<RecipeListItem recipe={mockRecipe} />);

      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
    });

    it('should render formatted creation date', () => {
      render(<RecipeListItem recipe={mockRecipe} />);

      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('should have correct link href', () => {
      const { container } = render(<RecipeListItem recipe={mockRecipe} />);

      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '/recipes/recipe-1');
    });

    it('should have proper aria label', () => {
      const { container } = render(<RecipeListItem recipe={mockRecipe} />);

      const link = container.querySelector('a');
      expect(link).toHaveAttribute(
        'aria-label',
        'View recipe: Delicious Pasta'
      );
    });
  });

  describe('Date formatting', () => {
    it('should format different dates correctly', () => {
      const recipeWithDifferentDate: RecipeListItemDTO = {
        ...mockRecipe,
        created_at: '2023-12-25T00:00:00Z',
      };

      render(<RecipeListItem recipe={recipeWithDifferentDate} />);

      expect(screen.getByText(/Dec 25, 2023/)).toBeInTheDocument();
    });

    it('should use time element with dateTime attribute', () => {
      render(<RecipeListItem recipe={mockRecipe} />);

      const timeElement = screen.getByText(/Created/).closest('time');
      expect(timeElement).toHaveAttribute('dateTime', '2024-01-15T10:30:00Z');
    });
  });

  describe('Layout', () => {
    it('should have list-specific layout classes', () => {
      const { container } = render(<RecipeListItem recipe={mockRecipe} />);

      const card = container.querySelector('[class*="Card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
