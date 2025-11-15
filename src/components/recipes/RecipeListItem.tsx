import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { RecipeListItemDTO } from '@/types'

export interface RecipeListItemProps {
  recipe: RecipeListItemDTO
}

export function RecipeListItem({ recipe }: RecipeListItemProps) {
  const formattedDate = new Date(recipe.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <a 
      href={`/recipes/${recipe.id}`} 
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      aria-label={`View recipe: ${recipe.title}`}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{recipe.title}</CardTitle>
            <CardDescription className="mt-1">
              <time dateTime={recipe.created_at}>Created {formattedDate}</time>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </a>
  )
}

