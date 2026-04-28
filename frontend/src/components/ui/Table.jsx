import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Table = ({ children, className, ...props }) => (
  <div className="overflow-x-auto">
    <table className={cn('min-w-full divide-y divide-gray-200', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className, ...props }) => (
  <thead className={cn('bg-gray-50', className)} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className, ...props }) => (
  <tbody className={cn('bg-white divide-y divide-gray-200', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className, delay = 0, ...props }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay: delay * 0.05 }}
    className={cn('hover:bg-gray-50', className)}
    {...props}
  >
    {children}
  </motion.tr>
);

export const TableHead = ({ children, sortable = false, onSort, sortDirection, className, ...props }) => {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        sortable && 'cursor-pointer hover:bg-gray-100',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={cn(
                'w-3 h-3 -mb-1',
                sortDirection === 'asc' ? 'text-primary-500' : 'text-gray-300'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg
              className={cn(
                'w-3 h-3',
                sortDirection === 'desc' ? 'text-primary-500' : 'text-gray-300'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
};

export const TableCell = ({ children, className, ...props }) => (
  <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', className)} {...props}>
    {children}
  </td>
);

export const Pagination = ({ currentPage, totalPages, onPageChange, className, ...props }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
  );

  return (
    <div className={cn('flex items-center justify-between px-6 py-3 bg-white border-t', className)} {...props}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {visiblePages.map((page, index) => (
              <React.Fragment key={page}>
                {index > 0 && visiblePages[index - 1] !== page - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === currentPage
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
