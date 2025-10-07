import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-[500px] rounded-lg border bg-muted">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] rounded-lg border bg-card p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-[200px] w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}
