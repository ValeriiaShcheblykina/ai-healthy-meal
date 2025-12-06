import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataDisplay } from '@/components/recipes/MetadataDisplay';
import type { RecipeVariantDTO } from '@/types';

describe('MetadataDisplay', () => {
  const baseVariant: RecipeVariantDTO = {
    id: 'variant-1',
    recipe_id: 'recipe-1',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    created_by: null,
    model: null,
    output_json: null,
    output_text: 'Recipe content',
    parent_variant_id: null,
    preferences_snapshot: null,
    prompt: null,
  };

  describe('Rendering', () => {
    it('should render metadata card', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      expect(screen.getByText('Generation Metadata')).toBeInTheDocument();
    });

    it('should always render created date', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Model display', () => {
    it('should render model when present', () => {
      const variantWithModel: RecipeVariantDTO = {
        ...baseVariant,
        model: 'openai/gpt-4o',
      };

      render(<MetadataDisplay variant={variantWithModel} />);

      expect(screen.getByText('AI Model')).toBeInTheDocument();
      expect(screen.getByText('openai/gpt-4o')).toBeInTheDocument();
    });

    it('should not render model section when model is null', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      expect(screen.queryByText('AI Model')).not.toBeInTheDocument();
    });
  });

  describe('Prompt display', () => {
    it('should render prompt when present', () => {
      const variantWithPrompt: RecipeVariantDTO = {
        ...baseVariant,
        prompt: 'Create a healthy pasta recipe',
      };

      render(<MetadataDisplay variant={variantWithPrompt} />);

      expect(screen.getByText('Prompt')).toBeInTheDocument();
      expect(
        screen.getByText('Create a healthy pasta recipe')
      ).toBeInTheDocument();
    });

    it('should not render prompt section when prompt is null', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      expect(screen.queryByText('Prompt')).not.toBeInTheDocument();
    });

    it('should preserve whitespace in prompt', () => {
      const variantWithMultilinePrompt: RecipeVariantDTO = {
        ...baseVariant,
        prompt: 'Line 1\nLine 2\nLine 3',
      };

      render(<MetadataDisplay variant={variantWithMultilinePrompt} />);

      const promptElement = screen.getByText(/Line 1/);
      expect(promptElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Preferences display', () => {
    it('should render diets when present', () => {
      const variantWithPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {
          diets: ['vegan', 'gluten-free'],
        },
      };

      render(<MetadataDisplay variant={variantWithPreferences} />);

      expect(screen.getByText('Preferences Used')).toBeInTheDocument();
      expect(screen.getByText(/Diets:/)).toBeInTheDocument();
      expect(screen.getByText(/vegan, gluten-free/)).toBeInTheDocument();
    });

    it('should render allergens when present', () => {
      const variantWithPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {
          allergens: ['peanuts', 'dairy'],
        },
      };

      render(<MetadataDisplay variant={variantWithPreferences} />);

      expect(screen.getByText(/Allergens to avoid:/)).toBeInTheDocument();
      expect(screen.getByText(/peanuts, dairy/)).toBeInTheDocument();
    });

    it('should render disliked ingredients when present', () => {
      const variantWithPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {
          dislikedIngredients: ['onions', 'garlic'],
        },
      };

      render(<MetadataDisplay variant={variantWithPreferences} />);

      expect(screen.getByText(/Disliked ingredients:/)).toBeInTheDocument();
      expect(screen.getByText(/onions, garlic/)).toBeInTheDocument();
    });

    it('should render calorie target when present', () => {
      const variantWithPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {
          calorieTarget: 500,
        },
      };

      render(<MetadataDisplay variant={variantWithPreferences} />);

      expect(screen.getByText(/Calorie target:/)).toBeInTheDocument();
      expect(screen.getByText(/500 calories/)).toBeInTheDocument();
    });

    it('should render all preferences together', () => {
      const variantWithAllPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {
          diets: ['vegan'],
          allergens: ['peanuts'],
          dislikedIngredients: ['onions'],
          calorieTarget: 500,
        },
      };

      render(<MetadataDisplay variant={variantWithAllPreferences} />);

      expect(screen.getByText(/vegan/)).toBeInTheDocument();
      expect(screen.getByText(/peanuts/)).toBeInTheDocument();
      expect(screen.getByText(/onions/)).toBeInTheDocument();
      expect(screen.getByText(/500 calories/)).toBeInTheDocument();
    });

    it('should show message when no preferences used', () => {
      const variantWithEmptyPreferences: RecipeVariantDTO = {
        ...baseVariant,
        preferences_snapshot: {},
      };

      render(<MetadataDisplay variant={variantWithEmptyPreferences} />);

      expect(
        screen.getByText('No preferences were used for this variant')
      ).toBeInTheDocument();
    });

    it('should not render preferences section when preferences_snapshot is null', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      expect(screen.queryByText('Preferences Used')).not.toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('should format date with time', () => {
      render(<MetadataDisplay variant={baseVariant} />);

      const dateText = screen.getByText(/January 15, 2024/);
      expect(dateText).toBeInTheDocument();
      // Should include time in the formatted date
      expect(dateText.textContent).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
