import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AIGenerationDrawer } from './AIGenerationDrawer';

export interface GenerateRecipeVariantButtonProps {
  recipeId: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onVariantGenerated?: () => void;
}

export function GenerateRecipeVariantButton({
  recipeId,
  disabled = false,
  variant = 'secondary',
  size = 'default',
  className = '',
  onVariantGenerated,
}: GenerateRecipeVariantButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDrawerOpen(true)}
        disabled={disabled}
        variant={variant}
        size={size}
        className={`ai-generation-button-secondary gap-2 ${className}`}
        data-testid="generate-recipe-variant-button"
        aria-label="Generate a new recipe based on this recipe and your preferences"
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">
          AI Generate New Recipe from this Recipe
        </span>
        <span className="sm:hidden">New Recipe</span>
      </Button>
      <AIGenerationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipeId={recipeId}
        onSuccess={onVariantGenerated}
      />
    </>
  );
}
