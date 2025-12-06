import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { RecipeListItemDTO } from '@/types';

export interface RecipeCardProps {
  recipe: RecipeListItemDTO;
}

export const RecipeCard = React.memo(function RecipeCard({
  recipe,
}: RecipeCardProps) {
  const formattedDate = new Date(recipe.created_at).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  return (
    <a
      href={`/recipes/${recipe.id}`}
      data-testid="recipe-card"
      className="focus-visible:ring-ring block rounded-xl transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`View recipe: ${recipe.title}`}
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader>
          <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
          <CardDescription>
            <time dateTime={recipe.created_at}>Created {formattedDate}</time>
          </CardDescription>
        </CardHeader>
      </Card>
    </a>
  );
});
