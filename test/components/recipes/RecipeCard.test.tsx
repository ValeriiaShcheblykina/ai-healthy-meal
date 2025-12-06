import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import type { RecipeListItemDTO } from '@/types';

describe('RecipeCard', () => {
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
    it('should render recipe card', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const card = screen.getByTestId('recipe-card');
      expect(card).toBeInTheDocument();
    });

    it('should render recipe title', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
    });

    it('should render formatted creation date', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('should have correct link href', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const link = screen.getByTestId('recipe-card');
      expect(link).toHaveAttribute('href', '/recipes/recipe-1');
    });

    it('should have proper aria label', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const link = screen.getByTestId('recipe-card');
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

      render(<RecipeCard recipe={recipeWithDifferentDate} />);

      expect(screen.getByText(/Dec 25, 2023/)).toBeInTheDocument();
    });

    it('should use time element with dateTime attribute', () => {
      render(<RecipeCard recipe={mockRecipe} />);

      const timeElement = screen.getByText(/Created/).closest('time');
      expect(timeElement).toHaveAttribute('dateTime', '2024-01-15T10:30:00Z');
    });
  });

  describe('Edge cases', () => {
    it('should handle long titles', () => {
      const recipeWithLongTitle: RecipeListItemDTO = {
        ...mockRecipe,
        title:
          'This is a very long recipe title that should be truncated properly',
      };

      render(<RecipeCard recipe={recipeWithLongTitle} />);

      expect(
        screen.getByText(
          'This is a very long recipe title that should be truncated properly'
        )
      ).toBeInTheDocument();
    });

    it('should handle different recipe IDs', () => {
      const recipeWithDifferentId: RecipeListItemDTO = {
        ...mockRecipe,
        id: 'recipe-999',
      };

      render(<RecipeCard recipe={recipeWithDifferentId} />);

      const link = screen.getByTestId('recipe-card');
      expect(link).toHaveAttribute('href', '/recipes/recipe-999');
    });
  });
});
