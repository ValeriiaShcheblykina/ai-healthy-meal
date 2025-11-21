import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { RecipeListItemDTO } from '@/types';

export interface RecipeFormData {
  title: string;
  content: string;
}

interface RecipeFormProps {
  initialData?: RecipeListItemDTO;
  onSubmit: (data: RecipeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function RecipeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: RecipeFormProps) {
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [content, setContent] = React.useState(initialData?.content || '');
  const [errors, setErrors] = React.useState<{
    title?: string;
    content?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be at most 200 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length > 50000) {
      newErrors.content = 'Content must be at most 50,000 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div className="space-y-2">
        <label
          htmlFor="recipe-title"
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="recipe-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter recipe title"
          disabled={isSubmitting}
          className={errors.title ? 'border-destructive' : ''}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-destructive text-sm">
            {errors.title}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          {title.length}/200 characters
        </p>
      </div>

      {/* Content Field */}
      <div className="space-y-2">
        <label
          htmlFor="recipe-content"
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Recipe Content <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="recipe-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter recipe ingredients, instructions, and notes"
          disabled={isSubmitting}
          className={`min-h-[300px] ${errors.content ? 'border-destructive' : ''}`}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? 'content-error' : undefined}
        />
        {errors.content && (
          <p id="content-error" className="text-destructive text-sm">
            {errors.content}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          {content.length}/50,000 characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : initialData ? (
            'Update Recipe'
          ) : (
            'Create Recipe'
          )}
        </Button>
      </div>
    </form>
  );
}
