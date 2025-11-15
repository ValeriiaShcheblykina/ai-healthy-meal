import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { RecipeListItemDTO } from '@/types'

export interface RecipeCardProps {
  recipe: RecipeListItemDTO
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const formattedDate = new Date(recipe.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <a 
      href={`/recipes/${recipe.id}`} 
      className="block transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      aria-label={`View recipe: ${recipe.title}`}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
          <CardDescription>
            <time dateTime={recipe.created_at}>Created {formattedDate}</time>
          </CardDescription>
        </CardHeader>
      </Card>
    </a>
  )
}

