import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { RecipesClientService } from '@/lib/services/client/recipes.client.service';
import { ProfileClientService } from '@/lib/services/client/profile.client.service';
import { useToast } from '@/components/ui/toast';
import type { CurrentUserResponse } from '@/lib/services/client/profile.client.service';
import type { RecipeListItemDTO } from '@/types';

export interface AIGenerationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  onSuccess?: () => void;
}

const recipesService = new RecipesClientService();
const profileService = new ProfileClientService();

export function AIGenerationDrawer({
  open,
  onOpenChange,
  recipeId,
  onSuccess,
}: AIGenerationDrawerProps) {
  const [useProfilePreferences, setUseProfilePreferences] =
    React.useState(true);
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [profile, setProfile] = React.useState<
    CurrentUserResponse['user']['profile'] | null
  >(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(false);
  const [currentRecipe, setCurrentRecipe] =
    React.useState<RecipeListItemDTO | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = React.useState(false);
  const { addToast } = useToast();

  // Fetch current recipe and user profile when drawer opens
  React.useEffect(() => {
    if (open) {
      // Fetch the current recipe
      setIsLoadingRecipe(true);
      recipesService
        .getRecipe(recipeId)
        .then((recipe) => {
          setCurrentRecipe(recipe);
        })
        .catch((err) => {
          console.error('Failed to load recipe:', err);
          addToast({
            title: 'Error',
            description: 'Failed to load recipe. Please try again.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoadingRecipe(false);
        });

      // Fetch user profile if preferences are enabled
      if (useProfilePreferences) {
        setIsLoadingProfile(true);
        profileService
          .getCurrentUser()
          .then((data) => {
            setProfile(data.user.profile);
          })
          .catch((err) => {
            console.error('Failed to load profile:', err);
            setProfile(null);
          })
          .finally(() => {
            setIsLoadingProfile(false);
          });
      }
    } else if (!open) {
      // Reset state when drawer closes
      setCustomPrompt('');
      setUseProfilePreferences(true);
      setProfile(null);
      setCurrentRecipe(null);
    }
  }, [open, useProfilePreferences, recipeId, addToast]);

  const handleGenerate = async () => {
    if (!currentRecipe) {
      addToast({
        title: 'Error',
        description: 'Recipe not loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!useProfilePreferences && !customPrompt.trim()) {
      addToast({
        title: 'Validation Error',
        description:
          'Please provide custom instructions or enable profile preferences.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Build the prompt that includes the current recipe as context
      let prompt = `Create a new recipe based on this existing recipe:\n\n`;
      prompt += `Title: ${currentRecipe.title}\n\n`;
      prompt += `Content:\n${currentRecipe.content || JSON.stringify(currentRecipe.content_json || {})}\n\n`;

      if (customPrompt.trim()) {
        prompt += `Additional instructions: ${customPrompt.trim()}\n\n`;
      }

      prompt += `Generate a new, complete recipe that is inspired by the above recipe but is a unique variation. Make it a standalone recipe with its own title and content.`;

      // Prepare options for aiGenerateRecipe
      const options: {
        customPrompt?: string;
        diets?: string[];
        allergens?: string[];
        dislikedIngredients?: string[];
        calorieTarget?: number | null;
      } = {
        customPrompt: prompt,
      };

      // Add profile preferences if enabled
      if (useProfilePreferences && profile) {
        if (profile.diets.length > 0) {
          options.diets = profile.diets;
        }
        if (profile.allergens.length > 0) {
          options.allergens = profile.allergens;
        }
        if (profile.dislikedIngredients.length > 0) {
          options.dislikedIngredients = profile.dislikedIngredients;
        }
        if (profile.calorieTarget !== null) {
          options.calorieTarget = profile.calorieTarget;
        }
      }

      // Generate the new recipe
      const generatedRecipe = await recipesService.aiGenerateRecipe(options);

      // Build URL parameters for redirect to recipe creation page
      const params = new URLSearchParams();
      params.set('generated', 'true');
      params.set('title', (generatedRecipe.title as string) || '');

      if (generatedRecipe.description) {
        params.set('description', generatedRecipe.description as string);
      }
      if (generatedRecipe.ingredients) {
        params.set('ingredients', JSON.stringify(generatedRecipe.ingredients));
      }
      if (generatedRecipe.instructions) {
        params.set(
          'instructions',
          JSON.stringify(generatedRecipe.instructions)
        );
      }
      if (generatedRecipe.prep_time) {
        params.set('prep_time', generatedRecipe.prep_time.toString());
      }
      if (generatedRecipe.cook_time) {
        params.set('cook_time', generatedRecipe.cook_time.toString());
      }
      if (generatedRecipe.servings) {
        params.set('servings', generatedRecipe.servings.toString());
      }

      addToast({
        title: 'Success',
        description: 'New recipe generated successfully!',
        variant: 'default',
      });

      // Close drawer and redirect to recipe creation page
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to recipe creation page with generated data
      window.location.href = `/recipes/new?${params.toString()}`;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasPreferences =
    profile &&
    (profile.diets.length > 0 ||
      profile.allergens.length > 0 ||
      profile.dislikedIngredients.length > 0 ||
      profile.calorieTarget !== null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="overflow-y-auto">
        <SheetClose onClose={() => onOpenChange(false)} />
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate New Recipe from This Recipe
          </SheetTitle>
          <SheetDescription>
            Create a new recipe inspired by this one using AI. Your profile
            preferences will be applied automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-6">
          {/* Loading Recipe State */}
          {isLoadingRecipe && (
            <Card className="p-4">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading recipe...
              </div>
            </Card>
          )}

          {/* Use Profile Preferences Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-profile-preferences"
                checked={useProfilePreferences}
                onChange={(e) => setUseProfilePreferences(e.target.checked)}
                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300 focus:ring-2"
                disabled={isGenerating}
              />
              <Label
                htmlFor="use-profile-preferences"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use my profile preferences
              </Label>
            </div>
            <p className="text-muted-foreground text-xs">
              Automatically apply your dietary preferences, allergens, disliked
              ingredients, and calorie targets from your profile.
            </p>
          </div>

          {/* Profile Preferences Display */}
          {useProfilePreferences && (
            <div className="space-y-3">
              {isLoadingProfile ? (
                <Card className="p-4">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading your preferences...
                  </div>
                </Card>
              ) : profile && hasPreferences ? (
                <Card className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold">
                      Your Preferences Will Be Applied
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {profile.diets.length > 0 && (
                      <div>
                        <span className="font-medium">
                          Dietary preferences:
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {profile.diets.join(', ')}
                        </span>
                      </div>
                    )}
                    {profile.allergens.length > 0 && (
                      <div>
                        <span className="font-medium">Allergens to avoid:</span>{' '}
                        <span className="text-muted-foreground">
                          {profile.allergens.join(', ')}
                        </span>
                      </div>
                    )}
                    {profile.dislikedIngredients.length > 0 && (
                      <div>
                        <span className="font-medium">
                          Disliked ingredients:
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {profile.dislikedIngredients.join(', ')}
                        </span>
                      </div>
                    )}
                    {profile.calorieTarget !== null && (
                      <div>
                        <span className="font-medium">Calorie target:</span>{' '}
                        <span className="text-muted-foreground">
                          ~{profile.calorieTarget} calories per serving
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ) : profile && !hasPreferences ? (
                <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        No preferences set
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        You have not set any dietary preferences in your profile
                        yet. Consider adding some preferences or provide custom
                        instructions below.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-yellow-800 dark:text-yellow-200"
                        onClick={() => {
                          onOpenChange(false);
                          window.location.href = '/profile';
                        }}
                      >
                        Go to Profile →
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Profile not found
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Unable to load your profile. You can still provide
                        custom instructions below.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="custom-prompt"
              placeholder="e.g., make it spicier, use less oil, add more vegetables, make it gluten-free, create a vegetarian version..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isGenerating || isLoadingRecipe}
              rows={4}
              className="resize-none"
            />
            <p className="text-muted-foreground text-xs">
              Add any specific modifications or instructions you would like the
              AI to apply when creating the new recipe.
            </p>
          </div>

          {/* Info Card */}
          <Card className="bg-muted/50 p-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">How it works:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1">
                <li>
                  The AI will create a new recipe inspired by the current recipe
                </li>
                <li>
                  Your preferences and custom instructions will be applied
                  automatically
                </li>
                <li>
                  The generated recipe will open in the recipe editor where you
                  can review and save it
                </li>
              </ul>
            </div>
          </Card>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isLoadingRecipe ||
              (!useProfilePreferences && !customPrompt.trim())
            }
            className="ai-generation-button gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate New Recipe
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
