import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export interface SearchBarProps {
  initialQuery: string
  onSearch: (query: string) => void
}

export function SearchBar({ initialQuery, onSearch }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(initialQuery)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, onSearch])

  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search recipes..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-10"
        aria-label="Search recipes"
      />
    </div>
  )
}

