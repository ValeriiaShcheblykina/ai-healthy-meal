import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface SearchBarProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ initialQuery, onSearch }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(initialQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch]);

  return (
    <div className="relative w-full sm:w-80">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="search"
        data-testid="recipes-search-input"
        placeholder="Search recipes..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-10"
        aria-label="Search recipes"
      />
    </div>
  );
}
