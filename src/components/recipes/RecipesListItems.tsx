import * as React from 'react';
import { RecipeListItem } from './RecipeListItem';
import type { RecipeListItemDTO } from '@/types';

export interface RecipesListItemsProps {
  recipes: RecipeListItemDTO[];
}

export const RecipesListItems = React.memo(function RecipesListItems({
  recipes,
}: RecipesListItemsProps) {
  return (
    <div className="flex flex-col gap-3" role="list" aria-label="Recipe list">
      {recipes.map((recipe) => (
        <div key={recipe.id} role="listitem">
          <RecipeListItem recipe={recipe} />
        </div>
      ))}
    </div>
  );
});
