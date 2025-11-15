import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

export interface SkeletonLoaderProps {
  viewMode: 'grid' | 'list';
}

export function SkeletonLoader({ viewMode }: SkeletonLoaderProps) {
  const skeletonCount = 8;

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="py-4">
              <Skeleton className="mb-2 h-6 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
