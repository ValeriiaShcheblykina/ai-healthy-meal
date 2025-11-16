import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { RecipeListQueryParams } from '@/types';

export interface SortDropdownProps {
  sort: RecipeListQueryParams['sort'];
  order: RecipeListQueryParams['order'];
  onSortChange: (
    sort: RecipeListQueryParams['sort'],
    order: RecipeListQueryParams['order']
  ) => void;
}

export function SortDropdown({ sort, order, onSortChange }: SortDropdownProps) {
  const sortOptions: {
    value: RecipeListQueryParams['sort'];
    label: string;
  }[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Modified' },
    { value: 'title', label: 'Title' },
  ];

  const handleToggleOrder = () => {
    onSortChange(sort ?? 'created_at', order === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (newSort: RecipeListQueryParams['sort']) => {
    onSortChange(newSort, order ?? 'desc');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          data-testid="recipes-sort-select"
          value={sort}
          onChange={(e) =>
            handleSortChange(e.target.value as RecipeListQueryParams['sort'])
          }
          className="border-input focus-visible:ring-ring h-9 appearance-none rounded-md border bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Sort recipes by"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" />
      </div>
      <Button
        variant="outline"
        size="icon"
        data-testid="recipes-sort-order-toggle"
        onClick={handleToggleOrder}
        aria-label={`Sort ${order === 'asc' ? 'ascending' : 'descending'}`}
      >
        {order === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
