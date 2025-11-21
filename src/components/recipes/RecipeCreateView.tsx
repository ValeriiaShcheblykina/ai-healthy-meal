import * as React from 'react';
import { Card } from '@/components/ui/card';
import { RecipeForm, type RecipeFormData } from './RecipeForm';
import { ToastProvider, useToast } from '@/components/ui/toast';

function RecipeCreateViewInner() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (data: RecipeFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create recipe');
      }

      const newRecipe = await response.json();

      addToast({
        title: 'Success',
        description: 'Recipe created successfully',
        variant: 'default',
      });

      // Redirect to the new recipe
      setTimeout(() => {
        window.location.href = `/recipes/${newRecipe.id}`;
      }, 500);
    } catch (error) {
      console.error('Error creating recipe:', error);
      addToast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create recipe',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/recipes';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Add a new recipe to your collection
        </p>
      </div>

      <Card className="p-6">
        <RecipeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </Card>
    </div>
  );
}

export function RecipeCreateView() {
  return (
    <ToastProvider>
      <RecipeCreateViewInner />
    </ToastProvider>
  );
}
