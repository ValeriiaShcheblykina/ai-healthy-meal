import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationDTO } from '@/types';

export interface PaginationControlsProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  pagination,
  onPageChange,
}: PaginationControlsProps) {
  const { page, total_pages } = pagination;

  // Don't show pagination if there's only one page
  if (total_pages <= 1) {
    return null;
  }

  // Calculate visible page numbers (show max 5 pages)
  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(total_pages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-1"
      role="navigation"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {visiblePages[0] > 1 && (
        <>
          <Button variant="outline" onClick={() => onPageChange(1)}>
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="text-muted-foreground px-2">...</span>
          )}
        </>
      )}

      {visiblePages.map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === page ? 'default' : 'outline'}
          onClick={() => onPageChange(pageNum)}
          aria-label={`Page ${pageNum}`}
          aria-current={pageNum === page ? 'page' : undefined}
        >
          {pageNum}
        </Button>
      ))}

      {visiblePages[visiblePages.length - 1] < total_pages && (
        <>
          {visiblePages[visiblePages.length - 1] < total_pages - 1 && (
            <span className="text-muted-foreground px-2">...</span>
          )}
          <Button variant="outline" onClick={() => onPageChange(total_pages)}>
            {total_pages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page === total_pages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
