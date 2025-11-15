import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { RecipeListQueryParams } from '@/types'

export interface SortDropdownProps {
  sort: RecipeListQueryParams['sort']
  order: RecipeListQueryParams['order']
  onSortChange: (sort: RecipeListQueryParams['sort'], order: RecipeListQueryParams['order']) => void
}

export function SortDropdown({ sort, order, onSortChange }: SortDropdownProps) {
  const sortOptions: Array<{ value: RecipeListQueryParams['sort']; label: string }> = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Modified' },
    { value: 'title', label: 'Title' },
  ]

  const handleToggleOrder = () => {
    onSortChange(sort!, order === 'asc' ? 'desc' : 'asc')
  }

  const handleSortChange = (newSort: RecipeListQueryParams['sort']) => {
    onSortChange(newSort, order!)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as RecipeListQueryParams['sort'])}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8 appearance-none"
          aria-label="Sort recipes by"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleOrder}
        aria-label={`Sort ${order === 'asc' ? 'ascending' : 'descending'}`}
      >
        {order === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </Button>
    </div>
  )
}

