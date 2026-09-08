import React from 'react';
import clsx from 'clsx';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={clsx("skeleton-shimmer rounded-xl", className)}
      {...props}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
};
