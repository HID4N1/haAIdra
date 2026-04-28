import React from 'react';
import { cn } from '../../lib/utils';

export const Spinner = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-500',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-96">
    <Spinner size="lg" />
  </div>
);

export const InlineSpinner = ({ text }) => (
  <div className="flex items-center space-x-2">
    <Spinner size="sm" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);
