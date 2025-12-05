import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  'aria-label'?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = 'Type an item and click Add, or press Enter',
  disabled = false,
  className,
  label,
  error,
  'aria-label': ariaLabel,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');

  const addTags = React.useCallback(
    (value: string) => {
      if (!value.trim()) return;

      // Support comma-separated values
      const newTags = value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && !tags.includes(tag));

      if (newTags.length > 0) {
        onTagsChange([...tags, ...newTags]);
        setInputValue('');
      }
    },
    [tags, onTagsChange]
  );

  const handleAddClick = () => {
    addTags(inputValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTags(inputValue);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Input and Add button */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1',
            error && 'border-destructive focus-visible:ring-destructive/20'
          )}
          aria-label={ariaLabel || label || 'Add item'}
        />
        <Button
          type="button"
          onClick={handleAddClick}
          disabled={disabled || !inputValue.trim()}
          size="default"
          className="shrink-0"
          aria-label="Add item"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Add</span>
        </Button>
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="border-input bg-muted/30 flex min-h-[3rem] flex-wrap gap-2 rounded-md border p-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-primary/20 focus-visible:ring-primary/50 rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="space-y-1">
        {error && <p className="text-destructive text-xs">{error}</p>}
        {!error && tags.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {tags.length} item{tags.length !== 1 ? 's' : ''} added. Click × to
            remove.
          </p>
        )}
        {!error && tags.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Type items separated by commas or add them one by one
          </p>
        )}
      </div>
    </div>
  );
}
