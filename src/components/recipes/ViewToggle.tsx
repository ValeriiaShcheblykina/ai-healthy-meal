import { Button } from '@/components/ui/button';
import { Grid3x3, List } from 'lucide-react';

export type RecipesListViewMode = 'grid' | 'list';

export interface ViewToggleProps {
  viewMode: RecipesListViewMode;
  onViewModeChange: (mode: RecipesListViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('grid')}
        className="h-7 w-7"
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('list')}
        className="h-7 w-7"
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
