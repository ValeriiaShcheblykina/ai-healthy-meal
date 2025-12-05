import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { RecipeVariantDTO } from '@/types';

interface MetadataDisplayProps {
  variant: RecipeVariantDTO;
}

export function MetadataDisplay({ variant }: MetadataDisplayProps) {
  const formattedDate = new Date(variant.created_at).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const preferences = variant.preferences_snapshot as
    | {
        diets?: string[];
        allergens?: string[];
        dislikedIngredients?: string[];
        calorieTarget?: number;
      }
    | null
    | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generation Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-muted-foreground text-sm font-semibold">
            Created
          </h3>
          <p className="text-sm">{formattedDate}</p>
        </div>

        {variant.model && (
          <div>
            <h3 className="text-muted-foreground text-sm font-semibold">
              AI Model
            </h3>
            <p className="text-sm">{variant.model}</p>
          </div>
        )}

        {variant.prompt && (
          <div>
            <h3 className="text-muted-foreground text-sm font-semibold">
              Prompt
            </h3>
            <p className="text-sm whitespace-pre-wrap">{variant.prompt}</p>
          </div>
        )}

        {preferences && (
          <div>
            <h3 className="text-muted-foreground text-sm font-semibold">
              Preferences Used
            </h3>
            <div className="space-y-2 text-sm">
              {preferences.diets && preferences.diets.length > 0 && (
                <div>
                  <span className="font-medium">Diets: </span>
                  <span>{preferences.diets.join(', ')}</span>
                </div>
              )}
              {preferences.allergens && preferences.allergens.length > 0 && (
                <div>
                  <span className="font-medium">Allergens to avoid: </span>
                  <span>{preferences.allergens.join(', ')}</span>
                </div>
              )}
              {preferences.dislikedIngredients &&
                preferences.dislikedIngredients.length > 0 && (
                  <div>
                    <span className="font-medium">Disliked ingredients: </span>
                    <span>{preferences.dislikedIngredients.join(', ')}</span>
                  </div>
                )}
              {preferences.calorieTarget && (
                <div>
                  <span className="font-medium">Calorie target: </span>
                  <span>{preferences.calorieTarget} calories</span>
                </div>
              )}
              {!preferences.diets?.length &&
                !preferences.allergens?.length &&
                !preferences.dislikedIngredients?.length &&
                !preferences.calorieTarget && (
                  <p className="text-muted-foreground">
                    No preferences were used for this variant
                  </p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
