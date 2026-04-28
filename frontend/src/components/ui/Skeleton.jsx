import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn('animate-pulse rounded-md bg-gray-200', className)}
    {...props}
  />
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className={cn(
              'h-4 flex-1',
              colIndex === 0 && 'w-24',
              colIndex === columns - 1 && 'w-16'
            )}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ className }) => (
  <div className={cn('space-y-4', className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);

export const KPICardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <Skeleton className="h-4 w-20 mb-2" />
    <Skeleton className="h-8 w-16 mb-1" />
    <Skeleton className="h-3 w-24" />
  </div>
);
