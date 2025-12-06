import * as React from 'react';
import { RecipeCard } from './RecipeCard';
import type { RecipeListItemDTO } from '@/types';

export interface RecipesGridProps {
  recipes: RecipeListItemDTO[];
}

export const RecipesGrid = React.memo(function RecipesGrid({
  recipes,
}: RecipesGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="list"
      aria-label="Recipe cards"
    >
      {recipes.map((recipe) => (
        <div key={recipe.id} role="listitem">
          <RecipeCard recipe={recipe} />
        </div>
      ))}
    </div>
  );
});
